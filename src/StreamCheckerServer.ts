import { Config } from './config/Config';
import { DatabaseLoader } from './controller/DatabaseLoader';
import { DummyStreamAsyncLoader } from './controller/DummyStreamAsyncLoader';
import { DummyUserAsyncLoader } from './controller/DummyUserAsyncLoader';
import { IStreamAsyncLoader } from './controller/IStreamAsyncLoader';
import { IUserAsyncLoader } from './controller/IUserAsyncLoader';
import { ServerManager } from './manager/ServerManager';
import { Checker } from './model/checker/Checker';
import { CheckerType } from './model/checker/CheckerEntry';
import { Logger } from './model/common/logger/Logger';
import { StreamPlatform } from './model/Stream';
import { SocketManager, SocketTag } from './SocketManager';

const Log = new Logger('StreamCheckerServer');

export class StreamCheckerServer {
  readonly onTime: number;
  readonly userLoader: IUserAsyncLoader;
  readonly streamLoader: IStreamAsyncLoader;
  readonly checker: Checker;

  constructor() {
    this.onTime = new Date().getTime();
    if (Config.isDebugMode()) {
      this.userLoader = new DummyUserAsyncLoader();
      this.streamLoader = new DummyStreamAsyncLoader();
    } else {
      const databaseLoader = new DatabaseLoader();
      this.userLoader = databaseLoader;
      this.streamLoader = databaseLoader;
    }
    this.checker = new Checker(this.userLoader, this.streamLoader);
  }

  main() {
    const serverManager: ServerManager = ServerManager.getInstance();

    this.checker.setOnStreamAddCallback((s) => {
      const timestamp = new Date().getTime();
      if (timestamp - this.onTime < 10000) {
        Log.log('added at init: skipped');
        return;
      }

      if (s.getType() !== CheckerType.LOCAL) {
        Log.log('added external: skipped');
        return;
      }
      socketManager.notificationNewStream(s.getStream());
    });
    serverManager.get('/stream/', (req, res) => {
      const streams = this.checker.getStreams();
      res.json(streams);
    });

    serverManager.get('/local/', (req, res) => {
      const streams = this.checker.getStreams().local;
      res.json(streams);
    });

    serverManager.get('/external/', (req, res) => {
      const streams = this.checker.getStreams().external;
      res.json(streams);
    });

    serverManager.get('/twitch/', (req, res) => {
      const streams = this.checker.getStreams().external.filter((e) => {
        return e.platform === StreamPlatform.TWITCH;
      });
      res.json(streams);
    });

    serverManager.start();

    const server = serverManager.getServer();

    const socketManager = new SocketManager(server, this.userLoader);
    socketManager.init((socket) => {
      socket.emit(SocketTag.REFRESH_STREAMS, this.checker.getStreams());
    });

    this.checker.update();
    socketManager.refreshStreams(this.checker.getStreams());
    setInterval(() => {
      this.checker.update();
      socketManager.refreshStreams(this.checker.getStreams());
    }, 10000);
  }
}
