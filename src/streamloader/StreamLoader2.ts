import { StreamInfo } from '../model/Stream';
import { StreamLoader, StreamLoaderCallback } from './StreamLoader';

export abstract class StreamLoader2 extends StreamLoader {
  requestInfo(callback: StreamLoaderCallback): void {
    this.getInfo().then((streamInfo) => {
      if (streamInfo) {
        callback(streamInfo);
      }
    });
  }

  abstract getInfo(): Promise<StreamInfo | null>;
}
