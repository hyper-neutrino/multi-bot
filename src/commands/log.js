import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import { set_setting } from "../lib/settings.js";

export default [
    new Command({
        name: "log set",
        description: "Set the logging channel.",
        options: [
            [
                "s:key the log type to set",
                ["Command Audit Logs", "command"],
                ["Message Logs", "message"],
            ],
            "c:channel:text the channel to set",
        ],
        async execute(_, key, channel) {
            await set_setting(`logs.${key}`, channel.id);
            return [
                `Set log channel \`${key}\` to ${channel}.`,
                `= log channel \`${key}\` → ${expand(channel)}`,
            ];
        },
        permission: "setting",
    }),
];
