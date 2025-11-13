-- Insert Telegram posting configuration into the database
INSERT INTO telegram_posting_settings (bot_token, channel_id, channel_username, is_active)
VALUES (
  '6816923933:AAHWM79Z6PfpvKVjZh793f_HrPe9ds6ajDM',
  -1002080159369,
  'your_channel_name',
  true
)
ON CONFLICT (id) DO UPDATE SET
  bot_token = EXCLUDED.bot_token,
  channel_id = EXCLUDED.channel_id,
  is_active = true,
  updated_at = now();
