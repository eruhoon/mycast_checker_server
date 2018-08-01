import * as request from 'request';
import { StreamLoader, StreamLoaderCallback } from "./StreamLoader";
import { StreamInfo, StreamPlatform } from '../model/Stream';

export class AfreecaLoader extends StreamLoader {

	public mId: string;

	public constructor(id: string) {
		super();
		this.mId = id;
	}

	public requestInfo(callback: StreamLoaderCallback): void {

		const url = 'http://sch.afreeca.com/api.php';

		const opt = {
			timeout: 3000,
			json: true,
			qs: {
				m: 'liveSearch',
				v: '1.0',
				szOrder: '',
				c: 'EUC-KR',
				szKeyword: this.mId,
			}
		}

		request.get(url, opt, (err, res, body: RawAfreecaInfo) => {
			if (err || res.statusCode !== 200 || !body) {
				console.error('AfreecaLoader: Request Error', err);
				return;
			}

			let realBroad = body.REAL_BROAD.find((e) => { return e.user_id === this.mId; });
			if (!realBroad) {
				return;
			}

			const id = realBroad.user_id;
			const prefix = id.substring(0, 2);

			let stream: StreamInfo = {
				result: true,
				platform: StreamPlatform.AFREECA,
				keyid: realBroad.user_id,
				icon: `http://stimg.afreeca.com/LOGO/${prefix}/${id}/${id}.jpg`,
				nickname: realBroad.user_nick,
				title: realBroad.station_name,
				description: realBroad.broad_title,
				url: `http://play.afreeca.com/${id}/embed`,
				thumbnail: realBroad.sn_url + '?' + new Date().getTime(),
				onair: true,
				viewer: parseInt(realBroad.total_view_cnt)
			}

			callback(stream);
		});
	}
}

type RawAfreecaInfo = {
	REAL_BROAD: [{
		user_id: string,
		user_nick: string,
		station_name: string,
		broad_title: string,
		sn_url: string,
		total_view_cnt: string
	}]
};