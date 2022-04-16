import { Command } from "paimon.js";
import db from "../db.js";
import {
    afk_clear_ignores,
    afk_ignore,
    afk_is_ignored,
    afk_unignore,
    clear_afk,
    get_afk,
    set_afk,
} from "../lib/afk.js";
import { get_setting } from "../lib/settings.js";

export const module = "afk";

export const command = [
    new Command({
        name: "afk set",
        description: "Set your AFK status.",
        options: [
            "s:message* the message to include (leave blank for default)",
            "b:nickname* whether or not to change your nickname (default: true)",
        ],
        async execute(cmd, message, nickname) {
            message ??= "AFK";

            await set_afk(cmd.user.id, message);

            if (
                (nickname ?? true) &&
                cmd.member.manageable &&
                !cmd.member.displayName.startsWith("[AFK]")
            ) {
                await cmd.member.edit({
                    nick: `[AFK] ${cmd.member.displayName}`,
                });
            }

            await cmd.shout(`Your AFK status has been set: ${message}`);
        },
    }),

    new Command({
        name: "afk clear",
        description: "Clear your AFK status.",
        options: [],
        async execute(cmd) {
            await clear_afk(cmd.member);

            return "Your AFK status has been cleared.";
        },
    }),

    new Command({
        name: "afk mod ignore",
        description:
            "Set a channel to not show the AFK message or clear AFK status on return.",
        options: [
            "c:channel:text,news,newsthread,privatethread,publicthread the channel to ignore",
        ],
        async execute(cmd, channel) {
            if (await afk_is_ignored(channel.id)) {
                return "This channel is already ignored.";
            }

            await afk_ignore(channel.id);

            await cmd.reply({
                embeds: [
                    {
                        title: `Ignored #${channel.name}`,
                        description: `${channel} is now disregarded for AFK (both for displaying AFK messages and clearing AFK on return).`,
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "afk mod unignore",
        description: "Remove a channel from the ignore list.",
        options: [
            "c:channel:text,news,newsthread,privatethread,publicthread the channel to unignore",
        ],
        async execute(cmd, channel) {
            if (!(await afk_is_ignored(channel.id))) {
                return "This channel is already not ignored.";
            }

            await afk_unignore(channel.id);

            await cmd.reply({
                embeds: [
                    {
                        title: `Unignored #${channel.name}`,
                        description: `${channel} is no longer ignored for AFK.`,
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "afk mod ignore-list",
        description: "List ignored channels.",
        options: [],
        async execute(cmd) {
            await cmd.reply({
                embeds: [
                    {
                        title: "Ignored Channels",
                        description: `${
                            (await db.afk_ignore.find({}).toArray())
                                .map(({ channel_id }) => `<#${channel_id}>`)
                                .join("\n") || "(none)"
                        }`,
                        color: await get_setting("embed-color"),
                    },
                ],
            });
        },
    }),

    new Command({
        name: "afk mod ignore-reset",
        description: "Remove AFK ignore from all channels.",
        options: [],
        async execute(cmd) {
            await afk_clear_ignores();

            await cmd.shout("All ignored channels have been cleared.");
        },
    }),

    new Command({
        name: "afk mod reset",
        description: "Reset a user's AFK message to the default.",
        options: ["m:member the member to reset"],
        async execute(cmd, member) {
            if (!(await get_afk(member.id))) return "That user is not AFK.";

            await set_afk(member.id, "AFK", false);

            await cmd.shout(
                `${member}'s AFK message has been reset to the default.`
            );
        },
    }),

    new Command({
        name: "afk mod clear",
        description: "Clear a user's AFK status entirely.",
        options: ["m:member the member to clear"],
        async execute(cmd, member) {
            if (!(await get_afk(member.id))) return "That user is not AFK.";

            await clear_afk(member);

            await cmd.shout(`${member}'s AFK status has been removed.`);
        },
    }),
];
