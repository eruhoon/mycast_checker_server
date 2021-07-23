export class Logger {
  #tag: string;

  constructor(tag: string) {
    this.#tag = tag;
  }

  log(log: any): void {
    // tslint:disable-next-line: no-console
    console.log(`${this.#tag}:`, log);
  }

  error(log: any): void {
    // tslint:disable-next-line: no-console
    console.log(`${this.#tag}:`, log);
  }
}
