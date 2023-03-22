import { StreamInfo, StreamPlatform } from '../../model/Stream';
import { NaverHlsLoader } from './NaverHlsLoader';

export class LckClNaverLoader extends NaverHlsLoader {
  constructor() {
    super(
      'LCKCL',
      'https://game.naver.com/esports/League_of_Legends/live/lck_cl_2023_spring'
    );
  }

  createResult(url: string | null): StreamInfo | null {
    return url
      ? {
          nickname: 'LCK CL',
          description: 'LCK CL 건지개',
          icon: 'https://i.imgur.com/c4zH3lJ.png',
          keyid: 'lckcl',
          onair: true,
          platform: StreamPlatform.LCK,
          thumbnail: 'https://i.imgur.com/c4zH3lJ.png',
          url,
          result: true,
          title: 'LCK',
          viewer: 0,
        }
      : null;
  }
}
