import { StreamCheckerServer } from './StreamCheckerServer';
import { DiscordApp } from './app/discord/DiscordApp';

StreamCheckerServer.main();

new DiscordApp().main();
