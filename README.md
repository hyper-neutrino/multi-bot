# multi-bot

This bot is not meant to be deployed to multiple servers from one account. Rather, it is modular and the deployment script can be easily modified to allow the same folder to be used to run multiple bot instances, each of which should handle only one server.

An example of `deploy.json` has been provided. Its format should be as follows:

```json
{
    "guilds": {
        "guild key": {
            "id": "the guild's ID",
            "owners": ["owner ID 1", "owner ID 2", ...],
            "modules": ["list of enabled modules", ...],
        },
        ...
    }
}
```

Then, you also need to create `config.json`. An example is not provided because this file contains the bot token, and it is in the `.gitignore` in case you fork this project. The format for `config.json` must be as follows:

```json
{
    "guild key": {
        "discord_token": "the discord bot's token",
        "github_username": "credentials if you use features that export to gists",
        "github_token": "access token for ^",
        "mongo_uri": "the URI for your mongodb server (the guild ID will be appended to this per instance)"
    }
}
```

# modules

This bot is modular so certain features can be enabled and disabled in batches, which includes all commands and event triggers associated with them.

### default

The following features are always enabled: edit bot/webhook messages, edit log channels, edit permissions, reaction roles, role add / role remove, `/say` and `/send`, stats channels, sticky messages, supporter announcements (via addition of a role), and autoresponder triggers.

### automod

Supports word (porter stemmer algorithm), substring, and boundary (regex) matches and allows the bot to defer to mods, silently delete, verbally warn (unlogged), formally warn (logged), mute, kick, or ban. You can also ignore certain channels and automod immunity is automatically granted to moderators.

### autoroles

Re-apply roles to returning members. You can set a custom threshold and not return roles above it; for example, to prevent staff from regaining their roles if they quit. Autoroles are set up to not interfere with supporter announcements, so if you have a Ko-Fi supporter role for example, it will not re-announce their support if they leave and rejoin.

### co-op

Co-op command for Genshin Impact. Works best if configured with regional server roles (EU, NA, AS, TW/HK/MO) and world level roles (0-8). You also must set up regional helper (ping) roles for it to work correctly, and a designated co-op channel.

### count

Count-up channels. Pretty basic features; lets you set up multiple independently tracked count channels, a global scoreboard (no channel-specific scoreboard though), and lets you alter the active score if needed.

### custom-roles

Custom roles for supporters. Permissions system works just like the rest of the features, so the server owner and bot owners are always able to use custom roles.

### fun

Fun commands. Right now it is just `/choose`.

### highlights

Highlights. By default, only usable by staff but you can change that as needed. Uses the porter stemmer algorithm to attempt to find optimal matches minimizing false positives and negatives. Only highlights if the user hasn't talked in the channel for 5 minutes and hasn't been highlighted for that channel in the past 5 minutes.

### logs

Message logging. Allows ignoring threads, channels, or categories. Logs deletions, edits, and purges as individual messages + a purge summary (exported to a gist).

### moderation

Warn, mute, kick, ban, massban, user history, slowmode, purge. Works as you'd imagine.

### modmail

DM the bot to contact staff. Prompts the user for confirmation if they don't have an open modmail thread. Uses threads so when modmail threads are closed, the channel is archived and not deleted so it can be kept around forever. If the thread is deleted, you can also browse the thread via a command.

### music

A music bot with more features than necessary.

### nukeguard

A suite of anti-nuke features to prevent people from causing too much damage to the server. Only works if the bot is above the person doing damage. Currently, this only includes channel protections and bans people if they delete protected channels.

### polls

Supports yes/no and multiple-choice single-select polls.

### reminders

... pretty much what you'd expect.

### report

Allows users to flag messages and report users via message context menu commands.

### starboard

A starboard. Or rather, multiple. You can configure starboards on a per-category, channel, or thread basis. The threshold is also configurable per starboard channel.

### suggestions

Allow users to suggest things for the server.

### utility

Info commands, user avatar, etc.

### welcome

Welcome messages.

### xp

Text and voice XP.
