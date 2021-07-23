import * as dotenv from 'dotenv';
import * as Express from 'express';
import { readFileSync } from 'fs';
import * as http from 'http';
import * as https from 'https';

import { Config } from '../config/Config';

export class ServerManager {
  private static sInstance: ServerManager | null = null;

  private mApp: Express.Express;
  private mServer: https.Server | http.Server;

  public constructor() {
    dotenv.config();

    this.mApp = Express();

    const key = process.env.SSL_PRIVKEY;
    const cert = process.env.SSL_CERT;

    if (!key || !cert) {
      throw new Error('ServerManager: environment value not set');
    }

    if (Config.isHttpsEnabled()) {
      this.mServer = https.createServer(
        {
          key: readFileSync(key),
          cert: readFileSync(cert),
        },
        this.mApp
      );
    } else {
      this.mServer = http.createServer(this.mApp);
    }

    this.mApp.use((req, res, next) => {
      const origin = req.headers.origin;
      if (typeof origin === 'string' && this.isWhiteList(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      }
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
  public get(
    path: string,
    callback: (req: Express.Request, re: Express.Response) => void
  ) {
    if (!this.mApp) return;
    this.mApp.get(path, callback);
  }

  public getServer(): https.Server | http.Server {
    return this.mServer;
  }

  private isWhiteList(host: string): boolean {
    const whiteList = [
      'http://localhost:4200',
      'http://mycast.xyz',
      'http://mycast.xyz:10080',
    ];
    return whiteList.indexOf(host) > -1;
  }

  public static getInstance(): ServerManager {
    if (this.sInstance === null) this.sInstance = new ServerManager();
    return this.sInstance;
  }
}
