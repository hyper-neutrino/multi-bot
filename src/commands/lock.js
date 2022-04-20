import { Command } from "paimon.js";
import { expand } from "../lib/format.js";

export const module = "moderation";

export const command = [
    new Command({
        name: "lock",
        description:
            "Lock a channel by setting @everyone's override to Send Messages to deny.",
        options: ["c:channel*:text the channel to lock"],
        async execute(cmd, channel) {
            channel ??= cmd.channel;

            if (channel.type != "GUILD_TEXT") return "Invalid channel type.";

            await channel.permissionOverwrites.edit(cmd.guild.roles.everyone, {
                SEND_MESSAGES: false,
            });

            return [
                `${channel} is now locked and @everyone can no longer send messages in it.`,
                `+ lock ${expand(channel)}`,
            ];
        },
        permission: "lock",
    }),

    new Command({
        name: "unlock",
        description:
            "Unlock a channel by setting @everyone's override to Send Messages to neutral.",
        options: ["c:channel*:text the channel to unlock"],
        async execute(cmd, channel) {
            channel ??= cmd.channel;

            if (channel.type != "GUILD_TEXT") return "Invalid channel type.";

            await channel.permissionOverwrites.edit(cmd.guild.roles.everyone, {
                SEND_MESSAGES: null,
            });

            return [
                `${channel} is now unlocked and @everyone can send messages in it based on their roles.`,
                `- lock ${expand(channel)}`,
            ];
        },
        permission: "lock",
    }),
];
