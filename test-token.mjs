import { Client, GatewayIntentBits } from 'discord.js';

const token = process.env.DISCORD_TOKEN?.trim();
if (!token) {
  console.error('DISCORD_TOKEN не найден в .env');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once('ready', () => {
  console.log('OK: бот подключился, токен верный.');
  client.destroy();
  process.exit(0);
});
client.on('error', (e) => {
  console.error('Ошибка:', e.message);
  process.exit(1);
});

client.login(token).catch((e) => {
  console.error('TokenInvalid или другая ошибка:', e.message);
  process.exit(1);
});
