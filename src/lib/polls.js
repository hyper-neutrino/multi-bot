import db from "../db.js";

export async function create_poll(message, options, type) {
    await db.polls.findOneAndUpdate(
        { message_id: message.id },
        { $set: { options, type } },
        { upsert: true }
    );
}

export async function set_poll_vote(message, user, option) {
    await db.poll_votes.findOneAndUpdate(
        { message_id: message.id, user_id: user.id },
        { $set: { option } },
        { upsert: true }
    );
}

export async function unset_poll_vote(message, user) {
    await db.poll_votes.findOneAndDelete({
        message_id: message.id,
        user_id: user.id,
    });
}

export async function get_poll_type(message) {
    const entry = await db.polls.findOne({ message_id: message.id });
    if (!entry) return undefined;
    return entry.type;
}

export async function get_poll_votes(message) {
    const entry = await db.polls.findOne({ message_id: message.id });
    if (!entry) return undefined;

    const options = {};
    for (const option of entry.options) options[option] = 0;

    for (const entry of await db.poll_votes
        .find({ message_id: message.id })
        .toArray()) {
        ++options[entry.option];
    }

    return options;
}
