import { Event } from "paimon.js";
import client from "../client.js";
import { get_triggers, use_trigger } from "../lib/triggers.js";
import { recursive_edit, translate } from "../lib/utils.js";

export default new Event({
    event: "messageCreate",

    async run(message) {
        if (!message.guild) return;
        if (message.guild.id != client.home.id) return;
        if (message.author.bot) return;
        if (message.webhookId) return;

        for (const trigger of await get_triggers()) {
            if (trigger.regex) {
                if (
                    !message.content.match(
                        new RegExp(
                            trigger.wildcard
                                ? trigger.match
                                : `^${trigger.match}$`,
                            trigger.case_sensitive ? "" : "i"
                        )
                    )
                ) {
                    continue;
                }
            } else {
                let content = message.content;
                if (!trigger.case_sensitive) content = content.toLowerCase();

                let match = trigger.match;
                if (!trigger.case_sensitive) match = match.toLowerCase();

                if (trigger.wildcard) {
                    if (content.indexOf(match) == -1) continue;
                } else {
                    if (content != match) continue;
                }
            }

            if (trigger.type == "reaction") {
                await message.react(trigger.response);
            } else {
                const response =
                    trigger.type == "normal"
                        ? {
                              content: await translate(
                                  trigger.response,
                                  message.member,
                                  trigger.count + 1
                              ),
                          }
                        : await recursive_edit(
                              trigger.response,
                              async (string) =>
                                  await translate(
                                      string,
                                      message.member,
                                      trigger.count + 1
                                  )
                          );

                if (trigger.response_type == "normal") {
                    await message.channel.send(response);
                } else if (trigger.response_type == "reply") {
                    await message.reply({
                        allowedMentions: { parse: [] },
                        ...response,
                    });
                } else if (trigger.response_type == "ping") {
                    await message.reply({
                        allowedMentions: { parse: [], repliedUser: true },
                    });
                }
            }

            await use_trigger(trigger.match);
        }
    },
});
