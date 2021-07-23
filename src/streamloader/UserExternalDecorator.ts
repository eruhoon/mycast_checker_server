import { StreamInfo } from '../model/Stream';
import { User } from '../model/User';
import { StreamLoader2 } from './StreamLoader2';

export class UserExternalDecorator extends StreamLoader2 {
  #user: User;
  #loader: StreamLoader2;

  constructor(user: User, loader: StreamLoader2) {
    super();
    this.#user = user;
    this.#loader = loader;
  }

  async getInfo(): Promise<StreamInfo | null> {
    const info = await this.#loader.getInfo();
    if (!info) {
      return null;
    }
    info.keyid = this.#user.getId();
    info.nickname = `${this.#user.getNickname()}[${info.platform}]`;
    info.icon = this.#user.getIcon();
    info.description += `@${this.#user.getNickname()}의 외부방송`;
    return info;
  }
}
