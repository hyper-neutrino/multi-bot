import client from "../client.js";
import db from "../db.js";
import { rm_autorole } from "./autoroles.js";
import { get_setting } from "./settings.js";

await db.init("schedule");

export async function schedule(key, data, duration) {
    const time = new Date();
    time.setMilliseconds(time.getMilliseconds() + duration);
    await db.schedule.insertOne({ key, ...data, time });
}

export async function get_scheduled_task(key, data) {
    return await db.schedule.findOne({ key, ...data });
}

export async function get_scheduled_tasks(key, data) {
    return await db.schedule.find({ key, ...data }).toArray();
}

export async function unschedule(key, data) {
    await db.schedule.deleteMany({ key, ...data });
}

async function run(key, data) {
    if (key == "unmute") {
        const mute_id = await get_setting("mute");
        try {
            const member = await client.home.members.fetch(data.user_id);
            await member.roles.remove(mute_id, "mute expired");
        } catch {
            await rm_autorole(data.user_id, mute_id);
        }
    } else if (key == "unban") {
        try {
            await client.home.bans.remove(data.user_id, "ban expired");
        } catch {}
    } else if (key == "remind") {
        try {
            const user = await client.users.fetch(data.user_id);

            await user.send({
                embeds: [
                    {
                        title: `Reminder #${data.id}`,
                        description: `You asked me [here](${
                            data.origin
                        }) to remind you${data.query && `: ${data.query}`}`,
                        color: await get_setting("embed-color"),
                    },
                ],
            });

            await unschedule("remind", { id: data.id });
        } catch {}
    }
}

export function start() {
    setInterval(async () => {
        try {
            for (const entry of await db.schedule
                .find({
                    time: { $lt: new Date() },
                })
                .toArray()) {
                const { _id, key, time, ...data } = entry;
                await run(key, data);
                await db.schedule.deleteOne({ _id });
            }
        } catch {}
    }, 10000);
}
