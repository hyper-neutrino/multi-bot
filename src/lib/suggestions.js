import db from "../db.js";

export async function create_suggestion(message_id, user_id, id) {
    await db.suggestions.insertOne({
        id,
        message_id,
        user_id,
        yes: [],
        no: [],
    });
}

export async function suggestion_vote(message_id, user_id, yes) {
    const entry = await db.suggestions.findOne({ message_id });
    if (!entry) return;
    if (yes) {
        if (entry.yes.indexOf(user_id) != -1) {
            await db.suggestions.findOneAndUpdate(
                { message_id },
                { $pull: { yes: user_id } }
            );
        } else {
            await db.suggestions.findOneAndUpdate(
                { message_id },
                { $addToSet: { yes: user_id }, $pull: { no: user_id } }
            );
        }
    } else {
        if (entry.no.indexOf(user_id) != -1) {
            await db.suggestions.findOneAndUpdate(
                { message_id },
                { $pull: { no: user_id } }
            );
        } else {
            await db.suggestions.findOneAndUpdate(
                { message_id },
                { $addToSet: { no: user_id }, $pull: { yes: user_id } }
            );
        }
    }
}

export async function get_suggestion(message_id) {
    return await db.suggestions.findOne({ message_id });
}

export async function get_suggestion_by_id(id) {
    return await db.suggestions.findOne({ id });
}
