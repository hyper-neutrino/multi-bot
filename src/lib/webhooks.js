import db from "../db.js";

export async function get_webhook(channel, key) {
    const entry = await db.webhooks.findOne({ channel_id: channel.id, key });
    let hook;

    if (entry) {
        hook = (await channel.fetchWebhooks()).get(entry.id);
        if (hook) return hook;
    }

    hook = await channel.createWebhook(key, {
        reason: `webhook for #${channel.name} (${channel.id}) for key "${key}"`,
    });

    await db.webhooks.findOneAndUpdate(
        { channel_id: channel.id, key },
        { $set: { id: hook.id } },
        { upsert: true }
    );

    return hook;
}
