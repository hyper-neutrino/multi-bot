import client from "../client.js";
import db from "../db.js";
import { next_id } from "../lib/dbutils.js";
import { unparse_duration } from "../lib/format.js";
import { get_setting, get_setting_role } from "../lib/settings.js";
import { reason_fields } from "./utils.js";

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

    const member = await client.home.members.fetch(user.id);
    await member.disableCommunicationUntil(
        Date.now() + duration,
        `timed out by ${mod.user.tag} ${mod.id}`
    );

    if (dm) {
        try {
            await user.send({
                embeds: [
                    {
                        title: `Timed out in: ${mod.guild}`,
                        description: `You were **timed out** in ${
                            mod.guild
                        } ${unparse_duration(duration)}`,
                        color: await get_setting("embed-color"),
                        fields: await reason_fields(reason, true),
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
