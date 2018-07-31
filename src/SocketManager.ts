import { DatabaseManager } from "./manager/DatabaseManager";

import * as Socketio from 'socket.io';
import { StreamSet } from "./model/Stream";
import * as https from "https";
import * as http from "http";
import { IUserAsyncLoader } from "./controller/IUserAsyncLoader";

type SocketCallback = (socket: Socketio.Socket) => void;

export enum SocketTag {
	REFRESH_STREAMS = 'refresh_streams'
}

export class SocketManager {

	private mUserLoader: IUserAsyncLoader;

	private mSocketio: Socketio.Server;

	public constructor(
		http: http.Server | https.Server, userLoader: IUserAsyncLoader) {

		this.mSocketio = Socketio(http);
		this.mUserLoader = userLoader;
	}

	public init(initCallback: SocketCallback) {
		this.mSocketio.on('connection', async socket => {
			let keyHash = socket.handshake.query.keyhash;

			// Abnormal Connection
			if (!keyHash) socket.disconnect();
			const users = await this.mUserLoader.getUsers();
			const user = users.find(user => user.getHash() === keyHash);
			if (!user) {
				socket.disconnect();
			} else {
				initCallback(socket);
			}
		});
	}

	public refreshStreams(streams: StreamSet) {
		this.mSocketio.emit(SocketTag.REFRESH_STREAMS, streams);
	}

}
