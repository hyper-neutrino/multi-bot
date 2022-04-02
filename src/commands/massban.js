import { Command } from "paimon.js";
import client from "../client.js";
import { post_modal } from "../lib/modals.js";
import massban from "../moderation/massban.js";
import fetch from "node-fetch";

export default [
    new Command({
        name: "massban",
        description:
            "Massban users (input IDs in a pop-up after calling this command).",
        options: [
            "s:reason the reason for the ban (logged but not sent to users)",
            "i:days*:0-7 the number of days of messages to delete (default 0)",
        ],
        async execute(cmd, reason, days) {
            days ??= 0;

            const modal = await post_modal(cmd, {
                title: "Massban",
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 4,
                                style: 2,
                                custom_id: "massban.user_ids",
                                label: "Enter User IDs",
                                placeholder:
                                    "There will be no confirmation prompt. Please make sure the list you pasted is correct.",
                            },
                        ],
                    },
                ],
            });

            const user_ids = modal.data.components[0].components[0].value;

            if (!user_ids.match(id_regex)) {
                await modal.respond({
                    flags: 64,
                    content: fail_response,
                });
                return;
            }

            await modal.respond({
                embeds: [
                    {
                        title: "Massbanning...",
                        description:
                            "This operation may take a long time. I will send another message here when I am done.",
                        color: 15844367,
                    },
                ],
            });

            const callback = `https://discord.com/api/v9/webhooks/${client.user.id}/${modal.token}/messages/@original`;
            const response = await fetch(callback);
            const data = await response.json();
            const id_list = user_ids.trim().split(/\s+/);

            const { embed, success_url, failure_url } = await massban(
                cmd.member,
                id_list,
                reason,
                days,
                `https://discord.com/channels/${cmd.guild.id}/${cmd.channel.id}/${data.id}`
            );

            await cmd.channel.send({ embeds: [embed] });

            await cmd.log(
                `massbanned ${id_list.length} users; reason: ${reason}, success: ${success_url}, failure: ${failure_url}`
            );
        },
        permission: "massban",
    }),

    new Command({
        name: "massban-from-url",
        description: "Massban users from a URL (raw file containing IDs).",
        options: [
            "s:url the url (make sure it is a raw file)",
            "s:reason the reason for the ban (logged but not sent to users)",
            "i:days*:0-7 the number of days of messages to delete (default 0)",
        ],
        async execute(cmd, url, reason, days) {
            let response;

            try {
                response = await fetch(url);
            } catch {
                return "That URL appears to be invalid.";
            }

            if (!response.ok) return "I could not fetch from that URL.";

            const user_ids = await response.text();

            if (!user_ids.match(id_regex)) return fail_response;

            const id_list = user_ids.trim().split(/\s+/);

            const click = await cmd.confirm({
                title: `Massban ${id_list.length} users?`,
                description: `This action will ban ${id_list.length} users and will not DM anyone.`,
                color: "AQUA",
                fields: [{ name: "Reason", value: reason }],
            });

            if (!click) {
                return;
            }

            await click.update({
                embeds: [
                    {
                        title: `Massbanning...`,
                        description:
                            "This operation may take a long time; I will send another message here when I am done.",
                        color: "GOLD",
                    },
                ],
            });

            const { embed, success_url, failure_url } = await massban(
                cmd.member,
                id_list,
                reason,
                days,
                (
                    await cmd.fetchReply()
                ).url
            );

            await cmd.channel.send({ embeds: [embed] });

            await cmd.log(
                `massbanned ${id_list.length} users; reason: ${reason}, success: ${success_url}, failure: ${failure_url}`
            );
        },
        permission: "massban",
    }),
];

const id_regex = /^\s*(\d+\s+)*\d+\s*$/;
const fail_response =
    "That does not appear to be a valid list of user IDs. Your input should consist only of digits and whitespace.";
