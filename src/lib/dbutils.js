import db from "../db.js";

export async function next_id(seq) {
    const document = await db.counters.findOneAndUpdate(
        { seq },
        { $inc: { val: 1 } },
        { upsert: true }
    );
    return document.value ? document.value.val + 1 : 1;
}
