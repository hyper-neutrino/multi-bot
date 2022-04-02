import { Command } from "paimon.js";
import {
    actions,
    add_automod_ignore,
    add_automod_term,
    automod_scan,
    get_automod_term,
    get_automod_terms,
    list_automod_ignore,
    rm_automod_ignore,
    rm_automod_term,
    set_automod_action,
} from "../lib/automod.js";
import { expand } from "../lib/format.js";
import { stem } from "../lib/natural.js";
import { pagify } from "../lib/pages.js";
import { get_setting } from "../lib/settings.js";
import { group } from "../lib/utils.js";

const types = ["word", "substring", "boundary"];
const type = ["s:type the type of match"].concat(types);

const action = ["s:action the action to take on match"].concat(actions);

const hidden = "b:hidden* set to true to hide the response";

export default [
    new Command({
        name: "automod add",
        description: "Add a term to the automoderator's scan list.",
        options: [type, "s:term the term to match", action, hidden],
        async execute(cmd, type, term, action, hidden) {
            let match;
            try {
                match = translate(type, term);
            } catch (error) {
                return error;
            }

            if (await get_automod_term(type, match)) {
                return `\`${type}\` type match for \`${match}\` already exists.`;
            }

            await add_automod_term(type, match, action);

            await cmd.reply({
                embeds: [
                    {
                        title: "Added automod entry",
                        description: `Added \`${type}\` match with action \`${action}\`: ${show_info(
                            match,
                            term
                        )}.`,
                        color: "GREEN",
                    },
                ],
                ephemeral: hidden,
            });

            return [
                undefined,
                `+ automod; type: \`${type}\`; action: \`${action}\`; match: \`${match}\``,
            ];
        },
        permission: "automod",
    }),

    new Command({
        name: "automod remove",
        description: "Remove a term from the automoderator's scan list.",
        options: [type, "s:term! the term to remove", hidden],
        async execute(cmd, type, term, hidden) {
            let match;
            try {
                match = translate(type, term);
            } catch (error) {
                return error;
            }

            if (!(await get_automod_term(type, match))) {
                return `\`${type}\` type match for \`${match}\` does not exist.`;
            }

            await rm_automod_term(type, match);

            await cmd.reply({
                embeds: [
                    {
                        title: "Removed automod entry",
                        description: `Removed \`${type}\` match for ${show_info(
                            match,
                            term
                        )}.`,
                        color: "GREEN",
                    },
                ],
                ephemeral: hidden,
            });

            return [
                undefined,
                `- automod; type: \`${type}\`; match: \`${match}\``,
            ];
        },
        autocomplete,
        permission: "automod",
    }),

    new Command({
        name: "automod edit",
        description: "Edit the action for an automoderator entry.",
        options: [type, "s:term! the term to edit", action, hidden],
        async execute(cmd, type, term, action, hidden) {
            let match;
            try {
                match = translate(type, term);
            } catch (error) {
                return error;
            }

            if (!(await get_automod_term(type, match))) {
                return `\`${type}\` type match for \`${match}\` does not exist.`;
            }

            await set_automod_action(type, match, action);

            await cmd.reply({
                embeds: [
                    {
                        title: "Updated automod entry",
                        description: `Updated \`${type}\` match for ${show_info(
                            match,
                            term
                        )}: set action to \`${action}\`.`,
                        color: "GREEN",
                    },
                ],
                ephemeral: hidden,
            });

            return [
                undefined,
                `* automod; type: \`${type}\`; match: \`${match}\`; action → \`${action}\``,
            ];
        },
        autocomplete,
        permission: "automod",
    }),

    new Command({
        name: "automod list",
        description: "List the automoderator configuration.",
        options: [
            ["s:type* the type to list (default all)"].concat(types),
            ["s:action* the action to list (default all)"].concat(actions),
        ],
        async execute(cmd, type, action) {
            const options = {};
            if (type) options.type = type;
            if (action) options.action = action;
            const terms = await get_automod_terms(options);
            const strings = terms.map(
                ({ type, match, action }) =>
                    `\`${type}:${action}\`\n\`\`\`\n${match}\n\`\`\``
            );

            const color = await get_setting("embed-color");

            const messages = [];

            while (strings.length > 0) {
                const block = strings.splice(0, 8);
                messages.push({
                    embeds: [
                        {
                            title: "Automod List",
                            color,
                            fields:
                                block.length == 1
                                    ? [
                                          {
                                              name: "_ _",
                                              value: block[0],
                                          },
                                      ]
                                    : [0, 1]
                                          .map((k) => ({
                                              name: "_ _",
                                              value: block
                                                  .filter(
                                                      (_, index) =>
                                                          index % 2 == k
                                                  )
                                                  .join("\n"),
                                              inline: true,
                                          }))
                                          .flat(),
                        },
                    ],
                });
            }

            await pagify(cmd, messages, true);
        },
    }),

    new Command({
        name: "automod scan",
        description: "Test the automoderator on some content (enter in modal).",
        options: [
            "s:content the text to scan",
            "b:show* set to true to show the response publicly",
        ],
        async execute(cmd, content, show) {
            const { result, matches } = await automod_scan(content);

            await cmd.reply({
                embeds: [
                    {
                        title: `Automod scan: ${result ?? "no action taken"}`,
                        description: `(click on the command invocation to view the content)\n\n${[
                            ...matches,
                        ]
                            .map((match) => `- \`${match}\``)
                            .join("\n")}`,
                        color: await get_setting("embed-color"),
                    },
                ],
                ephemeral: !show,
            });
        },
        permission: "automod-bypass",
    }),

    new Command({
        name: "automod ignore add",
        description:
            "Add a category, channel, or thread to be ignored by the automoderator.",
        options: ["c:channel the channel to ignore"],
        async execute(_, channel) {
            await add_automod_ignore(channel.id);
            return [
                `Messages in ${channel} will be ignored by the automoderator.`,
                `+ automod-ignore; ${expand(channel)}`,
            ];
        },
        permission: "automod",
    }),

    new Command({
        name: "automod ignore remove",
        description:
            "Set a category, channel, or thread to be watched by the automoderator.",
        options: ["c:channel the channel to unignore"],
        async execute(_, channel) {
            await rm_automod_ignore(channel.id);
            return [
                `Messages in ${channel} will now be scanned by the automoderator.`,
                `- automod-ignore; ${expand(channel)}`,
            ];
        },
        permission: "automod",
    }),

    new Command({
        name: "automod ignore list",
        description: "Show all of the automoderator's ignored channels.",
        options: [],
        async execute(_) {
            return `Automod ignores: ${
                (await list_automod_ignore())
                    .map((entry) => `<#${entry.channel_id}>`)
                    .join(", ") || "(none)"
            }`;
        },
        permission: "automod",
    }),
];

function translate(type, term) {
    term = term.toLowerCase();
    if (type == "word") {
        const tokens = stem(term);
        if (tokens.length != 1) {
            throw "Please enter exactly one word.";
        }
        return tokens[0];
    }
    return term;
}

async function autocomplete(cmd, query) {
    const type = cmd.options.getString("type");
    if (!type) {
        return ["select the type first to get a list of entries..."];
    }
    return (await get_automod_terms({ type }))
        .map((entry) => entry.match)
        .filter((item) => item.match(query));
}

function show_info(match, term) {
    return match == term ? `\`${term}\`` : `\`${term}\` as \`${match}\``;
}
