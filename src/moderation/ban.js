import client from "../client.js";
import db from "../db.js";
import { next_id } from "../lib/dbutils.js";
import { unparse_duration } from "../lib/format.js";
import { schedule } from "../lib/scheduler.js";
import { get_setting } from "../lib/settings.js";
import { reason_fields } from "./utils.js";

export default async function (mod, user, reason, dm, duration, days) {
    const id = await next_id("history");
    await db.history.insertOne({
        id,
        user_id: user.id,
        type: "ban",
        time: new Date(),
        mod: mod.id,
        reason,
        duration,
    });

    let status;

    if (dm) {
        try {
            await user.send({
                embeds: [
                    {
                        title: `Banned from: ${mod.guild}`,
                        description: `You were **banned** from ${
                            mod.guild
                        } ${unparse_duration(duration)}`,
                        color: await get_setting("embed-color"),
                        fields: await reason_fields(reason, true),
                    },
                ],
            });
            status = 1;
        } catch {
            status = 2;
        }
    } else status = 0;

    await client.home.bans.create(user, {
        days,
        reason: `banned by ${mod.user.tag} ${mod.id}`,
    });
    if (duration) await schedule("unban", { user_id: user.id }, duration);

    return [status, id];
}
