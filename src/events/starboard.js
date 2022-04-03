import { Event } from "paimon.js";
import client from "../client.js";
import { copy_attachments } from "../lib/message_utils.js";
import { get_setting } from "../lib/settings.js";
import {
    create_star_link,
    destroy_star_link,
    get_starboard,
    get_star_link,
} from "../lib/starboard.js";

export default [
    new Event({ event: "messageReactionAdd", run: check_stars }),
    new Event({ event: "messageReactionRemove", run: check_stars }),
    new Event({ event: "messageReactionRemoveAll", run: check_stars }),
    new Event({ event: "messageReactionRemoveEmoji", run: check_stars }),
    new Event({ event: "messageDelete", run: check_star_delete }),
    new Event({
        event: "messageDeleteBulk",
        async run(messages) {
            for (const message of messages.values()) {
                await check_star_delete(message);
            }
        },
    }),
];

const stars = new Set();

async function check_stars(message) {
    message = message.message || message;
    if (message.content == null) await message.fetch();

    if (!message.guild.id == client.home.id) return;

    const starboard = await get_starboard(message.channel);
    if (!starboard) return;

    const reactions = message.reactions.cache.get("⭐");
    const count = reactions ? reactions.count : 0;
    const target = await get_star_link(starboard, message);

    if (count < ((await get_setting(`star-threshold.${starboard.id}`)) || 5)) {
        if (target) {
            try {
                await target.delete();
            } catch {}

            stars.delete(message.id);
            await destroy_star_link(message.id);
        }
    } else {
        const content = `🌟 **${count}** ${message.channel}`;

        if (target) {
            await target.edit({ content });
        } else {
            if (stars.has(message.id)) {
                setTimeout(() => check_stars(message), 1000);
                return;
            }

            stars.add(message.id);

            const attachments = await copy_attachments(message, 0);

            const single =
                attachments.length == 1 &&
                !attachments[0].name.startsWith("SPOILER_");

            const link = await starboard.send({
                content,
                embeds: [
                    {
                        description: message.content,
                        color: await get_setting("embed-color"),
                        fields: [
                            {
                                name: "Source",
                                value: `[Jump!](${message.url})`,
                            },
                        ],
                        author: {
                            name: message.member.user.tag,
                            iconURL: message.member.displayAvatarURL({
                                dynamic: true,
                            }),
                        },
                        footer: { text: message.id },
                        image: single
                            ? { url: attachments[0].attachment }
                            : null,
                    },
                ],
                files: single ? [] : attachments,
            });

            await create_star_link(message.id, link.id);
        }
    }
}

async function check_star_delete(message) {
    const target = await get_star_link(
        await get_starboard(message.channel),
        message
    );
    if (!target) return;

    try {
        await target.delete();
    } finally {
        await destroy_star_link(message.id);
    }
}
