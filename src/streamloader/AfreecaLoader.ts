import * as request from "request";

import { StreamInfo, StreamPlatform } from "../model/Stream";
import { StreamLoader, StreamLoaderCallback } from "./StreamLoader";

export class AfreecaLoader extends StreamLoader {
    public mId: string;

    public constructor(id: string) {
        super();
        this.mId = id;
    }

    public requestInfo(callback: StreamLoaderCallback): void {
        const url = "http://sch.afreeca.com/api.php";

        const opt = {
            timeout: 3000,
            json: true,
            qs: {
                m: "liveSearch",
                v: "1.0",
                szOrder: "",
                c: "EUC-KR",
                szKeyword: this.mId,
            },
        };

        request.get(url, opt, (err, res, body: RawAfreecaInfo) => {
            if (err || res.statusCode !== 200 || !body) {
                console.error("AfreecaLoader: Request Error", err);
                return;
            }

            const realBroad = body.REAL_BROAD.find(
                (e) => e.user_id === this.mId
            );
            if (!realBroad) {
                return;
            }

            const id = realBroad.user_id;
            const broadNo = realBroad.broad_no;
            const prefix = id.substring(0, 2);

            const stream: StreamInfo = {
                result: true,
                platform: StreamPlatform.AFREECA,
                keyid: realBroad.user_id,
                icon: `http://stimg.afreeca.com/LOGO/${prefix}/${id}/${id}.jpg`,
                nickname: realBroad.user_nick,
                title: realBroad.station_name,
                description: realBroad.broad_title,
                url: `http://play.afreeca.com/${id}/embed`,
                thumbnail: `https://liveimg.afreecatv.com/${broadNo}_240x135.gif`,
                onair: true,
                viewer: parseInt(realBroad.total_view_cnt),
            };

            callback(stream);
        });
    }
}

interface RawAfreecaInfo {
    REAL_BROAD: [
        {
            user_id: string;
            user_nick: string;
            broad_no: string;
            station_name: string;
            broad_title: string;
            sn_url: string;
            total_view_cnt: string;
        }
    ];
}
