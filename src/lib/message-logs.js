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
    if (!ignore_skip && purge_log_skip.has(message.id))
        return console.log("a"), false;
    if (message.content === null) return console.log("b"), false;
    if (!message.guild) return console.log("c"), false;
    if (message.system) return console.log("d"), false;
    if (message.guild.id != client.home.id) return console.log("e"), false;
    if (message.webhookId) return console.log("f"), false;
    if (message.author?.bot) return console.log("g"), false;
    if (skip_channel) return console.log("h"), true;
    if (await is_logger_ignoring(message.channel))
        return console.log("i"), false;

    return console.log("j"), false;
}
