import { Config } from '../config/Config';
import { DatabaseManager } from '../manager/DatabaseManager';

let db = DatabaseManager.getInstance().getDb();

exports.rewardStream = (hash: string, viewer: number) => {
	try {

		let REWARD_EXP = 1;
		let REWARD_COIN = 1;

		db.query('SELECT * FROM user WHERE hash=?', [hash], (err, result) => {

			// result is empty
			if (!result || !result[0]) return;
			let userInfo = result[0];

			// get stat
			let level = userInfo.level;
			let exp = userInfo.exp;
			let coin = userInfo.coin;
			let maxLevel = Config.getMaxLevel();

			// level is max
			if (level >= maxLevel) return;

			// Coin up 
			coin += REWARD_COIN * viewer;

			// Exp Up
			exp += REWARD_EXP * viewer;
			let needExp = Config.getNeedExp(userInfo.level);
			if (exp >= needExp) {
				exp = exp - needExp;
				level++;
				if (level >= maxLevel) {
					level = maxLevel;
					exp = 0;
				}
			}

			db.query('UPDATE user SET level=?, exp=?, coin=? WHERE hash=?', [level, exp, coin, hash]);

		});
	} catch (e) {
		console.log(e + '@shop.js rewardStream');
	}
};