import canvas from "canvas";
import { MessageAttachment } from "discord.js";
import { Command } from "paimon.js";
import { get_setting, set_setting } from "../lib/settings.js";
import { get_leaderboard, get_xp, reset_leaderboard } from "../lib/xp.js";

const { Canvas, loadImage } = canvas;

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

            let member;
            try {
                member = await cmd.guild.members.fetch(user.id);
            } catch {}

            const name = member ? member.displayName : user.username;

            const profile = await get_xp(user.id);

            const xp = profile["all-time"];

            let rank = { text: 1, voice: 1 };

            for (const entry of await get_leaderboard()) {
                for (const key of ["text", "voice"]) {
                    if (entry["all-time"][key] > xp[key]) ++rank[key];
                }
            }

            const canvas = new Canvas(1000, 400);
            const ctx = canvas.getContext("2d");

            try {
                const background = await loadImage(
                    `./assets/background-${cmd.guild.id}.png`
                );
                ctx.drawImage(background, 0, 0, 1000, 400);
            } catch {}

            ctx.fillStyle = "#0009";
            roundRect(ctx, 350, 25, 600, 100, 10);
            ctx.fill();

            const height = constrain_text(ctx, "sans-serif", name, 550, 60);
            ctx.fillStyle = "#eee";
            ctx.fillText(
                name,
                650 - ctx.measureText(name).width / 2,
                75 + height / 3,
                550
            );

            ctx.fillStyle = "#00000078";
            roundRect(ctx, 350, 150, 600, 225, 10);
            ctx.fill();

            for (const [key, index] of [
                ["text", 0],
                ["voice", 1],
            ]) {
                const amt = 69 + index * 148;
                const max = 420;

                const v = index * 87;

                ctx.fillStyle = "#bbb";
                roundRect(ctx, 500, 201 + v, 400, 36, 10);
                ctx.fill();

                const o = (396 * amt) / max;

                const str = `${amt} / ${max}`;
                ctx.font = "30px sans-serif";

                const width = ctx.measureText(str).width;

                ctx.fillStyle = "#444";
                ctx.fillText(str, 700 - width / 2, 229 + v);

                ctx.save();
                ctx.beginPath();
                roundRect(ctx, 502, 203 + v, o, 32, 10);
                ctx.fillStyle = "#444";
                ctx.fill();
                ctx.clip();
                ctx.fillStyle = "#bbb";
                ctx.fillText(str, 700 - width / 2, 229 + v);
                ctx.restore();

                ctx.fillStyle = "#bbb";
                ctx.fillText("ʟᴠʟ XX", 375, 229 + v);

                ctx.font = "16px sans-serif";
                ctx.fillText(`${key} rank: #${rank[key]}`, 505, 190 + v);

                const total = `total: ${Math.floor(xp[key])}`;
                ctx.fillText(
                    total,
                    895 - ctx.measureText(total).width,
                    190 + v
                );
            }

            const x = 150,
                y = 150,
                r = 100;

            ctx.fillStyle = "#fff5";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(400, 0);
            ctx.lineTo(0, 240);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#888";
            ctx.beginPath();
            ctx.arc(x, y, r + 3, 0, Math.PI * 2, true);
            ctx.fill();

            ctx.fillStyle = "#eee";
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2, true);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            const avatar = await loadImage(
                await (member ?? user).displayAvatarURL({ format: "png" })
            );

            ctx.drawImage(avatar, x - r, y - r, r * 2, r * 2);

            const attachment = new MessageAttachment(
                canvas.toBuffer(),
                `${user.id}-rank.png`
            );

            await cmd.editReply({ files: [attachment] });
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

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function constrain_text(ctx, font, text, width, height) {
    let size = height + 1 ?? 61;

    do {
        ctx.font = `${--size}px ${font}`;
    } while (
        (width && ctx.measureText(text).width > width) ||
        (height && ctx.measureText(text).height > height)
    );

    return size;
}

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
