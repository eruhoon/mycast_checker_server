import * as dotenv from 'dotenv';
import * as Mysql from 'mysql';

import { StreamRow, UserRow } from '../model/Database';
import { StreamPlatform } from '../model/Stream';
import { User } from '../model/User';
import { IUserAsyncLoader } from './IUserAsyncLoader';

export class DatabaseLoader implements IUserAsyncLoader {

	private mDb: Mysql.Connection;

	public constructor() {
		dotenv.config();

		const user: string = process.env.DB_USER;
		const password: string = process.env.DB_PASSWORD;
		const database: string = process.env.DB_NAME;

		this.mDb = Mysql.createConnection({
			user, password, database
		});
	}

	public async getStreamIds(platform: StreamPlatform): Promise<string[]> {
		let keywordsFromUser: string[] = (await this.getUsers())
			.filter(u => u.getStreamPlatform() === platform)
			.map(u => u.getStreamKeyId());

		let keywordsFromStream: string[] = (await this.getStreams())
			.filter(stream => stream.platform === platform)
			.map(stream => stream.keyword);

		let keywords: string[] = [];
		let addWithoutDuplicated = (keyword: string) => {
			if (!keyword) return;
			if (keywords.findIndex(k => k === keyword) !== -1) return;
			keywords.push(keyword);
		};
		keywordsFromUser.forEach(keyword => addWithoutDuplicated(keyword));
		keywordsFromStream.forEach(keyword => addWithoutDuplicated(keyword));

		return keywords;
	}

	public getStreams(): Promise<StreamRow[]> {

		const query = 'SELECT keyid as keyword, platform FROM stream';
		return new Promise((resolve, reject) => {
			this.mDb.query(query, (err, result) => {
				if (err) {
					console.error(`DatabaseLoader#getStreams: DB error ${err}`);
					resolve([]);
				}
				resolve(result);
			});
		});
	}

	public getUsers(): Promise<User[]> {
		const query = `SELECT * FROM user WHERE confirm = 1`;
		return new Promise<User[]>(resolve => {
			this.mDb.query(query, (err, result: UserRow[]) => {
				if (err) {
					console.error(`DatabaseLoader#getUsers: DB error ${err}`);
					resolve([]);
				}
				let users: User[] = result.map(row => User.createWithRow(row));
				resolve(users);
			});
		});
	}

	public getUserByPrivKey(privKey: string): Promise<User | null> {
		const query = 'SELECT * FROM user WHERE private_key = ? AND confirm = 1';
		return new Promise((resolve, reject) => {
			this.mDb.query(query, [privKey], (err, result: UserRow[]) => {
				if (err) {
					console.error(`DatabaseLoader#getUsers: DB error ${err}`);
					resolve(null);
				}
				const user: User = User.createWithRow(result[0]);
				resolve(user);
			});
		});
	}

	public getUserByHash(hash: string): Promise<User | null> {
		const query = 'SELECT * FROM user WHERE hash = ? AND confirm = 1';

		return new Promise((resolve, reject) => {
			this.mDb.query(query, ['hash'], (err, result: UserRow[]) => {
				if (err) {
					console.error(`DatabaseLoader#getUsers: DB error ${err}`);
					resolve(null);
				}
				let user: User = User.createWithRow(result[0]);
				resolve(user);
			});
		});
	}

	public searchUserByHash(hash: string, callback: (user: User) => void) {
		const query = 'SELECT * FROM user WHERE hash = ? AND confirm = 1';
		this.mDb.query(query, [hash], (err, result: UserRow[]) => {
			if (err) {
				console.error(`DatabaseLoader#getUsers: DB error ${err}`);
				callback(null);
				return;
			}
			if (!result) {
				callback(null);
				return;
			}
			let user: User = User.createWithRow(result[0]);
			callback(user);
		});
	}
}
