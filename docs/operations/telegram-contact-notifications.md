# Telegram Contact Notifications

This document defines the framework-level setup for sending metadata-only "Send inquiry" / contact form notifications to Telegram.

## Current Framework Behavior

The contact form is already wired to the Telegram notification service, but delivery is opt-in and requires credentials.

Flow:

1. The public contact section submits to `POST /api/contact/submit`.
2. The API validates and rate-limits the request.
3. The submission is stored in `contact_submissions`.
4. If `features.contactTelegramNotify` is enabled, the API calls `notifyNewContact()` with the submission ID and timestamp only.
5. `notifyNewContact()` sends a Telegram `sendMessage` request without the submitter name, reply-to contact, phone, subject, or message body.
6. The form returns success only after Telegram accepts the notification.

Credential source:

- Admin Settings: `contact.telegramBotToken`
- Admin Settings: `contact.telegramChatId`

Important: `social.telegram` is only the public Telegram link shown in the UI. It is not the notification destination.

Privacy boundary: Telegram is an external channel. Contact submission personal data remains in the local database/admin panel; Telegram receives only a metadata notification that a new submission exists.

## Required Framework Settings

Enable the feature flag in `project/puppet-master.config.ts`:

```ts
features: {
  contactTelegramNotify: true
}
```

Configure credentials in Admin Settings:

| Setting                    | Purpose                                     | Notes                                 |
| -------------------------- | ------------------------------------------- | ------------------------------------- |
| `contact.telegramBotToken` | Bot API token from BotFather                | Secret setting, encrypted at rest     |
| `contact.telegramChatId`   | Destination user, group, or channel chat ID | Private setting, not exposed publicly |

Do not put Telegram credentials in `.env`. The framework stores and reads them from the settings database.

## Telegram Side Setup

### 1. Create The Bot

1. Open Telegram and message `@BotFather`.
2. Send `/newbot`.
3. Choose a display name.
4. Choose a username ending in `bot`, for example `my_project_inquiries_bot`.
5. Copy the bot token.
6. Store the token in Admin Settings as `contact.telegramBotToken`.

The token must be the BotFather API token, not the bot username. It has this
shape: `123456789:AA...`.

Do not paste bot tokens into public chats, docs, issue trackers, screenshots, or client-side code.

### 2. Choose The Destination

Use one of these destinations:

| Destination        | Recommended For          | Notes                                          |
| ------------------ | ------------------------ | ---------------------------------------------- |
| Private admin chat | Solo owner, simple sites | The admin must start a chat with the bot first |
| Telegram group     | Teams handling inquiries | Recommended for most production projects       |
| Telegram channel   | Broadcast-only intake    | Bot usually needs posting permission           |

For team projects, create a dedicated group such as `Project Inquiries` or `Site Leads`.

### 3. Get A Private Chat ID

Use this when one person should receive inquiry notifications.

1. Open the new bot in Telegram.
2. Press Start or send `/start`.
3. Message `@userinfobot` or another trusted Telegram ID helper.
4. Copy your numeric user ID.
5. Store it as `contact.telegramChatId`.

The bot cannot send direct messages to a user who has never started the bot.

### 4. Get A Group Chat ID

Use this when a team should receive inquiry notifications.

1. Create a Telegram group for inquiries.
2. Add the bot to the group.
3. Send a message that mentions the bot, for example `/start@your_bot_username`.
4. Get the group chat ID with one of these methods:
   - Temporarily add a trusted helper such as `@RawDataBot` and inspect the `chat.id`.
   - Or call `getUpdates` for your bot after sending the group message:

```bash
BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
curl "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates"
```

5. Copy the group `chat.id` and store it as `contact.telegramChatId`.

Group IDs are usually negative numbers, for example `-123456789`. Supergroup IDs commonly start with `-100`, for example `-1001234567890`.

The bot does not need to be a group admin just to send messages, but it must remain a member of the group. If the group has posting restrictions, grant the bot permission to send messages.

### 5. Smoke Test Telegram Delivery

Before testing the website form, verify the Telegram credentials directly:

```bash
BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
curl "https://api.telegram.org/bot${BOT_TOKEN}/getMe"
```

Expected: `"ok":true`.

Then send a test message:

```bash
BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
CHAT_ID="-1001234567890"

curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\":\"${CHAT_ID}\",\"text\":\"Puppet Master Telegram notification test\"}"
```

Expected: the destination chat receives the message.

### 6. Smoke Test The Framework Flow

1. Confirm `features.contactTelegramNotify` is `true`.
2. Confirm `contact.telegramBotToken` and `contact.telegramChatId` are set in Admin Settings.
3. Submit the public contact form.
4. Confirm:
   - The user sees the normal success state.
   - The submission appears in Admin Contacts.
   - The Telegram destination receives a metadata-only message containing the submission ID.
   - Server logs do not contain `Telegram API error`.

## Operational Rules

- Rotate the bot token immediately if it is exposed.
- Keep one bot per project or environment when possible. This avoids mixing production and staging inquiries.
- Use a dedicated group for production inquiry handling.
- Keep `social.telegram` separate from `contact.telegramChatId`; one is public contact UI, the other is a private notification target.
- Keep Telegram notifications metadata-only. Do not include names, reply-to contacts, phone numbers, subjects, message bodies, or other personal data in `notifyNewContact()`.
- When Telegram notifications are enabled, do not show public form success unless Telegram delivery succeeds.
- The database contact submission remains canonical, but a Telegram failure returns a `502` so operators do not get false confidence during intake testing.

## Common Failures

| Symptom                                       | Likely Cause                             | Fix                                        |
| --------------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| Contact form succeeds but no Telegram message | Feature flag is disabled                 | Set `features.contactTelegramNotify: true` |
| `Telegram bot not configured` in logs         | Missing token or chat ID                 | Set both values in Admin Settings          |
| `Telegram bot token has invalid format`       | Bot username or wrong value saved        | Paste the BotFather API token              |
| `Not Found` from Telegram API                 | Invalid bot token                        | Regenerate/copy the BotFather API token    |
| `chat not found`                              | Wrong chat ID or bot is not in the group | Re-check chat ID and add/start the bot     |
| `Forbidden: bot was blocked by the user`      | Private recipient blocked the bot        | Unblock and send `/start` to the bot       |
| Group receives nothing                        | Bot removed or cannot post               | Add bot back and allow messages            |
| Admin settings show masked token              | Expected for non-master admins           | Master users can update the secret value   |

## Implementation Files

| File                                         | Responsibility                            |
| -------------------------------------------- | ----------------------------------------- |
| `app/components/sections/SectionContact.vue` | Public inquiry form                       |
| `server/api/contact/submit.post.ts`          | Stores inquiry and triggers notifications |
| `server/utils/telegram.ts`                   | Telegram Bot API adapter                  |
| `project/puppet-master.config.ts`                | Feature flag and settings definitions     |
| `server/utils/site-settings.ts`              | Secret lookup and decryption              |
| `app/pages/admin/settings.vue`               | Admin credential entry UI                 |
| `app/pages/admin/contacts.vue`               | Canonical inquiry inbox                   |
