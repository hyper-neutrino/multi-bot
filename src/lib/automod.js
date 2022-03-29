import db from "../db.js";
import { stem, tokenize } from "./natural.js";

export async function add_automod_term(type, match, action) {
    await db.automod.insertOne({ type, match, action });
}

export async function rm_automod_term(type, match) {
    await db.automod.findOneAndDelete({ type, match });
}

export async function set_automod_action(type, match, action) {
    await db.automod.findOneAndUpdate({ type, match }, { $set: { action } });
}

export async function get_automod_term(type, match) {
    return await db.automod.findOne({ type, match });
}

export async function get_automod_terms(options) {
    return await db.automod.find(options).toArray();
}

export async function add_automod_ignore(channel_id) {
    await db.automod_ignores.findOneAndUpdate(
        { channel_id },
        {},
        { upsert: true }
    );
}

export async function rm_automod_ignore(channel_id) {
    await db.automod_ignores.findOneAndDelete({ channel_id });
}

async function _ignores(channel_id) {
    return !!(await db.automod.findOne({ channel_id }));
}

export async function is_automod_ignoring(channel) {
    do {
        if (await _ignores(channel.id)) return true;
    } while ((channel = channel.parent));
}

export const actions = [
    "defer",
    "delete",
    "verbal",
    "warn",
    "mute",
    "kick",
    "ban",
];

const reverse_actions = [...actions].reverse();

export async function automod_scan(content) {
    content = content.toLowerCase();
    const words = new Map();
    for (const word of tokenize(content)) {
        const root = stem(word)[0];
        if (!words.has(root)) words.set(root, []);
        words.get(root).push(word);
    }
    let result;
    const matches = new Set();
    for (const action of reverse_actions) {
        for (const { type, match } of await get_automod_terms({ action })) {
            if (
                (type == "word" && words.has(match)) ||
                (type == "substring" && content.indexOf(match) != -1) ||
                (type == "boundary" &&
                    content.match(
                        new RegExp(
                            `(^|\\b|(?<=[^A-Za-z]))${match}(?=\\b|[^A-Za-z]|$)`
                        )
                    ))
            ) {
                result ??= action;
                if (type == "word") {
                    for (const word of words.get(match)) {
                        matches.add(word);
                    }
                } else {
                    matches.add(match);
                }
            }
        }
    }
    return { result, matches };
}
