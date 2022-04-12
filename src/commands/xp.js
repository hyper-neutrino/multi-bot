import { Command } from "paimon.js";
import { get_setting, set_setting } from "../lib/settings.js";
import { get_xp } from "../lib/xp.js";

export const module = "xp";

export const command = [
    new Command({
        name: "top",
        description: "View the top users on the leaderboard.",
        options: [
            [
                "s:type* leaderboard type (text / voice)",
                "text",
                "voice",
                "combined",
            ],
            [
                "s:duration* the leaderboard duration",
                "all-time",
                "monthly",
                "weekly",
                "daily",
            ],
            "i:page*:1- the page number to view",
        ],
        async execute(cmd, type, duration, page) {
            type ??= "combined";
            duration ??= "all-time";
            page ??= 1;
        },
    }),

    new Command({
        name: "rank",
        description:
            "View your / another user's XP and rank within the server.",
        options: ["u:user* the user (default yourself)"],
        async execute(cmd, user) {
            user ??= cmd.user;
            const profile = await get_xp(user.id);

            return `Your XP: text: ${profile["all-time"].text}, voice: ${profile["all-time"].voice}`;
        },
    }),

    new Command({
        name: "xp settings get",
        description: "View the current XP scaling configuration.",
        options: [],
        async execute(cmd) {
            await cmd.reply({
                embeds: [
                    {
                        title: `XP settings for ${cmd.guild.name}`,
                        description: `max XP per message: \`${
                            (await get_setting("max-xp-per-message")) ?? 10
                        }\`\nmax delay for XP scaling (seconds): \`${
                            (await get_setting("xp-delay")) ?? 120
                        }\``,
                        color: await get_setting("embed-color"),
                    },
                ],
            });
        },
        permission: "setting",
    }),

    new Command({
        name: "xp settings set",
        description: "Set the XP scaling configuration.",
        options: [
            "n:xp-per-message*:0- max XP per message",
            "n:xp-delay*:0- max delay for XP scaling (seconds)",
        ],
        async execute(_, xp_per_message, xp_delay) {
            if (xp_per_message !== undefined) {
                await set_setting("max-xp-per-message", xp_per_message);
            }

            if (xp_delay !== undefined) {
                await set_setting("xp-delay", xp_delay);
            }

            return [
                "Updated XP settings.",
                `= max-xp-per-message: ${xp_per_message}, xp-delay: ${xp_delay}`,
            ];
        },
        permission: "setting",
    }),
];
