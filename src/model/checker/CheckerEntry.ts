import { StreamInfo } from '../Stream';

export const enum CheckerType {
  LOCAL = 'local',
  EXTERNAL = 'external',
}

export class CheckerEntry {
  static readonly #DEFAULT_SENSITIVITY = 3;

  #type: CheckerType;
  #stream: StreamInfo;
  #sensitivity: number;

  constructor(type: CheckerType, stream: StreamInfo) {
    this.#type = type;
    this.#stream = stream;
    this.#sensitivity = CheckerEntry.#DEFAULT_SENSITIVITY;
  }

  getType(): CheckerType {
    return this.#type;
  }

  getStream(): StreamInfo {
    return this.#stream;
  }

  getSensitivity(): number {
    return this.#sensitivity;
  }

  stale(): void {
    this.#sensitivity--;
  }

  isStaled(): boolean {
    return this.#sensitivity <= 0;
  }

  isSameKey(entry: CheckerEntry): boolean {
    const s1 = this.getStream();
    const s2 = entry.getStream();
    return s1.keyid === s2.keyid && s1.platform === s2.platform;
  }
}
