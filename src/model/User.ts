import { StreamPlatform } from "./Stream";
import { UserRow } from "./Database";

export class User {
	private mIdx: number;
	private mId: string;
	private mNickname: string;
	private mIcon: string;
	private mStreamPlatform: StreamPlatform;
	private mAfreecaId: string;
	private mTwitchId: string;
	private mMixerId: string;
	private mBackground: string;

	public constructor(row: UserRow) {
		this.mIdx = row.idx;
		this.mId = row.id;
		this.mNickname = row.nickname;
		this.mIcon = row.icon;
		this.mStreamPlatform = row.broadcast_class;
		this.mTwitchId = row.twitch_id;
		this.mAfreecaId = row.afreeca_id;
		this.mMixerId = row.mixer_id;
		this.mBackground = row.broadcast_bgimg;
	}

	public getIdx(): number { return this.mIdx; }

	public getId(): string { return this.mId; }

	public getNickname(): string { return this.mNickname }

	public getIcon(): string { return this.mIcon; }

	public getStreamPlatform(): StreamPlatform { return this.mStreamPlatform; }

	public getStreamKeyId(): string {
		switch (this.mStreamPlatform) {
			case StreamPlatform.AFREECA: return this.mAfreecaId;
			case StreamPlatform.TWITCH: return this.mTwitchId;
			case StreamPlatform.MIXER: return this.mMixerId;
			default:
				console.error('User#getStreamKeyId: Invalid Platform');
				return '';
		}
	}

	public getBackground(): string { return this.mBackground; }
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