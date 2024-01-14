import axios from 'axios';
import { Logger } from '../common/logger/Logger';

export class ChzzkManager {
  #logger: Logger = new Logger('ChzzkManager');

  async getProfile(channelHash: string): Promise<ChzzkChannelProfile> {
    const { data } = await axios.get<ChzzkChannelProfile>(
      `https://comm-api.game.naver.com/nng_main/v2/user/${channelHash}/profile`
    );
    return data;
  }

  async getLiveStatus(channelHash: string): Promise<ChzzkLiveStatus> {
    const { data } = await axios.get<ChzzkLiveStatus>(
      `https://api.chzzk.naver.com/polling/v2/channels/${channelHash}/live-status`
    );
    return data;
  }

  async getLiveDetail(channelHash: string): Promise<ChzzkLiveDetail> {
    const { data } = await axios.get<ChzzkLiveDetail>(
      `https://api.chzzk.naver.com/service/v2/channels/${channelHash}/live-detail`
    );
    const liveImageUrl = data.content?.liveImageUrl;
    if (liveImageUrl) {
      data.content.liveImageUrl = liveImageUrl?.replace('{type}', '480');
    }
    return data;
  }
}

type ChzzkChannelProfile = {
  code: number;
  content: {
    nickname: string;
    profileImageUrl: string;
    streamingChannel?: ChzzkStreamingChannel;
  };
};

type ChzzkStreamingChannel = {
  channelId: string;
  channelName: string;
  channelImageUrl: string;
};

type ChzzkLiveStatus = {
  content: {
    liveTitle: string;
    status: 'OPEN' | 'CLOSE';
    concurrentUserCount: number;
    accumulateCount: number;
    paidPromotion: boolean;
    adult: boolean;
    chatChannelId: string;
    liveCategoryValue: string;
  };
};

type ChzzkLiveDetail = {
  code: number;
  message: any;
  content: {
    liveId: number;
    liveTitle: string;
    status: 'OPEN' | 'CLOSE';
    liveImageUrl: string;
    defaultThumbnailImageUrl: string;
    concurrentUserCount: number;
    accumulateCount: number;
    openDate: string | null;
    closeDate: string | null;
    chatChannelId: string;
    categoryType: string;
    liveCategory: string;
    liveCategoryValue: string;
    chatActive: true;
    chatAvailableGroup: 'ALL';
    paidPromotion: false;
    chatAvailableCondition: 'NONE';
    minFollowerMinute: 0;
    livePlaybackJson: string;
    channel: {
      channelId: string;
      channelName: string;
      channelImageUrl: string;
      verifiedMark: false;
    };
    livePollingStatusJson: string;
  };
};
