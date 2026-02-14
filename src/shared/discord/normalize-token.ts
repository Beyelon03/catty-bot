const MIN_TOKEN_LENGTH = 30;

export function normalizeDiscordToken(raw: string | undefined): string {
  if (raw == null) return '';
  let s = raw.trim();
  if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
  if (s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1);
  s = s.replace(/[\s\u200B-\u200D\uFEFF]/g, '');
  return s;
}

export function validateDiscordToken(token: string): void {
  if (!token || token.length < MIN_TOKEN_LENGTH) {
    throw new Error(
      'DISCORD_TOKEN не задан. Discord Developer Portal → приложение → вкладка Bot → Reset Token → скопировать в .env как DISCORD_TOKEN=токен (без кавычек)',
    );
  }
}
