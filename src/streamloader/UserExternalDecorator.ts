import { User } from "../model/User";
import { StreamLoader, StreamLoaderCallback } from "./StreamLoader";

export class UserExternalDecorator extends StreamLoader {
    private mUser: User;
    private mLoader: StreamLoader;

    public constructor(user: User, loader: StreamLoader) {
        super();
        this.mUser = user;
        this.mLoader = loader;
    }

    public requestInfo(callback: StreamLoaderCallback) {
        this.mLoader.requestInfo((info) => {
            info.keyid = this.mUser.getId();
            info.nickname = `${this.mUser.getNickname()}[${info.platform}]`;
            info.icon = this.mUser.getIcon();
            info.description += `@${this.mUser.getNickname()}의 외부방송`;

            callback(info);
        });
    }
}
