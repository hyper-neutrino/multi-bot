import db from "../db.js";
import { next_id } from "../lib/dbutils.js";
import { get_setting } from "../lib/settings.js";

export default async function (mod, user, reason, log, dm) {
    let id;

    if (log) {
        id = await next_id("history");
        await db.history.insertOne({
            id,
            user_id: user.id,
            type: "warn",
            time: new Date(),
            mod: mod.id,
            reason,
        });
    }

    if (dm) {
        try {
            await user.send({
                embeds: [
                    {
                        title: `Warning from: ${mod.guild}`,
                        description: `You were **warned** in ${mod.guild}.${
                            log
                                ? ""
                                : " This will **not** be put on your record."
                        }`,
                        color: await get_setting("embed-color"),
                        fields: [{ name: "Reason", value: reason }],
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
