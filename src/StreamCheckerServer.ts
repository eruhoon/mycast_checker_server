import { Config } from './config/Config';
import { DatabaseLoader } from './controller/DatabaseLoader';
import { DummyStreamAsyncLoader } from './controller/DummyStreamAsyncLoader';
import { DummyUserAsyncLoader } from './controller/DummyUserAsyncLoader';
import { IStreamAsyncLoader } from './controller/IStreamAsyncLoader';
import { IUserAsyncLoader } from './controller/IUserAsyncLoader';
import { ServerManager } from './manager/ServerManager';
import { Checker } from './model/checker/Checker';
import { CheckerType } from './model/checker/CheckerEntry';
import { StreamPlatform } from './model/Stream';
import { SocketManager, SocketTag } from './SocketManager';

export class StreamCheckerServer {
  public static main() {
    const sOnTime = new Date().getTime();

    const serverManager: ServerManager = ServerManager.getInstance();

    let userLoader: IUserAsyncLoader;
    let streamLoader: IStreamAsyncLoader;
    if (Config.isDebugMode()) {
      userLoader = new DummyUserAsyncLoader();
      streamLoader = new DummyStreamAsyncLoader();
    } else {
      const databaseLoader = new DatabaseLoader();
      userLoader = databaseLoader;
      streamLoader = databaseLoader;
    }

    const checker = new Checker(userLoader, streamLoader);
    checker.setOnStreamAddCallback((s) => {
      const timestamp = new Date().getTime();
      if (timestamp - sOnTime < 10000) {
        console.warn('added at init: skipped');
        return;
      }

      if (s.getType() !== CheckerType.LOCAL) {
        console.log('added external: skipped');
        return;
      }
      socketManager.notificationNewStream(s.getStream());
    });
    serverManager.get('/stream/', (req, res) => {
      const streams = checker.getStreams();
      res.json(streams);
    });

    serverManager.get('/local/', (req, res) => {
      const streams = checker.getStreams().local;
      res.json(streams);
    });

    serverManager.get('/external/', (req, res) => {
      const streams = checker.getStreams().external;
      res.json(streams);
    });

    serverManager.get('/twitch/', (req, res) => {
      const streams = checker.getStreams().external.filter((e) => {
        return e.platform === StreamPlatform.TWITCH;
      });
      res.json(streams);
    });

    serverManager.start();

    const server = serverManager.getServer();

    const socketManager = new SocketManager(server, userLoader);
    socketManager.init((socket) => {
      socket.emit(SocketTag.REFRESH_STREAMS, checker.getStreams());
    });

    checker.update();
    socketManager.refreshStreams(checker.getStreams());
    setInterval(() => {
      checker.update();
      socketManager.refreshStreams(checker.getStreams());
    }, 10000);
  }
}
