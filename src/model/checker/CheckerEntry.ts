import { StreamInfo } from "../Stream";

export const enum CheckerType {
    LOCAL = "local",
    EXTERNAL = "external",
}

export class CheckerEntry {
    private static readonly DEFAULT_SENSITIVITY = 3;

    private mType: CheckerType;
    private mStream: StreamInfo;
    private mSensitivity: number;

    public constructor(type: CheckerType, stream: StreamInfo) {
        this.mType = type;
        this.mStream = stream;
        this.mSensitivity = CheckerEntry.DEFAULT_SENSITIVITY;
    }

    public getType(): CheckerType {
        return this.mType;
    }

    public getStream(): StreamInfo {
        return this.mStream;
    }

    public getSensitivity(): number {
        return this.mSensitivity;
    }

    public stale(): void {
        this.mSensitivity--;
    }

    public isStaled(): boolean {
        return this.mSensitivity <= 0;
    }

    public isSameKey(entry: CheckerEntry): boolean {
        const s1 = this.getStream();
        const s2 = entry.getStream();
        return s1.keyid === s2.keyid && s1.platform === s2.platform;
    }
}
