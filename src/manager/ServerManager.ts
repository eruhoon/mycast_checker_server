import { Config } from '../config/Config';
import * as Express from 'express';
import * as http from 'http';
import * as https from 'https';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

export class ServerManager {

	private static ENABLE_HTTPS: boolean = true;

	private static sInstance: ServerManager = null;

	public static getInstance(): ServerManager {
		if (this.sInstance === null) this.sInstance = new ServerManager();
		return this.sInstance;
	}

	private mApp: Express.Express;
	private mServer: https.Server | http.Server;

	public constructor() {
		dotenv.config();

		this.mApp = Express();

		const key: string = process.env.SSL_PRIVKEY;
		const cert: string = process.env.SSL_CERT;

		if (ServerManager.ENABLE_HTTPS) {
			this.mServer = https.createServer({
				key: readFileSync(key),
				cert: readFileSync(cert)
			}, this.mApp);
		} else {
			this.mServer = http.createServer(this.mApp);
		}


		this.mApp.use((req, res, next) => {
			res.header('Access-Control-Allow-Origin', 'http://mycast.xyz');
			res.header('Access-Control-Allow-Credentials', 'true');
			next();
		});
	}


	public start(port: number = Config.DEFAULT_PORT) {
		if (!this.mServer) return;

		this.mServer.listen(port, () => {
			console.log('Stream Checker started..');
		});
	}

	// TODO: Any
	public get(path: string,
		callback: (req: Express.Request, re: Express.Response) => void) {

		if (!this.mApp) return;
		this.mApp.get(path, callback);
	};

	public getServer(): https.Server | http.Server {
		return this.mServer
	}

}