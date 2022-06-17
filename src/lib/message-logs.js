import client from "../client.js";
import db from "../db.js";
import { purge_log_skip } from "../events/message-logs.js";

await db.init("logger_ignores");

export async function add_logger_ignore(channel_id) {
    await db.logger_ignores.findOneAndUpdate(
        { channel_id },
        { $set: { channel_id } },
        { upsert: true }
    );
}

export async function rm_logger_ignore(channel_id) {
    await db.logger_ignores.findOneAndDelete({ channel_id });
}

export async function list_logger_ignore() {
    return await db.logger_ignores.find().toArray();
}

async function _ignores(channel_id) {
    return !!(await db.logger_ignores.findOne({ channel_id }));
}

export async function is_logger_ignoring(channel) {
    do {
        if (await _ignores(channel.id)) return true;
    } while ((channel = channel.parent));
}

export async function is_loggable(message, skip_channel, ignore_skip) {
    console.log(1);
    if (!ignore_skip && purge_log_skip.has(message.id)) return false;
    console.log(2);
    if (message.content === null) return false;
    console.log(3);
    if (!message.guild) return false;
    console.log(4);
    if (message.system) return false;
    console.log(5);
    if (message.guild.id != client.home.id) return false;
    console.log(6);
    if (message.webhookId) return false;
    console.log(7);
    if (message.author?.bot) return false;
    console.log(8);
    if (skip_channel) return true;
    console.log(9);
    if (await is_logger_ignoring(message.channel)) return false;
    console.log(10);

    return true;
}
