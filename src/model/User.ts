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
  background?: string;
};

export class User {
  public static IDX_NONE: number = -1;

  private mIdx: number;
  private mId: string;
  private mHash: string;
  private mNickname: string;
  private mIcon: string;
  private mPlatform: StreamPlatform;
  private mAfreecaId: string;
  private mTwitchId: string;
  private mMixerId: string;
  private mBackground: string;

  public constructor(param: UserParam) {
    this.mIdx = param.idx ? param.idx : User.IDX_NONE;
    this.mId = param.id ? param.id : '';
    this.mHash = param.hash ? param.hash : '';
    this.mNickname = param.nickname ? param.nickname : '';
    this.mIcon = param.icon ? param.icon : '';
    this.mPlatform = param.platform ? param.platform : StreamPlatform.LOCAL;
    this.mAfreecaId = param.afreecaId ? param.afreecaId : '';
    this.mTwitchId = param.twitchId ? param.twitchId : '';
    this.mMixerId = param.mixerId ? param.mixerId : '';
    this.mBackground = param.background ? param.background : '';
  }

  public getIdx(): number {
    return this.mIdx;
  }

  public getId(): string {
    return this.mId;
  }

  public getHash(): string {
    return this.mHash;
  }

  public getNickname(): string {
    return this.mNickname;
  }

  public getIcon(): string {
    return this.mIcon;
  }

  public getStreamPlatform(): StreamPlatform {
    return this.mPlatform;
  }

  public getStreamKeyId(): string {
    switch (this.mPlatform) {
      case StreamPlatform.LOCAL:
        return this.mHash.substring(0, 5);
      case StreamPlatform.TOTORO:
        return this.mHash.substring(0, 5);
      case StreamPlatform.AFREECA:
        return this.mAfreecaId;
      case StreamPlatform.TWITCH:
        return this.mTwitchId;
      case StreamPlatform.MIXER:
        return this.mMixerId;
      default:
        console.error('User#getStreamKeyId: Invalid Platform');
        return '';
    }
  }

  public getBackground(): string {
    return this.mBackground;
  }

  public static createWithRow(row: UserRow): User {
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
