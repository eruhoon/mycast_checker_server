export class Logger {
  private mTag: string;

  constructor(tag: string) {
    this.mTag = tag;
  }

  log(log: any): void {
    // tslint:disable-next-line: no-console
    console.log(`${this.mTag}:`, log);
  }

  error(log: any): void {
    // tslint:disable-next-line: no-console
    console.log(`${this.mTag}:`, log);
  }
}
