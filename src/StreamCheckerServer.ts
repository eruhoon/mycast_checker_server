import { Checker } from './Checker';
import { ServerManager } from './manager/ServerManager';
import { WowzaCacheManager } from './manager/cache/WowzaCacheManager';
import { TwitchCacheManager } from './manager/cache/TwitchCacheManager';
import { StreamPlatform } from './model/Stream';
import { YoutubeCacheManager } from './manager/cache/YoutubeCacheManager';
import { SocketManager } from './SocketManager';

export class StreamCheckerServer {

	public static main() {

		const serverManager: ServerManager = ServerManager.getInstance();

		WowzaCacheManager.getInstance().start();
		TwitchCacheManager.getInstance().start();
		YoutubeCacheManager.getInstance().start(60000);

		serverManager.get('/stream/', (req, res) => {
			let streams = Checker.getStreams();
			res.json(streams);
		});

		serverManager.get('/local/', (req, res) => {
			let streams = Checker.getStreams().local;
			res.json(streams);
		});

		serverManager.get('/external/', (req, res) => {
			let streams = Checker.getStreams().external;
			res.json(streams);
		});

		serverManager.get('/twitch/', (req, res) => {
			let streams = Checker.getStreams().external.filter((e) => {
				return e.platform === StreamPlatform.TWITCH;
			});
			res.json(streams);
		});

		serverManager.start();


		let server = serverManager.getServer();

		let socketManager = new SocketManager(server);

		Checker.update();
		socketManager.refreshStreams(Checker.getStreams());
		setInterval(function () {
			Checker.update();
			socketManager.refreshStreams(Checker.getStreams());
		}, 20000);

	}
}