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
        const streams = this.checker.getStreams().local;
        const streamStrings = streams.map((s) => `[${s.nickname}](${s.url})`);
        msg.reply(`${streamStrings.join(',')} 방송 중~`);
      } else if (msg.content === '치지직') {
        const streams = this.checker
          .getStreams()
          .external.filter((s) => s.platform === 'chzzk');
        const streamStrings = streams.map((s) => `[${s.nickname}](${s.url})`);
        msg.reply(`${streamStrings.join(',')} 방송 중~`);
      } else if (msg.content === '유튜브') {
        const streams = this.checker
          .getStreams()
          .external.filter((s) => s.platform === 'youtube');
        const streamStrings = streams.map((s) => `[${s.nickname}](${s.url})`);
        msg.reply(`${streamStrings.join(',')} 방송 중~`);
      } else if (msg.content === '아프리카') {
        const streams = this.checker
          .getStreams()
          .external.filter((s) => s.platform === 'afreeca');
        const streamStrings = streams.map((s) => `[${s.nickname}](${s.url})`);
        msg.reply(`${streamStrings.join(',')} 방송 중~`);
      }
    });

    client.login(token);
  }
}
