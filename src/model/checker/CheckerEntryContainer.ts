import { StreamInfo } from '../Stream';
import { CheckerEntry2, CheckerType } from './CheckerEntry';

export class CheckerEntryContainer {

    private readonly DEFAULT_SENSITIVITY: number = 3;

    private mEntries: CheckerEntry2[];
    private mOnStreamAddCallback: OnStreamAddCallback;

    public constructor() {
        this.mEntries = [];
        this.mOnStreamAddCallback = _ => { };
    }

    public setOnStreamAddCallback(callback: OnStreamAddCallback): void {
        this.mOnStreamAddCallback = callback;
    }

    public getEntries(): CheckerEntry2[] {
        return this.mEntries;
    }

    public stale(): void {
        this.mEntries.forEach(e => e.stale());
        this.mEntries = this.mEntries.filter(e => !e.isStaled());
    }

    public upsertStream(type: CheckerType, stream: StreamInfo): void {
        const entry = new CheckerEntry2(type, stream);
        if (!this.mEntries.some(e => e.isSameKey(entry))) {
            this.insert(entry);
        } else {
            this.update(entry);
        }
    }

    private insert(entry: CheckerEntry2): void {
        this.mEntries.push(entry);
        this.mOnStreamAddCallback(entry.getStream());
    }

    private update(entry: CheckerEntry2): void {
        this.mEntries = this.mEntries.map(e => e.isSameKey(entry) ? entry : e);
    }

}

export type OnStreamAddCallback = (stream: StreamInfo) => void;
