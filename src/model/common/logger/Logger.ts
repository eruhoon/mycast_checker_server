export class Logger {

    private mTag: string;

    public constructor(tag: string) {
        this.mTag = tag;
    }

    public log(log: string): void {
        // tslint:disable-next-line: no-console
        console.log(`${this.mTag}:`, log);
    }
}
