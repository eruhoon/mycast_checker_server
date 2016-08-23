//jshint esversion: 6

/**
 * @typedef azubuInfo
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
 * @property {value} viewer - 시청자 수
 * @property {string} err - 실패 시 에러메세지
 */


/** @constant {string} */
const URL = 'http://api.azubu.tv/public/channel/';


// Load Module
var request = require('request');


/**
 * Exports.update
 * 방송목록 업데이트
 * @param {array<string>} ids - 아주부 아이디 목록
 * @param {updateCallback} callback - 콜백
 */
/**
 * @callback updateCallback
 * @param {azubuInfo} result - 아주부 방송정보
 */
exports.update = (ids, callback) => {
	"use strict";
	if(!callback) callback = (result) => {};

	ids.forEach((id) => {
		this.getInfo(id, (err, info) => {
			if(err) return;
			if(!info.onair) return;
			callback(info);
		});
	});

};


/**
 * Exports.getInfo
 * 아주부 id의 방송정보를 읽습니다.
 * @param {string} id - 아주부 ID
 * @param {getInfoCallback} callback
 */
/**
 * @callback getInfoCallback
 * @param {null|string} err - 성공시 null, 에러시 메시지
 * @param {afreecaInfo} info - 방송정보
 */
exports.getInfo = (id, callback) => {
"use strict";
try {
	if(!callback) callback = (err, info) => {};
	var uri = URL+id;
	request({ url: uri, timeout: 5000 }, (err, res, body) => {
		if(err || res.statusCode !== 200) {
			callback('Connection Error', null);
			return;
		}
		let result = parseInfo(body);
		if(!result.result) {
			callback('Parse Error', null);
		}
		getUrl(result.keyid, (url) => {
			result.url = url;
			callback(null, result);
		});
	});
} catch(e) {
	console.log('Error : '+e+'@getInfo() #stream_api/azubu');
	callback(err, null);
}};


/**
 * getUrl
 * 방송 URL을 콜백합니다.
 * @param {string} id - 아주부ID
 * @param {getUrlCallback} callback
 */
/**
 * @callback getUrlCallback
 * @param  {string} url - 성공시 url
 */
var getUrl = (id, callback) => {
	"use strict";
	if(!callback) callback = (url) => {};
	let videoUrl = 'http://www.azubu.tv/'+id+'/videopopup';
	request({ url: videoUrl, timeout: 5000 }, (err, res, body) => {
		if(err || res.statusCode !== 200) {
			callback(null);
			return;
		}
		let reg = /AZUBU\.setVar\("firstVideoRefId", "(.*?)"\)/;
		let result = reg.exec(body);
		callback('http://embed.azubu.tv/'+result[1]+'?autoplay=true');
	});
};


/**
 * parseInfo
 * 방송정보 RawData를 가공합니다.
 * @param {string} body - RawData
 */
var parseInfo = (body) => {
"use strict";
try {
	let info = JSON.parse(body).data;
	if(!info) return { result: false, err: '방송이 없습니다' };
	
	return {
		result: true,
		platform: 'azubu',
		keyid: info.user.username,
		icon: info.user.profile.url_photo_large,
		nickname: info.user.username,
		title: info.title,
		description: info.title,
		url: null,
		thumbnail: info.url_thumbnail,
		onair: info.is_live,
		viewer: parseInt(info.view_count)
	};
	
} catch(e) {
	console.log('Error : '+e+'@parseInfo().azubu.js');
}};