import { Command } from "paimon.js";
import { next_id } from "../lib/dbutils.js";
import { parse_duration, timestamp } from "../lib/format.js";
import { pagify } from "../lib/pages.js";
import {
    get_scheduled_task,
    get_scheduled_tasks,
    schedule,
    unschedule,
} from "../lib/scheduler.js";
import { get_setting } from "../lib/settings.js";

export const module = "reminders";

export const command = [
    new Command({
        name: "reminder set",
        description: "Set a reminder.",
        options: [
            "s:duration how long to wait",
            "s:query* what to remind you about",
        ],
        async execute(cmd, duration, query) {
            duration = parse_duration(duration);
            query ??= "";

            if (duration == 0) {
                return "Please enter a non-zero finite amount of time.";
            }

            const date = new Date();
            date.setMilliseconds(date.getMilliseconds() + duration);

            const id = await next_id("reminders");

            const message = await cmd.reply({
                embeds: [
                    {
                        title: `Reminder Set (#${id})`,
                        description: `I will remind you on ${timestamp(date)}${
                            query ? `: ${query}` : "."
                        }`,
                        color: await get_setting("embed-color"),
                    },
                ],
                fetchReply: true,
            });

            await schedule(
                "remind",
                { id, user_id: cmd.user.id, query, origin: message.url },
                duration
            );
        },
        permission: "@everyone",
    }),

    new Command({
        name: "reminder cancel",
        description: "Remove a reminder.",
        options: ["i:id:1- the ID of the reminder to delete"],
        async execute(cmd, id) {
            const task = await get_scheduled_task("remind", { id });

            if (!task) return "That reminder does not exist.";

            if (task.time < new Date()) {
                return "That reminder has already passed.";
            }

            if (task.user_id != cmd.user.id) {
                return "You cannot delete other people's reminders.";
            }

            await unschedule("remind", { id });

            return `Reminder #${id} has been canceled.`;
        },
        permission: "@everyone",
    }),

    new Command({
        name: "reminder list",
        description: "List your reminders.",
        options: [],
        async execute(cmd) {
            const tasks = await get_scheduled_tasks("remind", {
                user_id: cmd.user.id,
            });

            if (tasks.length == 0) return "You do not have any reminders.";

            const messages = [];

            const color = await get_setting("embed-color");

            while (tasks.length > 0) {
                messages.push({
                    embeds: [
                        {
                            title: "Reminders",
                            color,
                            fields: tasks.splice(0, 5).map((task) => ({
                                name: `Reminder #${task.id}`,
                                value: `${timestamp(task.time)}${
                                    task.query && `: ${task.query}`
                                }`,
                            })),
                        },
                    ],
                });
            }

            await pagify(cmd, messages, true);
        },
        permission: "@everyone",
    }),
];
