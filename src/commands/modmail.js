import { Command } from "paimon.js";
import client from "../client.js";
import { expand, tag_user } from "../lib/format.js";
import {
    get_modmail_channel,
    get_modmail_messages,
    get_modmail_user,
    is_modmail_channel,
    is_modmail_closed,
    set_modmail_closed,
} from "../lib/modmail.js";
import { pagify } from "../lib/pages.js";
import {
    get_setting,
    get_setting_channel,
    set_setting,
} from "../lib/settings.js";

export default [
    new Command({
        name: "modmail close",
        description: "Close the current modmail thread.",
        options: [
            "b:silent* set to true to not send the close DM (default true)",
        ],
        async execute(cmd, silent) {
            if (
                !(await is_modmail_channel(cmd.channel.id)) ||
                (await is_modmail_closed(cmd.channel.id))
            ) {
                return "This is not an open modmail thread.";
            }

            await cmd.deferReply();

            silent ??= true;

            let status = 0;

            if (!silent) {
                try {
                    let user = await client.users.fetch(
                        await get_modmail_user(cmd.channel.id)
                    );

                    try {
                        await user.send({
                            embeds: [
                                {
                                    title: "Modmail Thread Closed",
                                    description:
                                        "Thank you for contacting staff. This thread has now been closed. If you wish to contact staff again, you can send another message at any time.",
                                    color: await get_setting("embed-color"),
                                },
                            ],
                        });
                        status = 3;
                    } catch {
                        status = 2;
                    }
                } catch {
                    status = 1;
                }
            }

            await set_modmail_closed(cmd.channel.id, true);

            await cmd.editReply({
                embeds: [
                    {
                        title: "Modmail Thread Closed",
                        description: [
                            "The thread was closed silently.",
                            "The thread was closed but the recipient could not be fetched.",
                            "The thread was closed but I could not DM the recipient.",
                            "The thread was closed and the recipient was notified.",
                        ][status],
                        color: "GREEN",
                    },
                ],
            });

            try {
                await cmd.channel.setArchived(
                    true,
                    `modmail closed by ${cmd.user.tag} (${cmd.user.id})`
                );
            } catch {}
        },
        permission: "modmail",
    }),

    new Command({
        name: "modmail open",
        description:
            "Open a modmail thread with a user, or if it exists, link it.",
        options: ["m:member the member to open modmail with"],
        async execute(cmd, member) {
            const anchor = await get_setting_channel("modmail");
            if (!anchor) return "The modmail channel is not configured.";

            await cmd.deferReply();

            const channel = await get_modmail_channel(member.user, cmd.user);

            await cmd.editReply({
                embeds: [
                    {
                        name: `Modmail Thread with ${member.user.tag}`,
                        description: `Check the thread ${channel} (under ${anchor}).`,
                        color: await get_setting("embed-color"),
                    },
                ],
            });
        },
        permission: "modmail",
    }),

    new Command({
        name: "modmail browse",
        description:
            "Look through past modmail messages with a user (in case the thread is deleted).",
        options: [
            "u:user the user to check",
            "b:public* set to true to show the browser publicly (default false)",
        ],
        async execute(cmd, user, pub) {
            pub ??= false;

            await cmd.deferReply({ ephemeral: !pub });

            const messages = await get_modmail_messages(user.id);
            const color = await get_setting("embed-color");
            const output = [];

            while (messages.length > 0) {
                const block = [];
                if ((messages[0].attachments ?? []).length > 0) {
                    block.push(messages.shift());
                } else {
                    while (
                        messages.length > 0 &&
                        block.length < 5 &&
                        (messages[0].attachments ?? []).length == 0
                    ) {
                        block.push(messages.shift());
                    }
                }
                output.push({
                    embeds: await Promise.all(
                        block.map(
                            async ({ incoming, sender, anon, content }) => ({
                                title: `${
                                    incoming ? "Incoming" : "Outgoing"
                                } Message from ${await tag_user(sender)}`,
                                description: content,
                                color,
                                fields: anon
                                    ? [{ name: "_ _", value: "Anonymous" }]
                                    : [],
                            })
                        )
                    ),
                    files: block[0].attachments,
                });
            }

            await pagify(cmd, output, !pub, true);
        },
        permission: "modmail",
    }),

    new Command({
        name: "modmail anchor set",
        description:
            "Set the channel under which modmail threads are opened (modmail log channel).",
        options: ["c:channel:text the log channel"],
        async execute(_, channel) {
            await set_setting("modmail", channel.id);
            return [
                `Set modmail logs + anchor channel to ${channel}.`,
                `= modmail-logs/anchor; ${expand(channel)}`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "modmail role set",
        description: "Set the modmail ping role.",
        options: ["r:role the modmail role"],
        async execute(_, role) {
            await set_setting("modmail-ping", role.id);
            return [
                `Set modmail ping role to ${role}.`,
                `= modmail-ping; ${expand(role)}`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "modmail prefix set",
        description: "Set the modmail reply prefix.",
        options: [
            "b:anon whether or not to set the anon prefix",
            "s:string the modmail prefix",
        ],
        async execute(_, anon, string) {
            await set_setting("modmail-prefix" + (anon ? "-anon" : ""), string);
            return [
                `Set modmail prefix to \`${string}\`.`,
                `= modmail-prefix: \`${string}\``,
            ];
        },
    }),
];
