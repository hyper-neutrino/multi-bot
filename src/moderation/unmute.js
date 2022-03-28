import client from "../client.js";
import { get_setting, get_setting_role } from "../lib/settings.js";

export default async function (mod, user, reason, dm) {
    const mute = await get_setting_role("mute");
    if (!mute) throw new Error("The mute role is not configured");
    try {
        const member = await client.home.members.fetch(user.id);
        await member.roles.remove(mute, `unmuted by ${mod.user.tag} ${mod.id}`);
    } catch {}

    if (dm) {
        try {
            await user.send({
                embeds: [
                    {
                        title: `Unmuted in: ${mod.guild}`,
                        description: `You were **unmuted** in ${mod.guild} and are welcome to chat again.`,
                        color: await get_setting("embed-color"),
                        fields: reason
                            ? [{ name: "Reason", value: reason }]
                            : [],
                    },
                ],
            });
            return 1;
        } catch {
            return 2;
        }
    } else return 0;
}
