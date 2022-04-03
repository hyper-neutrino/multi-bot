import { Event } from "paimon.js";
import client from "../client.js";
import { get_setting, get_setting_channel } from "../lib/settings.js";
import { get_supporter_announcement } from "../lib/supporter-announcements.js";
import { recursive_edit, translate } from "../lib/utils.js";

export default new Event({
    event: "guildMemberUpdate",

    async run(before, after) {
        if (!client.all_commands.has("supporter-announcement")) return;

        if (new Date() - after.joinedAt < 10000) return; // hack to avoid auto-roles from re-triggering announcements

        for (const role of after.roles.cache.values()) {
            if (!before.roles.cache.has(role.id)) {
                const entry = await get_supporter_announcement(role.id);
                if (!entry) continue;

                const channel = await get_setting_channel("logs.supporter");
                if (!channel) return;

                await channel.send(
                    await recursive_edit(
                        entry.data,
                        async (string) =>
                            await translate(string, after, role.members.size)
                    )
                );
            }
        }
    },
});
