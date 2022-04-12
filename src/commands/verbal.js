import { Command } from "paimon.js";
import { do_warn } from "../moderation/warn.js";

export const module = "moderation";

export const command = new Command({
    name: "verbal",
    description: "Verbally warn a user (is not logged, just DMs them).",
    options: ["u:user the user to warn", "s:reason the reason to include"],
    execute: do_warn(false),
    permission: "warn",
});
