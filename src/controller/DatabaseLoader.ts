import * as dotenv from 'dotenv';
import * as Mysql from 'mysql';
import { Logger } from '../model/common/logger/Logger';

import { StreamRow, UserRow } from '../model/Database';
import { StreamPlatform } from '../model/Stream';
import { User } from '../model/User';
import { IUserAsyncLoader } from './IUserAsyncLoader';

export class DatabaseLoader implements IUserAsyncLoader {
  #logger: Logger = new Logger('DatabaseLoader');
  #db: Mysql.Connection;

  constructor() {
    dotenv.config();

    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;

    if (!user || !password || !database) {
      throw new Error('database has not set');
    }

    this.#db = Mysql.createConnection({
      user,
      password,
      database,
    });
  }

  async getStreamIds(platform: StreamPlatform): Promise<string[]> {
    const keywordsFromUser: string[] = (await this.getUsers())
      .filter((u) => u.getStreamPlatform() === platform)
      .map((u) => u.getStreamKeyId());

    const keywordsFromStream: string[] = (await this.getStreams())
      .filter((stream) => stream.platform === platform)
      .map((stream) => stream.keyword);

    const keywords: string[] = [];
    const addWithoutDuplicated = (keyword: string) => {
      if (!keyword) return;
      if (keywords.findIndex((k) => k === keyword) !== -1) return;
      keywords.push(keyword);
    };
    keywordsFromUser.forEach((keyword) => addWithoutDuplicated(keyword));
    keywordsFromStream.forEach((keyword) => addWithoutDuplicated(keyword));

    return keywords;
  }

  getStreams(): Promise<StreamRow[]> {
    const query = 'SELECT keyid as keyword, platform FROM stream';
    return new Promise((resolve, reject) => {
      this.#db.query(query, (err, result) => {
        if (err) {
          this.#logger.error(`DatabaseLoader#getStreams: DB error ${err}`);
          resolve([]);
          return;
        }
        resolve(result);
      });
    });
  }

  getUsers(): Promise<User[]> {
    const query = `SELECT * FROM user WHERE confirm = 1`;
    return new Promise<User[]>((resolve) => {
      this.#db.query(query, (err, result: UserRow[]) => {
        if (err) {
          this.#logger.error(`DatabaseLoader#getUsers: DB error ${err}`);
          resolve([]);
          return;
        }
        const users: User[] = result.map((row) => User.createWithRow(row));
        resolve(users);
      });
    });
  }

  getUserByPrivKey(privKey: string): Promise<User | null> {
    const query = 'SELECT * FROM user WHERE private_key = ? AND confirm = 1';
    return new Promise((resolve, reject) => {
      this.#db.query(query, [privKey], (err, result: UserRow[]) => {
        if (err) {
          this.#logger.error(`DatabaseLoader#getUsers: DB error ${err}`);
          resolve(null);
          return;
        }
        if (result.length === 0) {
          this.#logger.error('no result');
          resolve(null);
          return;
        }
        const user: User = User.createWithRow(result[0]);
        resolve(user);
      });
    });
  }

  getUserByHash(hash: string): Promise<User | null> {
    const query = 'SELECT * FROM user WHERE hash = ? AND confirm = 1';

    return new Promise((resolve, reject) => {
      this.#db.query(query, ['hash'], (err, result: UserRow[]) => {
        if (err) {
          this.#logger.error(`DatabaseLoader#getUsers: DB error ${err}`);
          resolve(null);
          return;
        }
        if (result.length === 0) {
          this.#logger.error('no result');
          resolve(null);
          return;
        }
        const user: User = User.createWithRow(result[0]);
        resolve(user);
      });
    });
  }

  searchUserByHash(hash: string, callback: (user: User | null) => void) {
    const query = 'SELECT * FROM user WHERE hash = ? AND confirm = 1';
    this.#db.query(query, [hash], (err, result: UserRow[]) => {
      if (err) {
        this.#logger.error(`DatabaseLoader#getUsers: DB error ${err}`);
        callback(null);
        return;
      }
      if (!result) {
        callback(null);
        return;
      }
      if (result.length === 0) {
        callback(null);
        return;
      }
      const user: User = User.createWithRow(result[0]);
      callback(user);
    });
  }
}
