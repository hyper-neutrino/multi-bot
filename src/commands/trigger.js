import { Command } from "paimon.js";
import {
    create_trigger,
    get_trigger,
    get_triggers,
    rm_trigger,
} from "../lib/triggers.js";

export const command = [
    new Command({
        name: "trigger add",
        description: "Add an autoresponder trigger.",
        options: [
            "s:match the string to match",
            [
                "s:type the response type",
                ["Normal Text Message", "normal"],
                ["JSON Message", "json"],
                ["Emoji Reaction", "reaction"],
            ],
            "s:response the response to send",
            "b:wildcard* set to true to allow the match to appear as a substring",
            "b:case-sensitive* set to true to require the match to be the same case",
            "b:regex* set to true to treat the match as a regular expression",
            [
                "s:response-type* how to respond (only applicable to message responses)",
                ["Normal Message (no reply)", "normal"],
                ["Reply without ping", "reply"],
                ["Reply with ping", "ping"],
            ],
            "b:local* set to true to only work in this channel",
        ],
        async execute(
            cmd,
            match,
            type,
            response,
            wildcard,
            case_sensitive,
            regex,
            response_type,
            local
        ) {
            if (await get_trigger(match)) {
                return "This match string is already in use.";
            }

            if (type == "json") {
                try {
                    response = JSON.parse(response);
                } catch {
                    return "Invalid JSON.";
                }
            }

            wildcard ??= false;
            case_sensitive ??= false;
            regex ??= false;
            response_type ??= "normal";

            await create_trigger({
                match,
                type,
                response,
                wildcard,
                case_sensitive,
                regex,
                response_type,
                ...(local ? { channel_id: cmd.channel.id } : {}),
            });

            return [
                `Created trigger matching \`${match}\`.`,
                `+ trigger: \`${match}\``,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "trigger remove",
        description: "Delete an autoresponder trigger.",
        options: ["s:match! the match string"],

        async execute(_, match) {
            if (!(await get_trigger(match))) {
                return "There is no trigger with that match string.";
            }

            await rm_trigger(match);

            return [
                `Delete trigger matching \`${match}\`.`,
                `- trigger: \`${match}\``,
            ];
        },

        async autocomplete(_, query) {
            return (await get_triggers())
                .map((entry) => entry.match)
                .filter((match) => match.indexOf(query) != -1)
                .sort();
        },

        permission: "setting",
    }),
];
