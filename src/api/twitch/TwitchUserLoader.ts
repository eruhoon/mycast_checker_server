import Axios from 'axios';
import { Logger } from '../../model/common/logger/Logger';
import { TwitchUserDto } from './TwitchUserDto';

export class TwitchUserLoader {
    private mLogger: Logger;
    private mClientId: string;

    public constructor(clientId: string) {
        this.mLogger = new Logger('TwitchUserLoader');
        this.mClientId = clientId;
    }

    public async load(
        loginIds: string[],
        token: string
    ): Promise<TwitchUserDto[]> {
        const host = 'https://api.twitch.tv/helix/users';
        const query = loginIds.map((k) => `login=${k}`).join('&');
        const url = `${host}?${query}`;
        try {
            const { data } = await Axios.get(url, {
                timeout: 5000,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Client-ID': this.mClientId,
                },
            });
            const users: TwitchUserDto[] = data.data;
            return users;
        } catch (e) {
            this.mLogger.error(`loadUser: Request Error: ${e}`);
            return [];
        }
    }
}
