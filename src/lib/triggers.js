import db from "../db.js";

export async function create_trigger(data) {
    await db.triggers.insertOne({ count: 0, ...data });
}

export async function rm_trigger(match) {
    await db.triggers.findOneAndDelete({ match });
}

export async function get_trigger(match) {
    return await db.triggers.findOne({ match });
}

export async function use_trigger(match) {
    await db.triggers.findOneAndUpdate({ match }, { $inc: { count: 1 } });
}

export async function get_triggers() {
    return await db.triggers.find({}).toArray();
}
