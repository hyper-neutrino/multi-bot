import { Event } from "paimon.js";
import client from "../client.js";
import { automod_scan, is_automod_ignoring } from "../lib/automod.js";
import { expand } from "../lib/format.js";
import { has_permission } from "../lib/permissions.js";
import { get_setting, get_setting_channel } from "../lib/settings.js";
import { log } from "../logging.js";
import warn from "../moderation/warn.js";
import mute from "../moderation/mute.js";
import kick from "../moderation/kick.js";
import ban from "../moderation/ban.js";
import { link_origin } from "../moderation/utils.js";

export default [
    new Event({
        event: "messageCreate",

        async run(message) {
            await scan(message);
        },
    }),

    new Event({
        event: "messageUpdate",

        async run(_, message) {
            await scan(message);
        },
    }),
];

async function scan(message) {
    if (!client.all_commands.has("automod")) return;
    if (!message.guild) return;
    if (message.guild.id != client.home.id) return;
    if (await has_permission("automod-bypass", message.member)) return;
    if (await is_automod_ignoring(message.channel)) return;

    const { result, matches } = await automod_scan(message.content);

    if (!result) return;

    if (!message.author) {
        if (result != "defer") await message.delete();
        return;
    }

    const fields = [
        {
            name: "Author",
            value: expand(message.author),
            inline: true,
        },
        {
            name: "Channel",
            value: expand(message.channel),
            inline: true,
        },
        {
            name: "Content",
            value: message.content.substring(0, 1024),
            inline: false,
        },
        {
            name: "Detected",
            value: [...matches]
                .map((match, index) => `${index + 1}. \`${match}\``)
                .join("\n")
                .substring(0, 1024),
            inline: false,
        },
    ];

    const embed = {
        title: "Automod Alert",
        description: `Bad phrase(s) detected with action taken: \`${result}\`. `,
        url: message.url,
        fields: fields,
        color: "AQUA",
    };

    const watchlist = await get_setting_channel("logs.watchlist");
    const modchat = await get_setting_channel("logs.mod-chat");

    let channel;

    switch (result) {
        case "defer":
            embed.description += "I am deferring this report to you.";
            channel = modchat;
            break;
        case "delete":
            embed.description += "I silently deleted this message.";
            channel = watchlist;
            break;
        case "verbal":
            embed.description += "I sent a verbal warning to this user.";
            channel = watchlist;
            break;
        case "warn":
            embed.description += "I sent a formal warning to this user.";
            channel = watchlist;
            break;
        case "mute":
            embed.description +=
                "I have muted this user; please evaluate the situation.";
            channel = modchat;
            break;
        case "kick":
            embed.description += "I have kicked this user.";
            channel = watchlist;
            break;
        case "ban":
            embed.description +=
                "I have banned this user; please evaluate the situation.";
            channel = modchat;
            break;
    }

    const alert = channel && (await channel.send({ embeds: [embed] }));

    await log({
        embeds: [
            {
                title: "Automod Action Taken",
                description: `Action taken: \`${result}\`.`,
                color: "AQUA",
                fields,
                url: alert && alert.url,
            },
        ],
    });

    if (result == "defer") return;

    await message.delete();

    if (result == "delete") return;

    try {
        await message.author.send({
            embeds: [
                {
                    title: "Automod Action Taken",
                    description: user_messages[result],
                    fields: [
                        fields[2],
                        fields[3],
                        result == "ban"
                            ? [
                                  {
                                      name: "Appeal",
                                      value: "You can appeal this decision [here](https://forms.gle/ro3hQFDKf35gM2aA7); however, we will not make any promises that your punishment will be reconsidered.",
                                  },
                              ]
                            : [],
                    ].flat(),
                    color: await get_setting("embed-color"),
                    footer:
                        result == "ban"
                            ? []
                            : [
                                  {
                                      text: "You can respond to this message to contact staff.",
                                  },
                              ],
                },
            ],
        });
    } finally {
        const reason = `[AUTO] ${[...matches].join(", ")}`.substring(0, 1000);
        let id, _;
        if (result == "warn") {
            [_, id] = await warn(
                client.home.me,
                message.member,
                reason,
                true,
                false
            );
        } else if (result == "mute") {
            [_, id] = await mute(
                client.home.me,
                message.member,
                reason,
                false,
                0
            );
        } else if (result == "kick") {
            [_, id] = await kick(client.home.me, message.member, reason, false);
        } else if (result == "ban") {
            [_, id] = await ban(
                client.home.me,
                message.member,
                reason,
                false,
                0,
                0
            );
        }
        if (id) await link_origin(id, alert.url);
    }
}

const user_messages = {
    verbal: "This is just a verbal warning regarding a message you sent. This does not go on your record, but please keep it in mind in the future.",
    warn: "This is a warning regarding a message you sent.",
    mute: "You have been muted for a message you sent, and a moderator will evaluate the situation shortly.",
    kick: "You have been kicked for a message you sent. You may rejoin whenever you want, but please think over your actions and words more carefully.",
    ban: "You have been banned for a message you sent, and a moderator will evaluate the situation shortly.",
};
