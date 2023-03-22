import { StreamInfo, StreamPlatform } from '../../model/Stream';
import { NaverHlsLoader } from './NaverHlsLoader';

export class LckNaverLoader extends NaverHlsLoader {
  constructor() {
    super(
      'LCK',
      'https://game.naver.com/esports/League_of_Legends/live/lck_2023_spring'
    );
  }

  createResult(url: string | null): StreamInfo | null {
    return url
      ? {
          nickname: 'LCK',
          description: 'LCK 건지개',
          icon: 'https://i.imgur.com/femXUPh.png',
          keyid: 'lck',
          onair: true,
          platform: StreamPlatform.LCK,
          thumbnail: 'https://i.imgur.com/femXUPh.png',
          url,
          result: true,
          title: 'LCK',
          viewer: 0,
        }
      : null;
  }
}
