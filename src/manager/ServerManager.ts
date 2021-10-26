import * as dotenv from 'dotenv';
import * as Express from 'express';
import { readFileSync } from 'fs';
import * as http from 'http';
import * as https from 'https';

import { Config } from '../config/Config';
import { Logger } from '../model/common/logger/Logger';

export class ServerManager {
  static #instance: ServerManager | null = null;

  #logger = new Logger('ServerManager');
  #app: Express.Express;
  #server: https.Server | http.Server;

  constructor() {
    dotenv.config();

    this.#app = Express();

    const key = process.env.SSL_PRIVKEY;
    const cert = process.env.SSL_CERT;
    const ca = process.env.SSL_FULLCHAIN;

    if (!key || !cert || !ca) {
      throw new Error('ServerManager: environment value not set');
    }

    if (Config.isHttpsEnabled()) {
      this.#server = https.createServer(
        {
          key: readFileSync(key),
          cert: readFileSync(cert),
          ca: readFileSync(ca),
        },
        this.#app
      );
    } else {
      this.#server = http.createServer(this.#app);
    }

    this.#app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (typeof origin === 'string' && this.#isWhiteList(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      }
      res.header('Access-Control-Allow-Credentials', 'true');
      next();
    });
  }

  start(port: number = Config.DEFAULT_PORT) {
    if (!this.#server) return;
    this.#server.listen(port, () => {
      this.#logger.log('Stream Checker started..');
    });
  }

  // TODO: Any
  get(
    path: string,
    callback: (req: Express.Request, re: Express.Response) => void
  ) {
    if (!this.#app) return;
    this.#app.get(path, callback);
  }

  getServer(): https.Server | http.Server {
    return this.#server;
  }

  #isWhiteList(host: string): boolean {
    const whiteList = [
      'http://localhost:4200',
      'http://mycast.xyz',
      'http://mycast.xyz:10080',
    ];
    return whiteList.indexOf(host) > -1;
  }

  static getInstance(): ServerManager {
    if (this.#instance === null) this.#instance = new ServerManager();
    return this.#instance;
  }
}
