export class ExpireCache<T> {
  readonly value: T;
  #expires: number;

  constructor(value: T, expire: number) {
    this.value = value;
    this.#expires = new Date().getTime() + expire;
  }

  isStaled(): boolean {
    const now = new Date().getTime();
    return now > this.#expires;
  }
}
