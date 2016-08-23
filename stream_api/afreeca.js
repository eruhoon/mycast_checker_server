//jshint esversion: 6
//jshint strict: true

/**
 * @typedef afreecaInfo
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
const URL = 'http://sch.afreeca.com/api.php?m=liveSearch&v=1.0&szOrder=&c=EUC-KR&szKeyword=';


// Load Module
var request = require('request');
var iconv = require('iconv-lite');
iconv.skipDecodeWarning = true;


/**
 * Exports.update
 * 방송목록 업데이트
 * @param {array<string>} ids - 아프리카 아이디 목록
 * @param {updateCallback} callback - 콜백
 */
/**
 * @callback updateCallback
 * @param {afreecaInfo} result - 아프리카 방송정보
 */
exports.update = (ids, callback) => {
	"use strict";

	ids.forEach((id) => {
		request({
			url: URL + id,
			encoding: 'binary'
		}, function(err, res, body) {
			if(err) return;
			if(res.statusCode !== 200) return;
			body = iconv.decode(body, 'euckr');
			var result = parseInfo(body, id);
			if(!result.result) return;

			if(callback) callback(result);
		});
	});
};


/**
 * Exports.getInfo
 * 아프리카 id의 방송정보를 읽습니다.
 * @param {string} id - 아프리카 아이디
 * @param {getInfoCallback} callback - 콜백
 */
/**
 * @callback getInfoCallback
 * @param {null|string} err - 성공시 null, 에러시 메시지
 * @param {afreecaInfo} info - 방송정보
 */
exports.getInfo = (id, callback) => {
"use strict";
try {
	if(!callback) callback = (err, info) => { };
	var uri = URL + id;
	request({
		url: uri,
		encoding: 'binary',
		timeout: 5000
	}, (err, res, body) => {
		if(err || res.statusCode !== 200) {
			callback('Connection Error', null);
			return;
		}
		body = iconv.decode(body, 'euckr');
		let result = parseInfo(body, id);
		if(!result.result) {
			callback('Parse Error', null);
		}
		callback(null, result);
	});

} catch(e) {
	callback(err, { result: false });
}};


/**
 * parseInfo
 * 
 * @param {string} body - 방송정보 raw data
 * @param {string} id - 검증용 id
 * @return {afreecaInfo} 방송정보
 */
var parseInfo = (body, id) => {
"use strict";
try {
	var info = JSON.parse(body);
	var realBroad = info.REAL_BROAD.find((e) => { return e.user_id === id; });
	if(!realBroad) return { result: false, err: '방송이 없습니다.' };
	
	return {
		result: true,
		platform: 'afreeca',
		keyid: realBroad.user_id,
		icon: 'http://stimg.afreeca.com/LOGO/'+ realBroad.user_id.substring(0, 2) + '/' + realBroad.user_id + '/' + realBroad.user_id + '.jpg',
		nickname: realBroad.user_nick,
		title: realBroad.station_name,
		description: realBroad.broad_title,
		url: 'http://play.afreeca.com/'+realBroad.user_id+'/embed',
		thumbnail: realBroad.sn_url,
		onair: true,
		viewer: parseInt(realBroad.total_view_cnt)
	};

} catch(e) {
	console.log('ParseError : '+e+'@parseInfo()');
	return {
		result: false,
		err: 'Unknown Error'
	};
}};