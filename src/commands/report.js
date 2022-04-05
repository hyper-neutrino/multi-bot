import { MessageCommand, UserCommand } from "paimon.js";
import { expand } from "../lib/format.js";
import { copy_attachments } from "../lib/message_utils.js";
import { post_modal } from "../lib/modals.js";
import { get_setting_channel } from "../lib/settings.js";

export default [
    new MessageCommand({
        name: "Flag Message",
        async execute(cmd, message) {
            const modchat = await get_setting_channel("logs.mod-chat");
            if (!modchat) {
                return "The mod channel is not configured; please DM modmail instead.";
            }

            const modal = await post_modal(cmd, {
                title: "Flagging Message - Reason",
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 4,
                                style: 2,
                                label: "Flag Reason",
                                custom_id: "flag.reason",
                                placeholder:
                                    "Please describe what the issue with the message is, if necessary.",
                                max_length: 1024,
                                required: false,
                            },
                        ],
                    },
                ],
            });

            const reason = modal.data.components[0].components[0].value;

            await modchat.send({
                embeds: [
                    {
                        title: "Flagged Message",
                        description: message.content,
                        color: "RED",
                        fields: (reason
                            ? [
                                  {
                                      name: "Reason",
                                      value: reason,
                                  },
                              ]
                            : []
                        ).concat({
                            name: "Source",
                            value: `Sent by ${
                                message.webhookId ? "a webhook" : message.author
                            } in ${message.channel}: [Jump!](${message.url})`,
                        }),
                        author: message.webhookId
                            ? null
                            : {
                                  name: message.author.tag,
                                  iconURL: message.member.displayAvatarURL({
                                      dynamic: true,
                                  }),
                              },
                        footer: {
                            text: `Flagged by ${cmd.user.tag} (${cmd.user.id})`,
                            iconURL: cmd.member.displayAvatarURL({
                                dynamic: true,
                            }),
                        },
                    },
                ],
                files: await copy_attachments(message, 1),
            });

            await modal.respond({
                content:
                    "Your flag has been submitted for review. We will handle it as soon as possible. Thank you!",
                flags: 64,
            });
        },
        permission: "@everyone",
    }),

    new UserCommand({
        name: "Report User",
        async execute(cmd, user) {
            const modchat = await get_setting_channel("logs.mod-chat");
            if (!modchat) {
                return "The mod channel is not configured; please DM modmail instead.";
            }

            const modal = await post_modal(cmd, {
                title: "Reporting User - Reason",
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 4,
                                style: 2,
                                label: "Report Reason",
                                custom_id: "report.reason",
                                placeholder:
                                    "Please explain the problem with the user.",
                                max_length: 4000,
                                required: true,
                            },
                        ],
                    },
                ],
            });

            const reason = modal.data.components[0].components[0].value;

            await modchat.send({
                embeds: [
                    {
                        title: "Reported User",
                        description: reason,
                        color: "RED",
                        fields: [
                            {
                                name: "Reported User",
                                value: `${user} (\`${user.id}\`) was reported.`,
                            },
                        ],
                        author: {
                            name: user.tag,
                            iconURL: user.displayAvatarURL({
                                dynamic: true,
                            }),
                        },
                        footer: {
                            text: `Reported by ${cmd.user.tag} (${cmd.user.id})`,
                            iconURL: cmd.member.displayAvatarURL({
                                dynamic: true,
                            }),
                        },
                    },
                ],
            });

            await modal.respond({
                content:
                    "Your report has been submitted for review. We will handle it as soon as possible. Thank you!",
                flags: 64,
            });
        },
        permission: "@everyone",
    }),
];
