import * as Mysql from 'mysql';
import * as dotenv from 'dotenv';
import { StreamRow, UserRow } from '../model/Database';
import { User } from '../model/User';
import { StreamPlatform } from '../model/Stream';

export class DatabaseManager {

	private static sInstance: DatabaseManager = null;
	public static getInstance(): DatabaseManager {
		if (this.sInstance === null) {
			this.sInstance = new DatabaseManager();
		}
		return this.sInstance;
	}

	private mDb: Mysql.Connection;

	private constructor() {
		dotenv.config();

		const user: string = process.env.DB_USER;
		const password: string = process.env.DB_PASSWORD;
		const database: string = process.env.DB_NAME;

		this.mDb = Mysql.createConnection({
			user, password, database
		});
	}

	public getDb(): Mysql.Connection {
		return this.mDb;
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
					console.error(`DatabaseManager#getStreams: DB error ${err}`);
					resolve([]);
				}
				resolve(result);
			});
		});
	}

	public getUsers(): Promise<User[]> {

		const query = `SELECT * FROM user WHERE confirm = 1`;
		return new Promise<User[]>((resolve, reject) => {
			this.mDb.query(query, (err, result: UserRow[]) => {
				if (err) {
					console.error(`DatabaseManager#getUsers: DB error ${err}`);
					resolve([]);
				}
				let users: User[] = result.map(row => new User(row));
				resolve(users);
			});
		});
	}

	public getUserByHash(hash: string): Promise<User | null> {
		const query = 'SELECT * FROM user WHERE hash = ? AND confirm = 1';

		return new Promise((resolve, reject) => {
			this.mDb.query(query, ['hash'], (err, result: UserRow[]) => {
				if (err) {
					console.error(`DatabaseManager#getUsers: DB error ${err}`);
					resolve(null);
				}
				console.log(result);
				let user: User = new User(result[0]);
				resolve(user);
			});
		});
	}

	public searchUserByHash(hash: string, callback: (user: User) => void) {
		const query = 'SELECT * FROM user WHERE hash = ? AND confirm = 1';
		this.mDb.query(query, [hash], (err, result: UserRow[]) => {
			if (err) {
				console.error(`DatabaseManager#getUsers: DB error ${err}`);
				callback(null);
				return;
			}
			if (!result) {
				callback(null);
				return;
			}
			let user: User = new User(result[0]);
			callback(user);
		});
	}
}