import { StreamInfo } from '../model/Stream';

export interface StreamLoader {
  getInfo(): Promise<StreamInfo | null>;
}
