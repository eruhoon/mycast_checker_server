import { Checker } from './Checker';
import { ServerManager } from './manager/ServerManager';
import { WowzaCacheManager } from './manager/cache/WowzaCacheManager';
import { TwitchCacheManager } from './manager/cache/TwitchCacheManager';
import { StreamPlatform } from './model/Stream';
import { YoutubeCacheManager } from './manager/cache/YoutubeCacheManager';
import { SocketManager, SocketTag } from './SocketManager';
import { DatabaseLoader } from './controller/DatabaseLoader';
import { Config } from './config/Config';
import { IUserAsyncLoader } from './controller/IUserAsyncLoader';
import { DummyUserAsyncLoader } from './controller/DummyUserAsyncLoader';
import { IStreamAsyncLoader } from './controller/IStreamAsyncLoader';
import { DummyStreamAsyncLoader } from './controller/DummyStreamAsyncLoader';

export class StreamCheckerServer {

	public static main() {

		const serverManager: ServerManager = ServerManager.getInstance();

		const databaseLoader = new DatabaseLoader();
		let userLoader: IUserAsyncLoader;
		let streamLoader: IStreamAsyncLoader;
		if (Config.isDebugMode()) {
			userLoader = new DummyUserAsyncLoader();
			streamLoader = new DummyStreamAsyncLoader();
		} else {
			userLoader = databaseLoader;
			streamLoader = databaseLoader;
		}

		WowzaCacheManager.getInstance().start();
		TwitchCacheManager.getInstance().setUserLoader(userLoader);
		TwitchCacheManager.getInstance().setStreamLoader(streamLoader);
		TwitchCacheManager.getInstance().start();
		YoutubeCacheManager.getInstance().setUserLoader(userLoader);
		YoutubeCacheManager.getInstance().setStreamLoader(streamLoader);
		YoutubeCacheManager.getInstance().start(60000);

		const checker = new Checker();

		serverManager.get('/stream/', (req, res) => {
			let streams = checker.getStreams();
			res.json(streams);
		});

		serverManager.get('/local/', (req, res) => {
			let streams = checker.getStreams().local;
			res.json(streams);
		});

		serverManager.get('/external/', (req, res) => {
			let streams = checker.getStreams().external;
			res.json(streams);
		});

		serverManager.get('/twitch/', (req, res) => {
			let streams = checker.getStreams().external.filter((e) => {
				return e.platform === StreamPlatform.TWITCH;
			});
			res.json(streams);
		});

		serverManager.start();

		let server = serverManager.getServer();

		let socketManager = new SocketManager(server, userLoader);
		socketManager.init(socket => {
			console.log('REFRESH_STREAMS');
			socket.emit(SocketTag.REFRESH_STREAMS, checker.getStreams());
		});

		checker.update(userLoader, streamLoader);
		socketManager.refreshStreams(checker.getStreams());
		setInterval(() => {
			checker.update(userLoader, streamLoader);
			socketManager.refreshStreams(checker.getStreams());
		}, 20000);

	}
}