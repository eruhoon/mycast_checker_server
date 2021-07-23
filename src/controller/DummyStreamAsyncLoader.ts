import { StreamRow } from '../model/Database';
import { IStreamAsyncLoader } from './IStreamAsyncLoader';

export class DummyStreamAsyncLoader implements IStreamAsyncLoader {
  async getStreams(): Promise<StreamRow[]> {
    return [];
  }
}
