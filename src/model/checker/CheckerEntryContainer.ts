import { StreamInfo } from '../Stream';
import { CheckerEntry, CheckerType } from './CheckerEntry';

export class CheckerEntryContainer {
  private mEntries: CheckerEntry[];
  private mOnStreamAddCallback: OnStreamAddCallback;

  constructor() {
    this.mEntries = [];
    this.mOnStreamAddCallback = (_) => {};
  }

  setOnStreamAddCallback(callback: OnStreamAddCallback): void {
    this.mOnStreamAddCallback = callback;
  }

  getEntries(): CheckerEntry[] {
    return this.mEntries;
  }

  stale(): void {
    this.mEntries.forEach((e) => e.stale());
    this.mEntries = this.mEntries.filter((e) => !e.isStaled());
  }

  upsertStream(type: CheckerType, stream: StreamInfo): void {
    const entry = new CheckerEntry(type, stream);
    if (!this.mEntries.some((e) => e.isSameKey(entry))) {
      this.insert(entry);
    } else {
      this.update(entry);
    }
  }

  private insert(entry: CheckerEntry): void {
    this.mEntries.push(entry);
    this.mOnStreamAddCallback(entry);
  }

  private update(entry: CheckerEntry): void {
    this.mEntries = this.mEntries.map((e) => (e.isSameKey(entry) ? entry : e));
  }
}

export type OnStreamAddCallback = (stream: CheckerEntry) => void;
