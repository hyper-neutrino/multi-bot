import client from "../client.js";
import db from "../db.js";
import { expand } from "./format.js";
import {
    get_setting,
    get_setting_channel,
    get_setting_role,
} from "./settings.js";

await db.init("modmail_threads");

export async function is_modmail_channel(channel_id) {
    return !!(await db.modmail_threads.findOne({ channel_id }));
}

export async function set_modmail_closed(channel_id, closed) {
    await db.modmail_threads.findOneAndUpdate(
        { channel_id },
        { $set: { closed } }
    );
}

export async function get_modmail_user(channel_id) {
    const entry = await db.modmail_threads.findOne({ channel_id });
    return entry?.user_id;
}

export async function is_modmail_closed(channel_id) {
    const entry = await db.modmail_threads.findOne({ channel_id });
    return entry?.closed;
}

export async function has_open_modmail(user_id) {
    const entry = await db.modmail_threads.findOne({ user_id });
    if (!entry) return false;
    return !entry.closed;
}

export async function add_modmail_message(user_id, data) {
    await db.modmail_threads.findOneAndUpdate(
        { user_id },
        { $push: { messages: data } },
        { upsert: true }
    );
}

export async function get_modmail_messages(user_id) {
    const entry = await db.modmail_threads.findOne({ user_id });
    return entry?.messages ?? [];
}

export async function get_modmail_channel(user, opener) {
    opener ??= user;

    const open_message = {
        embeds: [
            {
                title: "Modmail Thread Opened",
                description: `Modmail with ${expand(user)} was opened by ${
                    user.id == opener.id ? "themselves" : expand(opener)
                }.`,
                color: await get_setting("embed-color"),
            },
        ],
    };

    const ping_role = await get_setting_role("modmail-ping");

    const ping_message = {
        content: ping_role && ping_role.toString(),
        ...open_message,
    };

    let entry = await db.modmail_threads.findOne({ user_id: user.id });
    let channel;

    const anchor = await get_setting_channel("modmail");

    try {
        channel = await client.channels.fetch(entry.channel_id);
        if (entry.closed) {
            await set_modmail_closed(entry.channel_id, false);
            await channel.send(ping_message);
            if (anchor) await anchor.send(open_message);
        }
        return channel;
    } catch {}

    if (!anchor) throw new Error("No modmail channel is configured.");

    const message = await anchor.send(ping_message);
    const thread = await message.startThread({
        name: `${user.username}-${user.discriminator}`,
        autoArchiveDuration: "MAX",
    });

    await db.modmail_threads.findOneAndUpdate(
        {
            user_id: user.id,
        },
        { $set: { channel_id: thread.id, closed: false } },
        { upsert: true }
    );

    return thread;
}
