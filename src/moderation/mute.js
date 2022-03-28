import client from "../client.js";
import db from "../db.js";
import { add_autorole } from "../lib/autoroles.js";
import { next_id } from "../lib/dbutils.js";
import { unparse_duration } from "../lib/format.js";
import { schedule } from "../lib/scheduler.js";
import { get_setting, get_setting_role } from "../lib/settings.js";

export default async function (mod, user, reason, dm, duration) {
    const id = await next_id("history");
    await db.history.insertOne({
        id,
        user_id: user.id,
        type: "mute",
        time: new Date(),
        mod: mod.id,
        reason,
        duration,
    });

    const mute = await get_setting_role("mute");
    if (!mute) throw new Error("The mute role is not configured.");
    try {
        const member = await client.home.members.fetch(user.id);
        await member.roles.add(mute, `muted by ${mod.user.tag} ${mod.id}`);
    } catch {
        await add_autorole(user.id, mute.id);
    }
    if (duration) await schedule("unmute", { user_id: user.id }, duration);

    if (dm) {
        try {
            await user.send({
                embeds: [
                    {
                        title: `Muted in: ${mod.guild}`,
                        description: `You were **muted** in ${
                            mod.guild
                        } ${unparse_duration(duration)}`,
                        color: await get_setting("embed-color"),
                        fields: reason
                            ? [{ name: "Reason", value: reason }]
                            : [],
                        footer: {
                            text: "You can respond to this message to contact staff.",
                        },
                    },
                ],
            });
            return [1, id];
        } catch {
            return [2, id];
        }
    } else return [0, id];
}
