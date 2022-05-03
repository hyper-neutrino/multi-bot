import db from "../db.js";
import { tag_user, timestamp, unparse_duration } from "../lib/format.js";
import { pagify } from "../lib/pages.js";
import { get_setting } from "../lib/settings.js";

await db.init("history");

export default async function (cmd, mod, filter, ephemeral) {
    await cmd.deferReply({ ephemeral });

    const entries = await db.history
        .find({
            mod: mod.id,
            ...(filter ? { type: filter } : {}),
        })
        .toArray();

    if (entries.length == 0) {
        return await cmd.reply({
            embeds: [
                {
                    title: `User History: ${mod.tag}`,
                    description: `${mod}${
                        filter
                            ? ` has issued no ${filter}s.`
                            : " has not issued any punishments."
                    }`,
                    color: await get_setting("embed-color"),
                },
            ],
            ephemeral,
        });
    }

    const messages = [];

    while (entries.length > 0) {
        messages.push({
            embeds: [
                {
                    title: `Mod History: ${mod.tag}`,
                    color: await get_setting("embed-color"),
                    fields: await Promise.all(
                        entries.splice(0, 7).map(async (entry) => ({
                            name: `${
                                entry.type.charAt(0).toUpperCase() +
                                entry.type.substring(1)
                            } #${entry.id}`,
                            value: `Against <@${
                                entry.user_id
                            }> (${await tag_user(
                                entry.user_id
                            )}) on ${timestamp(entry.time)}${
                                entry.type == "mute" || entry.type == "ban"
                                    ? ` ${unparse_duration(
                                          entry.duration ?? 0
                                      )}`
                                    : ""
                            }${entry.url ? ` [here](${entry.url})` : ""}${
                                entry.reason && `\n\n${entry.reason}`
                            }`,
                        }))
                    ),
                },
            ],
        });
    }

    await pagify(cmd, messages, undefined, true);
}
