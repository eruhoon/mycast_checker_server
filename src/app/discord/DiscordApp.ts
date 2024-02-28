import * as dotenv from 'dotenv';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import { Checker } from '../../model/checker/Checker';

export class DiscordApp {
  readonly checker: Checker;

  constructor(checker: Checker) {
    this.checker = checker;
  }

  run() {
    dotenv.config();
    const token = process.env.DISCORD_TOKEN;

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    client.on('ready', (readyClient) => {
      console.log(`${client.user?.tag}에 로그인하였습니다!`);
    });

    client.on(Events.MessageCreate, (msg) => {
      if (msg.content === '핑') {
        console.log('핑');
        msg.reply('퐁!');
      } else if (msg.content === '방송') {
        const nicknames = this.checker
          .getStreams()
          .local.map((s) => s.nickname);
        msg.reply(`${nicknames.join(',')} 방송 중~`);
      }
    });

    client.login(token);
  }
}
