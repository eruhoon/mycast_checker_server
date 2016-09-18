"use strict";

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


/** @constant */
const URL = (id) => { return 'http://sch.afreeca.com/api.php?m=liveSearch&v=1.0&szOrder=&c=EUC-KR&szKeyword='+id; };


/** @module */
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
exports.update = (ids, callback) => { try {

	if(!callback) callback = () => {};

	ids.forEach((id) => {
		this.getInfo(id, (info) => {
			if(!info.onair) return;
			callback(info);
		});
	});
} catch(e) {
	console.log('Error : '+e+'@update() #stream_api/afreeca');
}};


/**
 * Exports.getInfo
 * 아프리카 id의 방송정보를 읽습니다.
 * @param {string} id - 아프리카 아이디
 * @param {getInfoCallback} callback - 콜백
 */
/**
 * @callback getInfoCallback
 * @param {afreecaInfo} info - 방송정보
 */
exports.getInfo = (id, callback) => { try {

	if(!callback) callback = () => {};
	
	let reqOpt = {
		url: URL(id),
		encoding: 'binary',
		timeout: 5000
	};

	request(reqOpt, (err, res, body) => {

		if(err || res.statusCode !== 200) return;

		body = iconv.decode(body, 'euckr');
		let result = parseInfo(body, id);
		if(!result.result) return;
		callback(result);
	});

} catch(e) {
	console.log('Error : '+e+'@getInfo() #stream_api/afreeca');
	//callback({ result: false, err: e });
}};


/**
 * parseInfo
 * 
 * @param {string} body - 방송정보 raw data
 * @param {string} id - 검증용 id
 * @return {afreecaInfo} 방송정보
 */
var parseInfo = (body, id) => { try {
	
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
		thumbnail: realBroad.sn_url+'?'+new Date().getTime(),
		onair: true,
		viewer: parseInt(realBroad.total_view_cnt)
	};

} catch(e) {
	if (e instanceof TypeError) {
		// ignore TypeError
	} else {
		console.log('Error : '+e+'@parseBody() #stream_api/afreeca');	
	}
	return { result: false, err: e };
}};