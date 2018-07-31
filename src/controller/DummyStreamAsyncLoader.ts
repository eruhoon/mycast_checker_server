import { IStreamAsyncLoader } from "./IStreamAsyncLoader";
import { StreamRow } from "../model/Database";

export class DummyStreamAsyncLoader implements IStreamAsyncLoader {

    public getStreams(): Promise<StreamRow[]> {

        return new Promise<StreamRow[]>(resolve => {
            resolve([]);
        });
    }
}