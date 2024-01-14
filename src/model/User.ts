import { Logger } from './common/logger/Logger';
import { UserRow } from './Database';
import { StreamPlatform } from './Stream';

export type UserParam = {
  idx?: number;
  id?: string;
  hash?: string;
  nickname?: string;
  icon?: string;
  platform?: StreamPlatform;
  afreecaId?: string;
  twitchId?: string;
  mixerId?: string;
  chzzkId?: string;
  youtubeHandle?: string;
  background?: string;
};

const Log = new Logger('User');

export class User {
  static IDX_NONE: number = -1;

  readonly #idx: number;
  readonly #id: string;
  readonly #hash: string;
  readonly #nickname: string;
  readonly #icon: string;
  readonly #platform: StreamPlatform;
  readonly #afreecaId: string;
  readonly #twitchId: string;
  readonly #mixerId: string;
  readonly #chzzkId: string;
  readonly #youtubeHandle: string;
  readonly #background: string;

  constructor(param: UserParam) {
    this.#idx = param.idx ? param.idx : User.IDX_NONE;
    this.#id = param.id ? param.id : '';
    this.#hash = param.hash ? param.hash : '';
    this.#nickname = param.nickname ? param.nickname : '';
    this.#icon = param.icon ? param.icon : '';
    this.#platform = param.platform ? param.platform : StreamPlatform.LOCAL;
    this.#afreecaId = param.afreecaId ? param.afreecaId : '';
    this.#twitchId = param.twitchId ? param.twitchId : '';
    this.#mixerId = param.mixerId ? param.mixerId : '';
    this.#chzzkId = param.chzzkId ?? '';
    this.#youtubeHandle = param.youtubeHandle ?? '';
    this.#background = param.background ? param.background : '';
  }

  getIdx(): number {
    return this.#idx;
  }

  getId(): string {
    return this.#id;
  }

  getHash(): string {
    return this.#hash;
  }

  getNickname(): string {
    return this.#nickname;
  }

  getIcon(): string {
    return this.#icon;
  }

  getStreamPlatform(): StreamPlatform {
    return this.#platform;
  }

  getStreamKeyId(): string {
    switch (this.#platform) {
      case StreamPlatform.LOCAL:
        return this.#hash.substring(0, 5);
      case StreamPlatform.TOTORO:
        return this.#hash.substring(0, 5);
      case StreamPlatform.AFREECA:
        return this.#afreecaId;
      case StreamPlatform.TWITCH:
        return this.#twitchId;
      case StreamPlatform.MIXER:
        return this.#mixerId;
      case StreamPlatform.CHZZK:
        return this.#chzzkId;
      case StreamPlatform.YOUTUBE:
        return this.#youtubeHandle;
      default:
        Log.error('getStreamKeyId: invalid platform');
        return '';
    }
  }

  getBackground(): string {
    return this.#background;
  }

  static createWithRow(row: UserRow): User {
    return new User({
      idx: row.idx,
      id: row.id,
      hash: row.hash,
      nickname: row.nickname,
      icon: row.icon,
      platform: row.broadcast_class,
      twitchId: row.twitch_id,
      afreecaId: row.afreeca_id,
      mixerId: row.mixer_id,
      chzzkId: row.chzzk_id,
      youtubeHandle: row.youtube_handle,
      background: row.broadcast_bgimg,
    });
  }
  /*
	{
  idx: 132,
  hash: 'b5884c6d05f7a22ac7ec8a435166942d',
  private_key: '80ae5dd43c66d45faac520fc958360dc',
  id: 'xyz1869',
  pw: 'b5caf1ed7a81044ad6312874be995f55',
  nickname: 'TWICE',
  icon: 'http://mimgnews1.naver.net/image/011/2018/04/13/0003269414_001_20180413101212089.jpg?type=w540',
  icon_border_color: 'E81818',
  level: 3,
  exp: 8,
  coin: 57,
  bitcoin: 0,
  confirm: 1,
  broadcast_class: 'afreeca',
  broadcast_open: 0,
  broadcast_url: null,
  broadcast_id: null,
  broadcast_pw: null,
  broadcast_bgimg: null,
  afreeca_id: '',
  daumpot_id: '',
  twitch_id: '',
  mixer_id: '' }
  */
}
