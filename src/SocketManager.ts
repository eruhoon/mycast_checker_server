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
    private mUserLoader: IUserAsyncLoader;

    private mSocketio: Socketio.Server;

    public constructor(
        http: http.Server | https.Server,
        userLoader: IUserAsyncLoader
    ) {
        this.mSocketio = Socketio(http);
        this.mUserLoader = userLoader;
    }

    public init(initCallback: SocketCallback) {
        this.mSocketio.on('connection', async (socket) => {
            const keyHash = socket.handshake.query.keyhash;
            const privateKey = socket.handshake.query.key;

            // Abnormal Connection
            if (!keyHash && !privateKey) socket.disconnect();

            if (privateKey) {
                const user = await this.mUserLoader.getUserByPrivKey(
                    privateKey
                );
                if (!user) {
                    socket.disconnect();
                } else {
                    initCallback(socket);
                }
            } else {
                // DEPRECATED MODULE
                const users = await this.mUserLoader.getUsers();
                const user = users.find((user) => user.getHash() === keyHash);
                if (!user) {
                    socket.disconnect();
                } else {
                    initCallback(socket);
                }
            }
        });
    }

    public refreshStreams(streams: StreamSet) {
        this.mSocketio.emit(SocketTag.REFRESH_STREAMS, streams);
    }

    public notificationNewStream(stream: StreamInfo): void {
        this.mSocketio.emit(SocketTag.NEW_STREAM_NOTIFICATION, stream);
    }
}
