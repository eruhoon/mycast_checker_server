import { StreamInfo } from '../Stream';
import { CheckerEntry, CheckerType } from './CheckerEntry';

export class CheckerEntryContainer {
  #entries: CheckerEntry[];
  #onStreamAddCallback: OnStreamAddCallback;

  constructor() {
    this.#entries = [];
    this.#onStreamAddCallback = (_) => {};
  }

  setOnStreamAddCallback(callback: OnStreamAddCallback): void {
    this.#onStreamAddCallback = callback;
  }

  getEntries(): CheckerEntry[] {
    return this.#entries;
  }

  stale(): void {
    this.#entries.forEach((e) => e.stale());
    this.#entries = this.#entries.filter((e) => !e.isStaled());
  }

  upsertStream(type: CheckerType, stream: StreamInfo): void {
    const entry = new CheckerEntry(type, stream);
    if (!this.#entries.some((e) => e.isSameKey(entry))) {
      this.insert(entry);
    } else {
      this.update(entry);
    }
  }

  private insert(entry: CheckerEntry): void {
    this.#entries.push(entry);
    this.#onStreamAddCallback(entry);
  }

  private update(entry: CheckerEntry): void {
    this.#entries = this.#entries.map((e) => (e.isSameKey(entry) ? entry : e));
  }
}

export type OnStreamAddCallback = (stream: CheckerEntry) => void;
