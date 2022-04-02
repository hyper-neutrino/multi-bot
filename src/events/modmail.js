import { Event } from "paimon.js";
import client from "../client.js";
import { expand } from "../lib/format.js";
import { copy_attachments } from "../lib/message_utils.js";
import {
    add_modmail_message,
    get_modmail_channel,
    get_modmail_user,
    has_open_modmail,
    is_modmail_channel,
    set_modmail_closed,
} from "../lib/modmail.js";
import { has_permission } from "../lib/permissions.js";
import { get_setting } from "../lib/settings.js";
import { escape_regex } from "../lib/utils.js";

export default new Event({
    event: "messageCreate",

    async run(message) {
        if (message.author.id == client.user.id) return;
        if (!(await client.all_commands.has("modmail"))) return;
        if (message.channel.guild) await check_outgoing_modmail(message);
        else await check_incoming_modmail(message);
    },
});

async function check_outgoing_modmail(message) {
    if (!(await is_modmail_channel(message.channel.id))) return;

    let prefix,
        found = false,
        anon;

    for (const [key, def, _anon] of [
        ["modmail-prefix", "#reply", false],
        ["modmail-prefix-anon", "#anonreply", true],
    ]) {
        prefix = (await get_setting(key)) || def;
        if (
            message.content.match(new RegExp(`^${escape_regex(prefix)}(\\s|$)`))
        ) {
            found = true;
            anon = _anon;
            break;
        }
    }

    if (!found) return;

    if (!(await has_permission("modmail", message.member))) {
        await message.reply("You do not have permission to reply to modmail.");
        return;
    }

    if (
        message.stickers
            .toJSON()
            .some(
                (sticker) => sticker.format != "PNG" && sticker.format != "APNG"
            )
    ) {
        await message.reply("A sticker you sent is in an unsupported format.");
        return;
    }

    let user;

    try {
        const user_id = await get_modmail_user(message.channel.id);
        user = await client.users.fetch(user_id);
    } catch {}

    await set_modmail_closed(message.channel.id, false);

    const content = message.content.substring(prefix.length).trim();
    const attachments = await copy_attachments(message, 0);

    if (!content && attachments.length == 0) {
        await message.reply(
            "Please enter a non-empty response or include at least one attachment."
        );
        return;
    }

    const embed = {
        description: content,
        color: await get_setting("embed-color"),
        attachments,
    };

    if (!anon) {
        embed.author = {
            name: message.author.tag,
            iconURL: message.member.displayAvatarURL({ dynamic: true }),
        };
        embed.footer = {
            iconURL: message.member.roles.highest.iconURL(),
            text: message.member.roles.highest.name,
        };
    } else {
        embed.footer = { text: "Anonymous Message" };
    }

    try {
        await user.send({
            embeds: [
                { title: `Staff Message from ${message.guild.name}`, ...embed },
            ],
            files: attachments,
        });
    } catch (error) {
        console.error(error);
        await message.reply({
            content: `I could not DM ${expand(user)}.`,
        });
        return;
    }

    await add_modmail_message(user.id, {
        incoming: false,
        sender: message.author.id,
        anon,
        content,
        attachments,
    });

    await message.reply({
        embeds: [{ title: `Outgoing Message to ${user.tag}`, ...embed }],
        files: attachments,
        allowedMentions: { parse: [] },
    });
}

async function check_incoming_modmail(message) {
    if (
        message.stickers
            .toJSON()
            .some(
                (sticker) => sticker.format != "PNG" && sticker.format != "APNG"
            )
    ) {
        await message.reply("A sticker you sent is in an unsupported format.");
        return;
    }

    if (!(await has_open_modmail(message.author.id))) {
        const prompt = await message.reply({
            embeds: [
                {
                    title: "Confirm Modmail",
                    description: `You are attempting to contact the staff at ${client.home}. Your message will be relayed including attachments (however, stickers will not work), and you will not be able to edit it.`,
                    color: await get_setting("embed-color"),
                },
            ],
            components: [
                {
                    type: "ACTION_ROW",
                    components: [
                        {
                            type: "BUTTON",
                            style: "PRIMARY",
                            customId: "modmail.confirm",
                            emoji: "📨",
                            label: "SEND",
                        },
                        {
                            type: "BUTTON",
                            style: "SECONDARY",
                            customId: "modmail.cancel",
                            label: "CANCEL",
                        },
                    ],
                },
            ],
        });

        let send = true;

        try {
            const click = await prompt.awaitMessageComponent({
                time: 900000 - 10000,
            });

            if (click.customId != "modmail.confirm") send = false;
        } catch {
            send = false;
        }

        await prompt.edit({ components: [] });

        if (!send) return;
    }

    const channel = await get_modmail_channel(message.author);

    const attachments = await copy_attachments(message, 1);

    await channel.send({
        embeds: [
            {
                title: "Incoming Message",
                description: message.content,
                color: await get_setting("embed-color"),
                author: {
                    name: message.author.tag,
                    iconURL: message.author.displayAvatarURL({ dynamic: true }),
                },
            },
        ],
        files: attachments,
    });

    await add_modmail_message(message.author.id, {
        incoming: true,
        sender: message.author.id,
        anon: false,
        content: message.content,
        attachments,
    });

    await message.react("✅");
}
