import * as dotenv from 'dotenv';
import * as request from 'request';
import * as xml2js from 'xml2js';
import { RawWowzaModel, RawWowzaStream } from '../../Model/RawWowzaModel';
import { StreamCacheManager } from './StreamCacheManager';

export class WowzaCacheManager extends StreamCacheManager {

	private static readonly URL: string =
		'http://mycast.xyz:8086/connectioncounts?';

	private static sInstance: WowzaCacheManager = null;

	public static getInstance(): WowzaCacheManager {
		if (this.sInstance === null) {
			this.sInstance = new WowzaCacheManager();
		}
		return this.sInstance;
	}

	private static getRawWowzaXml(): Promise<string> {

		let opt = {
			auth: {
				user: process.env.WOWZA_SERVER_ID,
				pass: process.env.WOWZA_SERVER_PW,
				sendImmediately: false
			},
			timeout: 5000,
			qs: { flat: true }
		};

		return new Promise<string>(resolve => {
			request.get(WowzaCacheManager.URL, opt, (err, res, body) => {
				if (err || res.statusCode !== 200 || !body) {
					console.error('WowzaCacheManager#update: Request Error', err);
					return;
				}

				resolve(body);
			});
		});
	}

	private static parseXml(xml: string): Promise<RawWowzaModel> {
		return new Promise(resolve => {
			try {
				xml2js.parseString(xml, (err, result: RawWowzaModel | null) => {
					if (err) {
						console.error('WowzaCacheManager#parseRaw: Parse Error', err);
						return;
					}

					if (!result) {
						console.error('WowzaCacheManager#parseRaw: Null Result');
						return;
					}

					resolve(result);

				})
			} catch (exception) {
				console.error(`WowzaCacheManager#parseRaw: Exception: ${exception}`);
			}
		});
	}

	private static parseModel(model: RawWowzaModel): RawWowzaStream[] {

		let wowzaServer = model.WowzaMediaServer || model.WowzaStreamingEngine;
		if (!wowzaServer) return [];

		return wowzaServer.Stream.map(streamWrapper => streamWrapper.$);
	}

	private mCaches: RawWowzaStream[];

	private constructor() {
		super();
		dotenv.config();
		this.mCaches = [];
	}

	public getCaches(): RawWowzaStream[] {
		return this.mCaches;
	}

	public async update() {

		let xml = await WowzaCacheManager.getRawWowzaXml();
		let model = await WowzaCacheManager.parseXml(xml);
		let newCaches = WowzaCacheManager.parseModel(model);
		this.mCaches = newCaches;
	}

}