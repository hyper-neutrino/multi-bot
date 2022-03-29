import { Command, UserCommand } from "paimon.js";
import show_history from "../moderation/show_history.js";

export default [
    new Command({
        name: "history",
        description: "Get a user's history.",
        options: [
            "u:user the user to view",
            [
                "s:filter* which type of punishment to view (default: all)",
                "warn",
                "mute",
                "kick",
                "ban",
            ],
        ],
        execute: show_history,
        permission: "history",
    }),

    new UserCommand({
        name: "User History",
        execute: async (cmd, user) =>
            await show_history(cmd, user, undefined, true),
        permission: "history",
    }),
];
