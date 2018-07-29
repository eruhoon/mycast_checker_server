import { DatabaseManager } from "./manager/DatabaseManager";

import * as Socketio from 'socket.io';
import { StreamSet } from "./model/Stream";
import { Checker } from "./Checker";
import * as https from "https";
import * as http from "http";



export class SocketManager {

	private mSocketio: Socketio.Server;

	public constructor(http: http.Server | https.Server) {
		this.mSocketio = Socketio(http);
		this.mSocketio.on('connection', (socket) => {
			let keyHash = socket.handshake.query.keyhash;

			// Abnormal Connection
			if (!keyHash) socket.disconnect();
			DatabaseManager.getInstance().searchUserByHash(keyHash, (userInfo) => {
				if (!userInfo) { socket.disconnect(); }
			});
			// Init
			socket.emit(SocketTag.REFRESH_STREAMS, Checker.getStreams());
		});
	}

	public refreshStreams(streams: StreamSet) {
		this.mSocketio.emit(SocketTag.REFRESH_STREAMS, streams);
	}

}

enum SocketTag {
	REFRESH_STREAMS = 'refresh_streams'
}