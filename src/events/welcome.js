import { Event } from "paimon.js";
import { get_setting, get_setting_channel } from "../lib/settings.js";
import { recursive_edit, translate } from "../lib/utils.js";

export const module = "welcome";

export const event = new Event({
    event: "guildMemberAdd",

    async run(member) {
        const channel = await get_setting_channel("logs.welcome");
        if (!channel) return;

        const data = await get_setting("welcome-data");
        if (!data) return;

        await channel.send(
            await recursive_edit(
                data,
                async (string) =>
                    await translate(string, member, member.guild.memberCount)
            )
        );
    },
});
