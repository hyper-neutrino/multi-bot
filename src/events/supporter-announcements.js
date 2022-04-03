import { Event } from "paimon.js";
import client from "../client.js";
import { get_setting, get_setting_channel } from "../lib/settings.js";
import { get_supporter_announcement } from "../lib/supporter-announcements.js";

export default new Event({
    event: "guildMemberUpdate",

    async run(before, after) {
        if (!client.all_commands.has("supporter-announcement")) return;

        if (new Date() - after.joinedAt < 10000) return; // hack to avoid auto-roles from re-triggering announcements

        const color = await get_setting("embed-color");

        for (const role of after.roles.cache.values()) {
            if (!before.roles.cache.has(role.id)) {
                const entry = await get_supporter_announcement(role.id);
                if (!entry) continue;

                const channel = await get_setting_channel("logs.supporter");
                if (!channel) return;

                await channel.send({
                    embeds: [
                        {
                            title: translate(
                                entry.title,
                                after,
                                role.members.size
                            ),
                            description: translate(
                                entry.body,
                                after,
                                role.members.size
                            ),
                            color,
                            thumbnail: {
                                url: after.displayAvatarURL({ dynamic: true }),
                            },
                        },
                    ],
                });
            }
        }
    },
});

function translate(string, member, count) {
    return string
        .replaceAll("{name}", member.user.username)
        .replaceAll("{nick}", member.displayName)
        .replaceAll("{tag}", member.user.tag)
        .replaceAll("{mention}", member.toString())
        .replaceAll("{discriminator}", member.user.discriminator)
        .replaceAll("{count}", count.toString());
}
