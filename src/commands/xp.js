import { Command } from "paimon.js";
import { get_setting, set_setting } from "../lib/settings.js";
import { get_leaderboard, get_xp, reset_leaderboard } from "../lib/xp.js";

export const module = "xp";

export const command = [
    new Command({
        name: "top",
        description: "View the top users on the leaderboard.",
        options: [
            [
                "s:type* leaderboard type (text / voice)",
                "Text",
                "Voice",
                "Combined",
            ],
            [
                "s:duration* the leaderboard duration",
                "All-Time",
                "Monthly",
                "Weekly",
                "Daily",
            ],
            "i:page*:1- the page number to view",
        ],
        async execute(cmd, type, duration, page) {
            type ??= "Combined";
            duration ??= "All-Time";
            page ??= 1;

            const leaderboard = await get_leaderboard();
            const dkey = duration.toLowerCase();
            leaderboard.forEach((entry) => (entry.scores = entry[dkey]));

            const size = type == "Combined" ? 5 : 10;
            const fields = [];

            for (const subtype of type == "Combined"
                ? ["Text", "Voice"]
                : [type]) {
                const key = subtype.toLowerCase();

                const filtered = leaderboard
                    .filter((x) => x.scores[key] > 0)
                    .sort((x, y) => y.scores[key] - x.scores[key]);

                let self, index;
                for (let i = 0; i < filtered.length; ++i) {
                    if (filtered[i].user_id == cmd.user.id) {
                        index = i;
                        self = filtered[i];
                        break;
                    }
                }

                const offset = size * (page - 1);

                const entries = filtered
                    .slice(offset, size * page)
                    .map((x, i) => [
                        x,
                        i + offset,
                        i + offset == index ? "**" : "",
                    ]);

                if (self) {
                    if (index < offset)
                        entries.splice(0, 0, [self, index, "**"]);
                    if (index >= offset + size)
                        entries.push([self, index, "**"]);
                }

                let ml = 0;
                for (const [_s, index, _k] of entries) {
                    ml = Math.max(ml, (index + 1).toString().length);
                }

                fields.push({
                    name: `${subtype} [${page} / ${Math.ceil(
                        filtered.length / size
                    )}]`,
                    value:
                        entries
                            .map(
                                ([x, i, k]) =>
                                    `${k}\`#${(i + 1)
                                        .toString()
                                        .padStart(ml)}.\` <@${
                                        x.user_id
                                    }> - \`${Math.floor(x.scores[key])}\`${k}`
                            )
                            .join("\n") || "_[empty]_",
                    inline: true,
                });
            }

            await cmd.reply({
                embeds: [
                    {
                        title: `📋 ${duration} XP Leaderboard`,
                        fields,
                        color: await get_setting("embed-color"),
                        footer: {
                            text: cmd.user.tag,
                            iconURL: await cmd.member.displayAvatarURL({
                                dynamic: true,
                            }),
                        },
                        timestamp: new Date(),
                    },
                ],
            });
        },
    }),

    new Command({
        name: "rank",
        description:
            "View your / another user's XP and rank within the server.",
        options: ["u:user* the user (default yourself)"],
        async execute(cmd, user) {
            await cmd.deferReply();

            user ??= cmd.user;
            const profile = await get_xp(user.id);

            await cmd.editReply({
                embeds: [
                    {
                        title: `XP Rank (placeholder): ${user.tag}`,
                        description: `This is just a placeholder until I implement this feature fully. Text XP is ${Math.floor(
                            profile["all-time"].text
                        )}. Your voice XP is ${Math.floor(
                            profile["all-time"].voice
                        )}.`,
                        color: await get_setting("embed-color"),
                    },
                ],
            });
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

let last_update = new Date();

setInterval(async () => {
    const now = new Date();

    if (now.getDate() != last_update.getDate()) {
        await reset_leaderboard("daily");

        if (now.getDay() == 1) {
            await reset_leaderboard("weekly");
        }

        if (now.getMonth() != last_update.getMonth()) {
            await reset_leaderboard("monthly");
        }
    }

    last_update = now;
}, 10000);
