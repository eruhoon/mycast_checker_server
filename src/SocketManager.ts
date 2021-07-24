import * as http from 'http';
import * as https from 'https';
import * as Socketio from 'socket.io';

import { IUserAsyncLoader } from './controller/IUserAsyncLoader';
import { StreamInfo, StreamSet } from './model/Stream';

type SocketCallback = (socket: Socketio.Socket) => void;

export enum SocketTag {
  REFRESH_STREAMS = 'refresh_streams',
  NEW_STREAM_NOTIFICATION = 'new_stream_notification',
}

export class SocketManager {
  #userLoader: IUserAsyncLoader;

  #socketio: Socketio.Server;

  constructor(http: http.Server | https.Server, userLoader: IUserAsyncLoader) {
    this.#socketio = Socketio(http);
    this.#userLoader = userLoader;
  }

  init(initCallback: SocketCallback) {
    this.#socketio.on('connection', async (socket) => {
      const keyHash = socket.handshake.query.keyhash;
      const privateKey = socket.handshake.query.key;

      // Abnormal Connection
      if (!keyHash && !privateKey) socket.disconnect();

      if (privateKey) {
        const user = await this.#userLoader.getUserByPrivKey(privateKey);
        if (!user) {
          socket.disconnect();
        } else {
          initCallback(socket);
        }
      } else {
        // DEPRECATED MODULE
        const users = await this.#userLoader.getUsers();
        const user = users.find((user) => user.getHash() === keyHash);
        if (!user) {
          socket.disconnect();
        } else {
          initCallback(socket);
        }
      }
    });
  }

  refreshStreams(streams: StreamSet) {
    this.#socketio.emit(SocketTag.REFRESH_STREAMS, streams);
  }

  notificationNewStream(stream: StreamInfo): void {
    this.#socketio.emit(SocketTag.NEW_STREAM_NOTIFICATION, stream);
  }
}
