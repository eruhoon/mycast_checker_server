import { StreamRow } from '../model/Database';

export interface IStreamAsyncLoader {
    getStreams(): Promise<StreamRow[]>;
}
