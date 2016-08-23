"use strict";

/**
 * @typedef tvpotInfo
 * @type {object}
 * @property {boolean} result - 검색결과
 * @property {string} platorm - 플랫폼
 * @property {string} keyid - 방송 유니크 키
 * @property {string} icon - 방송 대표 아이콘
 * @property {string} nickname - 방장
 * @property {string} description - 방송 설명
 * @property {string} url - 방송 url
 * @property {string} thumbnail - 방송 썸네일
 * @property {boolean} onair - 방송중 여부
 * @property {int} viewer - 시청자 수
 * @property {string} err - 실패 시 에러메세지
 */

/** @constant {string} */
const URL = (id) => { return 'http://tvpot.daum.net/'+id+'.live'; };
const VIEW_URL = (id) => { return 'http://live.tvpot.daum.net/'+id+'.popup'; };


/** @module */
var request = require('request');


/**
 * Exports.update
 * 방송목록 업데이트
 * @param {array<string>} ids - 티비팟 아이디 목록
 * @param {updateCallback} callback - 콜백
 */
/**
 * @callback updateCallback
 * @param {tvpotInfo} result - 티비팟 방송정보
 */
exports.update = (ids, callback) => { try {

	if(!callback) callback = () => {};

	ids.forEach((id) => {
		this.getInfo(id, (info) => {
			if(!info.onair) return;
			callback(info);
		});
	});

} catch(e) {
	console.log('Error : '+e+'@update() #stream_api/tvpot');
}};


/**
 * Exports.getInfo
 * 티비팟 방송정보를 읽습니다.
 * @param {string} id - 다음 아이디
 * @param {getInfoCallback} callback - 콜백
 */
/**
 * @callback getInfoCallback
 * @param {afreecaInfo} info - 방송정보
 */
exports.getInfo = (id, callback) => { try {

	if(!callback) callback = () => {};

	request({ url: URL(id), timeout: 5000 }, (err, res, body) => {
		if(err || res.statusCode !== 200) return;

		let info = parseBody(body);
		if(!info.result) return;

		callback(info);
	});

} catch(e) {
	console.log('Error : '+e+'@getInfo() #stream_api/tvpot');
}};


/**
 * parseBody
 * 방송정보 RawData를 가공합니다.
 * @param {string} body - 방송정보 raw data
 * @param {string} id - 검증용 id
 * @return {tvpotInfo} 방송정보
 */
var parseBody = (body) => { try {

	body = body.replace(/(\r\n|\n|\r|\t)/g, '');
	
	let matched = body.match(/<span class=\"tit_broad\">(.*?)<\/span>.*<span class=\"txt_bar\">\|<\/span>(.*?)님<span class=\"txt_bar\">\|<\/span>.*?<\/p>.*<img onerror=\".*?\"src=\"(.*?)\"/);
	delete matched.input;

	let keyid = matched[2];
	let description = matched[1];
	let thumbnail = matched[3];

	return {
		result: true,
		platform: 'tvpot',
		keyid: keyid,
		icon: thumbnail,
		nickname: keyid,
		title: keyid,
		description: description,
		url: VIEW_URL(keyid),
		thumbnail: thumbnail,
		onair: true,
		viewer: 0
	};
	
} catch(e) {
	if (e instanceof TypeError) {
		// ignore TypeError
	} else {
		console.log('Error : '+e+'@parseBody() #stream_api/tvpot');	
	}
	return { result: false, err: e };
}};