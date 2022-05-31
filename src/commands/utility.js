import { Command } from "paimon.js";
import { get_custom_role } from "../lib/custom-roles.js";
import {
    expand,
    pluralize,
    timestamp,
    unparse_duration,
} from "../lib/format.js";
import { copy_attachments } from "../lib/message_utils.js";
import { has_permission } from "../lib/permissions.js";
import { get_setting, set_setting } from "../lib/settings.js";
import { member_info, parse_message_link, user_info } from "../lib/utils.js";

export const module = "utility";

export const command = [
    new Command({
        name: "clone",
        description: "Clone a message exactly.",
        options: [
            "s:link the message link",
            "c:channel:text,news,newsthread,privatethread,publicthread the channel to send to",
        ],
        async execute(_, link, channel) {
            const message = await parse_message_link(link);
            if (!message) return "Could not fetch message.";

            await channel.send({
                content: message.content || null,
                embeds: message.embeds,
                components: message.components,
                files: await copy_attachments(message, 0),
            });

            return [
                "Posted.",
                `* clone: ${expand(message.channel)} → ${expand(channel)}`,
            ];
        },
        permission: "send",
    }),

    new Command({
        name: "webhook",
        description: "Set the server's webhook.",
        options: ["s:id the webhook ID or URL"],
        async execute(_, id) {
            if (id.match(/https:\/\/.*discord.com\/api\/webhooks/)) {
                id = id.split("/")[5];
            }
            await set_setting("main-webhook", id);
            return ["Set the main webhook.", `= main webhook → \`${id}\``];
        },
        permission: "webhook",
    }),

    new Command({
        name: "point",
        description: "Point the server's webhook to a new channel.",
        options: ["c:channel:text,news the channel to point to"],
        async execute(cmd, channel) {
            const webhooks = await cmd.guild.fetchWebhooks();
            const webhook = webhooks.get(await get_setting("main-webhook"));

            if (!webhook) {
                return "This server's webhook is not configured or no longer exists. Reconfigure it with `/webhook`.";
            }

            await webhook.edit({ channel });

            return [webhook.url, `* point main webhook → ${expand(channel)}`];
        },
        permission: "webhook",
    }),

    new Command({
        name: "info guild",
        description: "Get information about this server.",
        options: [],
        async execute(cmd) {
            await cmd.deferReply();

            const guild = cmd.guild;

            await cmd.editReply({
                embeds: [
                    {
                        title: `Guild info for ${guild.name}`,
                        description: guild.description,
                        color: await get_setting("embed-color"),
                        image: { url: guild.bannerURL({ size: 4096 }) },
                        footer: {
                            iconURL: guild.iconURL({ dynamic: true }),
                            text: guild.name,
                        },
                        thumbnail: { url: guild.iconURL({ dynamic: true }) },
                        fields: [
                            {
                                name: "ID",
                                value: `\`${guild.id}\``,
                            },
                            {
                                name: "Owner",
                                value: `<@${guild.ownerId}>`,
                            },
                            {
                                name: "Creation Date",
                                value: timestamp(guild.createdAt),
                            },
                            {
                                name: "Channels",
                                value: channel_breakdown(
                                    await guild.channels.fetch()
                                ),
                            },
                            {
                                name: "Members",
                                value: guild.memberCount.toString(),
                                inline: true,
                            },
                            {
                                name: "Invites",
                                value: (
                                    await guild.invites.fetch()
                                ).size.toString(),
                                inline: true,
                            },
                            {
                                name: "Roles",
                                value: (
                                    await guild.roles.fetch()
                                ).size.toString(),
                                inline: true,
                            },
                            {
                                name: "Boosts",
                                value: guild.premiumSubscriptionCount.toString(),
                                inline: true,
                            },
                            guild.vanityURLCode
                                ? {
                                      name: "Vanity Code",
                                      value: (({ code, uses }) =>
                                          `https://discord.gg/${code} (used ${uses} times)`)(
                                          await guild.fetchVanityData()
                                      ),
                                  }
                                : [],
                        ].flat(),
                    },
                ],
            });
        },
    }),

    new Command({
        name: "info user",
        description: "Get information about a user/member.",
        options: ["u:user the user"],
        async execute(cmd, user) {
            await cmd.deferReply();

            try {
                const member = await cmd.guild.members.fetch(user.id);

                await cmd.editReply({
                    embeds: [await member_info(cmd, user, member)],
                });
            } catch {
                user = await user.fetch();

                await cmd.editReply({ embeds: [await user_info(cmd, user)] });
            }
        },
    }),

    new Command({
        name: "info role",
        description: "Get information about a role.",
        options: ["r:role the role"],
        async execute(cmd, role) {
            await cmd.deferReply();

            await cmd.editReply({
                embeds: [
                    {
                        title: `Role info for ${role.name}`,
                        color: role.color,
                        thumbnail: { url: role.iconURL() },
                        fields: [
                            {
                                name: "ID",
                                value: `\`${role.id}\``,
                            },
                            {
                                name: "Created At",
                                value: timestamp(role.createdAt),
                            },
                            {
                                name: "Display Color",
                                value: role.hexColor,
                                inline: true,
                            },
                            {
                                name: "Members",
                                value: role.members.size.toString(),
                                inline: true,
                            },
                            {
                                name: "Position",
                                value: role.position.toString(),
                                inline: true,
                            },
                            {
                                name: "Hoist",
                                value: `Members with this role are ${
                                    role.hoist ? "" : "not "
                                }displayed separately on the member list.`,
                            },
                            {
                                name: "Mentionable",
                                value: `This role is ${
                                    role.mentionable ? "" : "not "
                                }mentionable by everyone.`,
                            },
                            role.tags
                                ? [
                                      role.tags.botId
                                          ? {
                                                name: "Bot",
                                                value: `This role is managed by <@${role.tags.botId}>.`,
                                            }
                                          : [],
                                      role.tags.integrationId
                                          ? {
                                                name: "Integration",
                                                value: `This role is managed by integration \`${role.tags.integrationId}\`.`,
                                            }
                                          : [],
                                      role.tags.premiumSubscriberRole
                                          ? {
                                                name: "Booster Role",
                                                value: "This role is this server's premium subscriber / booster role.",
                                            }
                                          : [],
                                  ].flat()
                                : [],
                            {
                                name: "Permissions",
                                value:
                                    role.permissions
                                        .toArray()
                                        .map((x) => `\`${x}\``)
                                        .join(", ") || "(none)",
                            },
                        ].flat(),
                    },
                ],
            });
        },
    }),

    new Command({
        name: "info channel",
        description: "Get information about a channel.",
        options: ["c:channel the channel"],
        async execute(cmd, channel) {
            await cmd.deferReply();

            const head = [
                { name: "ID", value: `\`${channel.id}\`` },
                { name: "Created At", value: timestamp(channel.createdAt) },
                channel.parent
                    ? { name: "Category", value: channel.parent.name }
                    : [],
            ].flat();

            if (channel.type == "GUILD_TEXT" || channel.type == "GUILD_NEWS") {
                await cmd.editReply({
                    embeds: [
                        {
                            title: `${
                                channel.type == "GUILD_TEXT" ? "Text" : "News"
                            } channel info for ${channel.name}`,
                            description: channel.topic,
                            color: "GREY",
                            fields: [
                                ...head,
                                {
                                    name: "Members",
                                    value: channel.members.size.toString(),
                                },
                                channel.nsfw
                                    ? {
                                          name: "NSFW",
                                          value: "This channel is NSFW. Only members aged 18+ are allowed. It is still subject to Discord's Terms of Service.",
                                      }
                                    : {
                                          name: "SFW",
                                          value: "This channel is SFW. All members are allowed. Refrain from posting explicit content.",
                                      },
                                {
                                    name: "Active Threads",
                                    value: (
                                        await channel.threads.fetchActive()
                                    ).threads.size.toString(),
                                },
                                {
                                    name: "Thread Auto-Archive Duration",
                                    value:
                                        {
                                            60: "1 hour",
                                            1440: "1 day",
                                            4320: "3 days",
                                            10080: "7 days",
                                            MAX: "maximum",
                                        }[channel.defaultAutoArchiveDuration] ||
                                        "1 day",
                                },
                                channel.rateLimitPerUser
                                    ? {
                                          name: "Slowmode",
                                          value: unparse_duration(
                                              channel.rateLimitPerUser * 60000
                                          ),
                                      }
                                    : [],
                            ].flat(),
                        },
                    ],
                });
            } else if (
                channel.type == "GUILD_VOICE" ||
                channel.type == "GUILD_STAGE_VOICE"
            ) {
                await cmd.editReply({
                    embeds: [
                        {
                            title: `${
                                channel.type == "GUILD_VOICE"
                                    ? "Voice"
                                    : "Stage"
                            } channel info for ${channel.name}`,
                            color: "GREY",
                            fields: [
                                ...head,
                                {
                                    name: "Bitrate",
                                    value: channel.bitrate.toString(),
                                    inline: true,
                                },
                                {
                                    name: "RTC Region",
                                    value: channel.rtcRegion || "auto",
                                    inline: true,
                                },
                                {
                                    name: "User Limit",
                                    value: (
                                        channel.userLimit || "none"
                                    ).toString(),
                                    inline: true,
                                },
                            ],
                        },
                    ],
                });
            } else if (channel.type == "GUILD_CATEGORY") {
                await cmd.editReply({
                    embeds: [
                        {
                            title: `Category channel info for ${channel.name}`,
                            color: "GREY",
                            fields: [
                                head[0],
                                head[1],
                                {
                                    name: "Channels",
                                    value: channel_breakdown(channel.children),
                                },
                            ],
                        },
                    ],
                });
            } else if (channel.type.match("THREAD")) {
                await cmd.editReply({
                    embeds: [
                        {
                            title: `Thread channel info for ${channel.name}`,
                            color: "GREY",
                            fields: [
                                head[0],
                                head[1],
                                {
                                    name: "Parent Channel",
                                    value: channel.parent.toString(),
                                },
                                channel.archived
                                    ? {
                                          name: "Archived At",
                                          value: timestamp(
                                              new Date(channel.archiveTimestamp)
                                          ),
                                      }
                                    : {
                                          name: "Auto-Archive Duration",
                                          value: unparse_duration(
                                              channel.autoArchiveDuration *
                                                  60000
                                          ),
                                      },
                                {
                                    name: "Members",
                                    value: (
                                        await channel.members.fetch()
                                    ).size.toString(),
                                },
                                channel.rateLimitPerUser
                                    ? {
                                          name: "Slowmode",
                                          value: unparse_duration(
                                              channel.rateLimitPerUser * 60000
                                          ),
                                      }
                                    : [],
                            ].flat(),
                        },
                    ],
                });
            }
        },
    }),

    new Command({
        name: "avatar",
        description: "Get the user's avatar(s).",
        options: ["u:user the user to check"],
        async execute(cmd, user) {
            let member;
            try {
                member = await cmd.guild.members.fetch(user.id);
            } catch {}

            const urls = [];

            if (member) {
                const url = member.avatarURL({ dynamic: true, size: 4096 });
                if (url) urls.push(url);
            }

            urls.push(user.displayAvatarURL({ dynamic: true, size: 4096 }));

            await cmd.reply({
                embeds: urls.map((url, index) => ({
                    title: `${
                        urls.length > 1 && index == 0 ? "Guild-Specific " : ""
                    }Avatar Link`,
                    color:
                        urls.length > 1 && index == 0
                            ? member.displayColor
                            : user.accentColor,
                    url,
                    image: { url },
                    author: {
                        name:
                            urls.length > 1 && index == 0
                                ? member.displayName
                                : user.tag,
                        url,
                        iconURL: url,
                    },
                })),
            });
        },
        permission: "history",
    }),
];

function channel_breakdown(channels) {
    let count = 0,
        text = 0,
        voice = 0,
        category = 0,
        news = 0,
        stage = 0,
        thread = 0;

    for (const channel of channels.values()) {
        ++count;
        switch (channel.type) {
            case "GUILD_TEXT":
                ++text;
                break;
            case "GUILD_VOICE":
                ++voice;
                break;
            case "GUILD_CATEGORY":
                ++category;
                break;
            case "GUILD_NEWS":
                ++news;
                break;
            case "GUILD_STAGE_VOICE":
                ++stage;
                break;
            case "GUILD_NEWS_THREAD":
            case "GUILD_PUBLIC_THREAD":
            case "GUILD_PRIVATE_THREAD":
                ++thread;
                break;
        }
    }

    return `${count} (${[
        text ? `${text} text` : [],
        voice ? `${voice} voice` : [],
        category ? `${category} categor${pluralize(category, "y", "ies")}` : [],
        news ? `${news} news` : [],
        stage ? `${stage} stage` : [],
        thread ? `${thread} thread${pluralize(thread)}` : [],
    ]
        .flat()
        .join(", ")})`;
}
