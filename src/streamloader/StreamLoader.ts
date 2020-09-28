import { StreamInfo } from "../model/Stream";

export abstract class StreamLoader {
    public abstract requestInfo(callback: StreamLoaderCallback): void;
}

export type StreamLoaderCallback = (info: StreamInfo) => void;
