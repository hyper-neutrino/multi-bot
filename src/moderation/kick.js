import db from "../db.js";
import { next_id } from "../lib/dbutils.js";
import { get_setting } from "../lib/settings.js";

export default async function (mod, member, reason, dm) {
    const id = await next_id("history");
    await db.history.insertOne({
        id,
        user_id: member.id,
        type: "kick",
        time: new Date(),
        mod: mod.id,
        reason,
    });

    let status;

    if (dm) {
        try {
            await member.send({
                embeds: [
                    {
                        title: `Kicked from: ${mod.guild}`,
                        description: `You were **kicked** from ${mod.guild}.`,
                        color: await get_setting("embed-color"),
                        fields: reason
                            ? [{ name: "Reason", value: reason }]
                            : [],
                        footer: {
                            text: "You are free to rejoin the server whenever.",
                        },
                    },
                ],
            });
        } catch {
            status = 2;
        }
    } else status = 0;

    await member.kick(`kicked by ${mod.user.tag} ${mod.id}`);

    return [status, id];
}
