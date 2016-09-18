"use strict";

/** @module */
var db = require('../database.js').mysql;

exports.searchUserByHash = (hash, callback) => { try {
	if(!callback) callback = () => {};

	let query = 'SELECT * FROM user WHERE hash = ? AND confirm = 1';
	db.query (query, [hash], (err, res) => {
		if(err) return;

		callback(res[0]);
	});

} catch(e) {

}};