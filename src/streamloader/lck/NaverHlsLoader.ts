import puppeteer, { Browser, KnownDevices, Page } from 'puppeteer';
import { ExpireCache } from '../../model/cache/ExpireCache';
import { Logger } from '../../model/common/logger/Logger';
import { StreamInfo } from '../../model/Stream';
import { StreamLoader } from '../StreamLoader';

const Log = new Logger('NaverHlsLoader');

export abstract class NaverHlsLoader implements StreamLoader {
  readonly #tag: string;
  readonly #requestUrl: string;
  #resultCache: ExpireCache<string | null>;

  constructor(tag: string, url: string) {
    this.#tag = tag;
    this.#requestUrl = url;
    this.#resultCache = new ExpireCache(null, 0);
  }

  #log(str: string) {
    Log.log(`[${this.#tag}] ${str}`);
  }

  async getInfo(): Promise<StreamInfo | null> {
    if (!this.#resultCache.isStaled()) {
      const result = this.#resultCache.value;
      this.#log(`Cached : ${result}`);
      return this.createResult(result);
    }

    let browser: Browser | null = null;
    try {
      this.#log('Launch browser');
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      this.#log('Find page');
      const page = await this.#goUrl(browser);
      if (!page) {
        return this.createResult(this.#resultCache.value);
      }

      await page.screenshot({ path: 'screenshot.jpg' });

      this.#log('Find SettingControl');
      if (
        !(await this.#findAndClick(page, 'select.pzp-setting-item__select'))
      ) {
        this.saveCache(null);
        return null;
      }

      this.#log('Find ResolutionButton');
      if (!(await this.#findAndClick(page, 'button.nng_btn_panel'))) {
        this.saveCache(null);
        return null;
      }

      this.#log('Find 1080pButton');
      const $resListBtn = await page.$$('.nng_setting_panel li');
      if (!$resListBtn) {
        this.saveCache(null);
        return null;
      }
      await $resListBtn[$resListBtn.length - 1]?.click();

      this.#log('Find m3u8');
      const res = await page.waitForResponse(
        (r) => {
          // console.log(r.url());
          return r.url().includes('.m3u8');
        },
        {
          timeout: 3000,
        }
      );
      const result = res.url() || null;
      if (result) {
        Log.log(`Found : ${result}`);
        this.saveCache(result);
        return this.createResult(result);
      } else {
        return null;
      }
    } catch (e) {
      Log.error(e);
    } finally {
      await browser?.close();
    }
    return null;
  }

  async #goUrl(browser: Browser): Promise<Page | null> {
    try {
      const page = await browser?.newPage();
      // await page.emulate(KnownDevices['Galaxy S9+']);
      await page.goto(this.#requestUrl, { timeout: 5000 });
      await page.waitForNetworkIdle({ timeout: 5000 });
      return page;
    } catch {
      this.#log('Page Load Error');
      return null;
    }
  }

  async #findAndClick(page: Page, selector: string): Promise<boolean> {
    try {
      const $element = await page.$(selector);
      console.log($element);
      if (!$element) {
        this.saveCache(null);
        return false;
      }
      await $element.click();
      return true;
    } catch (e) {
      console.log(e);
      Log.log(`findAndClick: not found ${selector}`);
      return false;
    }
  }

  saveCache(result: string | null) {
    const expireTime: number = 30000;
    this.#resultCache = new ExpireCache(result, expireTime);
  }

  abstract createResult(url: string | null): StreamInfo | null;
}
