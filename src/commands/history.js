import { Command, UserCommand } from "paimon.js";
import db from "../db.js";
import show_history from "../moderation/show_history.js";

export const module = "moderation";

export const command = [
    new Command({
        name: "history get",
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

    new Command({
        name: "history delete",
        description: "Delete a single punishment from the records.",
        options: ["i:id:1- the ID of the record to remove"],
        async execute(_, id) {
            await db.history.findOneAndDelete({ id });
            return "Deleted.";
        },
        permission: "history-admin",
    }),

    new Command({
        name: "history clear",
        description: "Clear a user's history.",
        options: ["u:user the user to clear"],
        async execute(_, user) {
            await db.history.deleteMany({ user_id: user.id });
            return "Cleared.";
        },
        permission: "history-admin",
    }),

    new Command({
        name: "history edit",
        description: "Edit a user history record's reason.",
        options: [
            "i:id:1- the ID of the record to update",
            "s:reason the new reason",
        ],
        async execute(_, id, reason) {
            await db.history.findOneAndUpdate({ id }, { $set: { reason } });
            return "Edited.";
        },
        permission: "history-admin",
    }),
];
