export type StreamSet = {
  local: StreamInfo[];
  external: StreamInfo[];
};

export type StreamInfo = {
  result: boolean;
  platform: StreamPlatform;
  keyid: string;
  icon: string;
  nickname: string;
  thumbnail: string;
  onair: boolean;
  title: string;
  description: string;
  url: string;
  viewer: number;
};

export declare const enum StreamPlatform {
  LOCAL = 'local',
  TWITCH = 'twitch',
  AFREECA = 'afreeca',
  KAKAOTV = 'kakaotv',
  YOUTUBE = 'youtube',
  TOTORO = 'totoro',
  MIXER = 'mixer',
  CHZZK = 'chzzk',
  LCK = 'lck',
}
