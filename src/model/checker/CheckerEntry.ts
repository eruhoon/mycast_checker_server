import { StreamInfo } from '../Stream';

export type CheckerEntry = {
    type: CheckerType,
    stream: StreamInfo,
    sensitivity: number,
};

export const enum CheckerType {
    LOCAL = 'local',
    EXTERNAL = 'external',
}

export class CheckerEntry2 {

    private static readonly DEFAULT_SENSITIVITY = 3;

    private mType: CheckerType;
    private mStream: StreamInfo;
    private mSensitivity: number;

    public constructor(type: CheckerType, stream: StreamInfo) {
        this.mType = type;
        this.mStream = stream;
        this.mSensitivity = CheckerEntry2.DEFAULT_SENSITIVITY;
    }

    public getType(): CheckerType { return this.mType; }

    public getStream(): StreamInfo { return this.mStream; }

    public getSensitivity(): number { return this.mSensitivity; }

    public stale(): void { this.mSensitivity--; }

    public isStaled(): boolean { return this.mSensitivity <= 0; }

    public isSameKey(entry: CheckerEntry2): boolean {
        const s1 = this.getStream();
        const s2 = entry.getStream();
        return s1.keyid === s2.keyid && s1.platform === s2.platform;
    }
}
