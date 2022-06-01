import { recursive, res } from "file-ez";
import { Client } from "paimon.js";
import { log } from "./logging.js";
import { expand } from "./lib/format.js";
import { create_permission, has_permission } from "./lib/permissions.js";
import { get_setting } from "./lib/settings.js";
import object from "./guild_scope.js";
import { resolvers } from "./lib/modals.js";
import { is_string } from "./lib/utils.js";
import StickerCache from "./lib/sticker_cache.js";

const client = new Client({
    intents: 131071,
    partials: ["CHANNEL", "MESSAGE", "REACTION"],
    presence: {
        activities: [
            {
                type: "LISTENING",
                name: "your DMs",
            },
        ],
    },
    async before(interaction, extras) {
        if (interaction.guild.id != this.home.id) return true;
        if (!(await has_permission(extras.permission, interaction.member))) {
            return "You do not have permission to use this command.";
        }

        interaction.log = async (message, reply) => {
            console.log(
                `[CMD] ${interaction.user.tag} (${interaction.user.id}): /${interaction.commandName} - ${message}`
            );

            if (!reply) {
                try {
                    reply = await interaction.fetchReply();
                } catch {}
            }

            return await log({
                embeds: [
                    {
                        title: `Command Executed: ${interaction.commandName}`,
                        description: message,
                        color: await get_setting("embed-color"),
                        fields: [
                            {
                                name: "Executor",
                                value: expand(interaction.user),
                            },
                            {
                                name: "Channel",
                                value: expand(interaction.channel),
                            },
                        ],
                        url: reply && reply.url,
                    },
                ],
            });
        };

        interaction.confirm = async (embed, options) => {
            let { yes, no, ephemeral, timeout, edit } = options ?? {};
            embed ||= "Please confirm that you would like to take this action.";
            if (is_string(embed)) {
                embed = { title: "Confirm", description: embed };
            }
            yes ||= "CONFIRM";
            no ||= "CANCEL";
            if (is_string(yes)) yes = { label: yes };
            if (is_string(no)) no = { label: no };
            yes.style ||= "SUCCESS";
            no.style ||= "DANGER";
            yes.type = no.type = "BUTTON";
            yes.customId = "confirm.yes";
            no.customId = "confirm.no";
            const message = await (edit || interaction.replied
                ? interaction.editReply
                : interaction.reply
            ).bind(interaction)({
                embeds: [embed],
                components: [
                    {
                        type: "ACTION_ROW",
                        components: [yes, no],
                    },
                ],
                ephemeral,
                fetchReply: true,
            });
            try {
                const response = await message.awaitMessageComponent({
                    filter: (response) =>
                        response.user.id == interaction.user.id,
                    time: timeout || 600000,
                });
                if (response.customId != "confirm.yes") throw 0;
                return response;
            } catch {
                await interaction.editReply({
                    embeds: [
                        {
                            title: "Canceled",
                            description:
                                "This operation was canceled by the user or timed out.",
                            color: "RED",
                        },
                    ],
                    components: [],
                });
                return false;
            }
        };
    },
    async before_autocomplete(interaction, extras) {
        if (interaction.guild.id != this.home.id) return true;
        if (!(await has_permission(extras.permission, interaction.member))) {
            return [];
        }
    },
    async process(interaction, response) {
        if (Array.isArray(response)) {
            interaction.to_log = response[1];
            return response[0];
        }
        return response;
    },
    async after(interaction) {
        if (interaction.to_log) {
            await interaction.log(interaction.to_log);
        }
    },
    async error(interaction, error) {
        if (is_string(error)) {
            try {
                await interaction.reply({
                    content: error,
                    ephemeral: true,
                });
                return;
            } catch {}
        }

        console.error(`Error in command /${interaction.commandName}`);
        console.error(error.stack || error);
    },
});

export default client;

client.home_listeners = [];

client.onHome = (listener) => client.home_listeners.push(listener);

client.stickerCache = new StickerCache(client, "cache");

client.command_set = new Set();

client.init = async function () {
    const include = new Set(object.modules);

    for (const path of await recursive(res("./commands"))) {
        const { module, command } = await import(path);
        if (module && !include.has(module)) continue;
        for (const cmd of [command].flat()) {
            this.add_command(cmd);
            this.command_set.add(cmd.command);
            const key = cmd.extras.permission;
            if (key && key != "@everyone") {
                create_permission(key);
            }
        }
    }

    for (const path of await recursive(res("./events"))) {
        const { module, event } = await import(path);
        if (module && !include.has(module)) continue;
        for (const e of [event].flat()) this.on(e.event, e.run);
    }
};

client.ws.on("INTERACTION_CREATE", (interaction) => {
    if (resolvers.has(interaction.data.custom_id)) {
        interaction.respond = (data, raw) =>
            client.api
                .interactions(interaction.id)
                [interaction.token].callback.post(
                    raw ? data : { data: { type: 4, data } }
                );
        resolvers.get(interaction.data.custom_id)(interaction);
    }
});
