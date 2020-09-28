import { StreamRow } from "../model/Database";
import { IStreamAsyncLoader } from "./IStreamAsyncLoader";

export class DummyStreamAsyncLoader implements IStreamAsyncLoader {
    public getStreams(): Promise<StreamRow[]> {
        return new Promise<StreamRow[]>((resolve) => {
            resolve([]);
        });
    }
}
