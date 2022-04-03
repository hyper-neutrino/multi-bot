import { Event } from "paimon.js";
import { expand } from "../lib/format.js";
import { is_protected_channel } from "../lib/nukeguard.js";
import { get_setting_channel } from "../lib/settings.js";

export default [
    new Event({
        event: "channelDelete",

        async run(channel) {
            if (!(await is_protected_channel(channel.id))) return;

            for (const entry of (
                await channel.guild.fetchAuditLogs({
                    type: "CHANNEL_DELETE",
                })
            ).entries.values()) {
                if (entry.target.id != channel.id) continue;

                const admin_chat = await get_setting_channel("logs.admin-chat");

                let bannable = true;

                const member = await channel.guild.members.fetch(
                    entry.executor.id
                );

                if (member) {
                    if (!member.moderatable) bannable = false;
                }

                if (admin_chat) {
                    if (bannable) {
                        await admin_chat.send({
                            embeds: [
                                {
                                    title: "Nukeguard Alert: Channel Deleted",
                                    description: `#${channel.name} (\`${
                                        channel.id
                                    }\`) was just deleted by ${expand(
                                        entry.executor
                                    )}. They have been banned; please evaluate the situation.`,
                                    color: "RED",
                                },
                            ],
                        });
                    } else {
                        await admin_chat.send({
                            embeds: [
                                {
                                    title: "Nukeguard Alert: Channel Deleted",
                                    description: `#${channel.name} (\`${
                                        channel.id
                                    }\`) was just deleted by ${expand(
                                        entry.executor
                                    )} but I am unable to ban them!`,
                                    color: "PURPLE",
                                },
                            ],
                        });
                    }
                }

                console.log(
                    `[NUKEGUARD] ${entry.executor.tag} (${entry.executor.id}) deleted #${channel.name} (${channel.id}).`
                );

                if (!bannable) return;

                try {
                    await entry.executor.send({
                        embeds: [
                            {
                                title: "Nukeguard Action: Banned",
                                description: `Your deletion of #${channel.name} (\`${channel.id}\`) has been logged for admin review and you have been banned. If this was a legitimate action, don't worry about it; you should be unbanned shortly.`,
                                color: "RED",
                            },
                        ],
                    });
                } finally {
                    await channel.guild.bans.create(entry.executor);
                }

                return;
            }
        },
    }),
];
