import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import {
    get_setting,
    get_setting_channel,
    get_setting_role,
    set_setting,
} from "../lib/settings.js";

export const module = "co-op";

export const command = [
    new Command({
        name: "co-op",
        description: "Ask for co-op help. Region/WL are optional with roles.",
        options: [
            "s:request what you need help with",
            ["s:region* your region", "EU", "NA", "AS", "TW/HK/MO"],
            "i:world-level*:0-8 your world level",
        ],
        async execute(cmd, request, region, world_level) {
            if (cmd.channel.id != (await get_setting("co-op-channel"))) {
                return "This command can only be used in the co-op channel.";
            }

            const stop = check_cooldown(cmd.user);
            if (stop) return stop;

            const role_channel = await get_setting_channel("roles-channel");

            if (region === null) {
                for (const rc of ["EU", "NA", "AS", "TW/HK/MO"]) {
                    const role = await get_setting_role(`region.${rc}`);
                    if (role && (await cmd.member.roles.cache.has(role.id))) {
                        if (region) {
                            return `You have multiple region roles. Please define your region in the command options.`;
                        }

                        region = rc;
                    }
                }
            }

            if (region === null) {
                return `You have no region roles. Please pick one up in ${role_channel} or define your region in the command options.`;
            }

            if (world_level === null) {
                for (let wl = 8; wl >= 0; --wl) {
                    const role = await get_setting_role(`wl.${wl}`);
                    if (role && cmd.member.roles.cache.has(role.id)) {
                        world_level = wl;
                        break;
                    }
                }
            }

            if (world_level === null) {
                return `You have no world level role. Please pick one up in ${role_channel} or define your world level in the command options.`;
            }

            const helper = await get_setting_role(`helper.${region}`);

            await cmd.channel.send({
                content: helper && helper.toString(),
                embeds: [
                    {
                        title: `Co-op Request - WL${world_level} - ${region}`,
                        description: `${cmd.user} is requesting help with:\n\n${request}`,
                        color: await get_setting("embed-color"),
                    },
                ],
                allowedMentions: { parse: ["roles"] },
            });

            await cmd.reply({ content: "Posted!", ephemeral: true });

            set_cooldown(cmd.user);
        },
        permission: "@everyone",
    }),

    new Command({
        name: "co-op-settings world-level-roles",
        description: "Set the world level roles.",
        options: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(
            (wl) => `r:wl${wl} role for WL${wl}`
        ),
        async execute(_, ...roles) {
            for (let wl = 0; wl <= 8; ++wl) {
                await set_setting(`wl.${wl}`, roles[wl].id);
            }

            return [
                `Set the world level roles to ${roles
                    .map((role) => role.toString())
                    .join(", ")}`,
                `= WL roles: ${roles.map((role) => expand(role)).join(", ")}`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "co-op-settings region-roles",
        description: "Set the region and helper roles.",
        options: ["EU", "NA", "AS", "TW/HK/MO"]
            .map((region) =>
                ["region", "helper"].map(
                    (type) =>
                        `r:${type}-${region
                            .toLowerCase()
                            .replaceAll("/", "-")} ${type} role for ${region}`
                )
            )
            .flat(),
        async execute(_, ...roles) {
            let index = 0;

            for (const region of ["EU", "NA", "AS", "TW/HK/MO"]) {
                for (const type of ["region", "helper"]) {
                    await set_setting(`${type}.${region}`, roles[index++].id);
                }
            }

            return [
                `Set the region roles to ${roles
                    .map((role) => role.toString())
                    .join(", ")}`,
                `= region roles (EU, NA, AS, TW/HK/MO) (region, helper): ${roles
                    .map((role) => expand(role))
                    .join(", ")}`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "co-op-settings role-channel",
        description:
            "Set the roles channel (for co-op help messages if a user is missing roles).",
        options: ["c:channel the roles channel"],
        async execute(_, channel) {
            await set_setting("roles-channel", channel.id);

            return [
                `Set the roles channel to ${channel}`,
                `= roles channel: ${expand(channel)}`,
            ];
        },
    }),

    new Command({
        name: "co-op-settings co-op-channel",
        description:
            "Set the co-op channel (/co-op only allowed in this channel)",
        options: ["c:channel the co-op channel"],
        async execute(_, channel) {
            await set_setting("co-op-channel", channel.id);

            return [
                `Set the co-op channel to ${channel}`,
                `= co-op channel: ${expand(channel)}`,
            ];
        },
    }),
];

const cooldown = new Map();

function check_cooldown(user) {
    if (cooldown.has(user.id) && new Date() - cooldown.get(user.id) < 108000) {
        return "Please wait 30 minutes between uses of this command.";
    }
}

function set_cooldown(user) {
    cooldown.set(user.id, new Date());
}
