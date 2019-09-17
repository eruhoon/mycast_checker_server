import * as dotenv from 'dotenv';
import * as request from 'request';
import * as xml2js from 'xml2js';

import { RawWowzaModel, RawWowzaStream } from '../../model/RawWowzaModel';
import { StreamCacheContainer } from './StreamCacheContainer';

export class WowzaCacheContainer extends StreamCacheContainer {

	private static readonly URL: string =
		'http://mycast.xyz:8086/connectioncounts?';

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
			request.get(WowzaCacheContainer.URL, opt, (err, res, body) => {
				if (err || res.statusCode !== 200 || !body) {
					console.error('WowzaCacheContainer#update: Request Error', err);
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
						console.error('WowzaCacheContainer#parseRaw: Parse Error', err);
						return;
					}

					if (!result) {
						console.error('WowzaCacheContainer#parseRaw: Null Result');
						return;
					}

					resolve(result);

				})
			} catch (exception) {
				console.error(`WowzaCacheContainer#parseRaw: Exception: ${exception}`);
			}
		});
	}

	private static parseModel(model: RawWowzaModel): RawWowzaStream[] {

		let wowzaServer = model.WowzaMediaServer || model.WowzaStreamingEngine;
		if (!wowzaServer) return [];

		return wowzaServer.Stream.map(streamWrapper => streamWrapper.$);
	}

	private mCaches: RawWowzaStream[];

	public constructor() {
		super();
		dotenv.config();
		this.mCaches = [];
	}

	public getCaches(): RawWowzaStream[] {
		return this.mCaches;
	}

	public async update() {

		let xml = await WowzaCacheContainer.getRawWowzaXml();
		let model = await WowzaCacheContainer.parseXml(xml);
		let newCaches = WowzaCacheContainer.parseModel(model);
		this.mCaches = newCaches;
	}

}
