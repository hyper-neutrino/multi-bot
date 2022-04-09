import { Util } from "discord.js";
import { Command } from "paimon.js";
import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
    StreamType,
    VoiceConnectionDisconnectReason,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import ytdl from "ytdl-core";
import yts from "yt-search";
import ytpl from "ytpl";
import client from "../client.js";
import { shuffle } from "../lib/utils.js";
import { pagify } from "../lib/pages.js";
import { get_setting } from "../lib/settings.js";

export const module = "music";

export const command = [
    new Command({
        name: "music play",
        description:
            "Play a song from YouTube (plays the first match if not a URL).",
        options: ["s:query video URL or search query"],
        async execute(cmd, query) {
            await play(cmd, query, false);
        },
    }),

    new Command({
        name: "music playlist",
        description: "Play a playlist.",
        options: [
            "s:url the playlist URL",
            "b:shuffle* whether or not to insert the playlist in shuffled order",
        ],
        async execute(cmd, url, do_shuffle) {
            await connect(cmd);

            let list;
            try {
                list = await ytpl(url);
            } catch {
                throw "Error fetching playlist; please make sure it exists and is not private.";
            }

            const message = await cmd.reply({
                embeds: [
                    {
                        title: "Queueing Playlist...",
                        description: `Attempting to queue ${
                            list.items.length
                        } songs.${
                            list.estimatedItemCount > 100
                                ? " Your playlist had over 100 items, so only the first 100 will be attempted due to dependency restrictions."
                                : ""
                        }`,
                        color: "AQUA",
                    },
                ],
                fetchReply: true,
            });

            let success = 0;
            for (const item of do_shuffle ? shuffle(list.items) : list.items) {
                try {
                    await play(cmd, item.shortUrl, false, true);
                    ++success;
                } catch (error) {
                    console.error(error);
                }
            }

            await message.edit({
                embeds: [
                    {
                        title: "Playlist Queued",
                        description: `Queued ${success} songs.`,
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "music search",
        description: "Play a song (show up to 5 options from a search query).",
        options: ["s:query search query"],
        async execute(cmd, query) {
            await play(cmd, query, true);
        },
    }),

    new Command({
        name: "music pause",
        description: "Pause the music player.",
        options: [],
        async execute(cmd) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);
            if (server.paused) return "The player is already paused.";

            server.paused = true;

            try {
                server.player.pause(true);
                await cmd.reply({
                    embeds: [
                        {
                            title: "Paused.",
                            color: "GREEN",
                        },
                    ],
                });
            } catch {
                return "Unexpected error trying to pause.";
            }
        },
    }),

    new Command({
        name: "music unpause",
        description: "Resume the music player.",
        options: [],
        async execute(cmd) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);
            if (!server.paused) return "The player is not paused right now.";

            server.paused = false;

            try {
                server.player.unpause();
                await cmd.reply({
                    embeds: [
                        {
                            title: "Resumed.",
                            color: "GREEN",
                        },
                    ],
                });
            } catch {
                return "Unexpected error trying to unpause.";
            }
        },
    }),

    new Command({
        name: "music skip",
        description: "Skip the next song / N songs.",
        options: ["i:count*:1- number of songs to skip"],
        async execute(cmd, count) {
            count ??= 1;

            await connect(cmd, true);

            const server = get_server(cmd.guild.id);
            server.index = Math.max(
                0,
                Math.min(server.index, server.queue.length)
            );

            if (server.index >= server.queue.length) {
                return "I am already at the end of the queue.";
            }

            count = Math.min(count, server.queue.length - server.index);
            server.index += count;
            check_queue(cmd, true);

            await cmd.reply({
                embeds: [
                    {
                        title: "Skipped",
                        description:
                            count == 1
                                ? "Skipped the current song."
                                : `Skipped ${count} songs.`,
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "music backtrack",
        description: "Go back to the last song / by N songs.",
        options: ["i:count*:1- number of songs to backtrack"],
        async execute(cmd, count) {
            count ??= 1;

            await connect(cmd, true);

            const server = get_server(cmd.guild.id);
            server.index = Math.max(
                0,
                Math.min(server.index, server.queue.length)
            );

            if (server.index <= 0) {
                return "I am already at the front of the queue.";
            }

            count = Math.min(count, server.index);
            server.index -= count;
            check_queue(cmd, true);

            await cmd.reply({
                embeds: [
                    {
                        title: "Backtracked",
                        description:
                            count == 1
                                ? "Backtracked to the last song."
                                : `Backtracked ${count} songs.`,
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "music restart song",
        description: "Restart the current song.",
        options: [],
        async execute(cmd) {
            await connect(cmd, true);
            check_queue(cmd, true);

            await cmd.reply({
                embeds: [
                    {
                        title: "Restarted",
                        description: "Restarted the current song.",
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "music restart player",
        description: "Restart the player from the very beginning.",
        options: [],
        async execute(cmd) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);
            server.index = 0;
            check_queue(cmd, true);

            await cmd.reply({
                embeds: [
                    {
                        title: "Restarted",
                        description:
                            "Restarted the player from the first song.",
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "music nowplaying",
        description: "See what's currently playing.",
        options: [],
        async execute(cmd) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);

            if (server.queue.length == 0) {
                await cmd.reply({
                    embeds: [
                        {
                            title: "Queue Empty",
                            description:
                                "The queue is currently empty. `/music play` your favorite songs to get things started.",
                            color: "AQUA",
                        },
                    ],
                });
            } else if (
                server.index >= server.queue.length ||
                server.index < 0
            ) {
                await cmd.reply({
                    embeds: [
                        {
                            title: "End of Queue",
                            description:
                                "I have reached the end of the queue. `/music restart player` to return to the start or `/music play` a new song.",
                            color: "PURPLE",
                        },
                    ],
                });
            } else {
                const item = server.queue[server.index];
                const embed = embed_for(item);

                embed.title = server.paused ? "Paused" : "Now Playing";
                embed.description = hyperlink(item);

                await cmd.reply({ embeds: [embed] });
            }
        },
    }),

    new Command({
        name: "music stop",
        description:
            "Stop the music player, moving to the end of the queue but not discarding the song history.",
        options: [],
        async execute(cmd) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);
            server.index = server.queue.length;
            server.repeat = server.loop = server.radio = false;
            check_queue(cmd);

            await cmd.reply({
                embeds: [
                    {
                        title: "Stopped.",
                        color: "RED",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "music disconnect",
        description:
            "Disconnect the music player, also discarding the song history and queue.",
        options: [],
        async execute(cmd) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);

            try {
                server.connection.destroy();
            } finally {
                delete servers[cmd.guild.id];
                await cmd.reply({
                    embeds: [
                        {
                            title: "Disconnected.",
                            color: "PURPLE",
                        },
                    ],
                });
            }
        },
    }),

    new Command({
        name: "music queue",
        description: "Check the current song queue.",
        options: [],
        async execute(cmd) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);

            if (server.index >= server.queue.length - 1) {
                return "The queue is currently empty.";
            }

            await show(cmd, "Queue", server.queue.slice(server.index + 1), 1);
        },
    }),

    new Command({
        name: "music history",
        description: "Check the song history.",
        options: [],
        async execute(cmd) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);

            if (server.index == 0 || server.queue.length == 0) {
                return "This is the beginning of the queue, or the song list is empty.";
            }

            await show(
                cmd,
                "History",
                server.queue.slice(0, server.index).reverse(),
                -1
            );
        },
    }),

    new Command({
        name: "music repeat song",
        description: "Repeat the current song.",
        options: [
            "i:repeat*:0- number of times to repeat (0 to cancel) (default infinite)",
        ],
        async execute(cmd, repeat) {
            repeat ??= -1;

            await connect(cmd, true);
            const server = get_server(cmd.guild.id);

            server.repeat = repeat;

            await cmd.reply({
                embeds: [
                    {
                        title: `Repeat ${repeat == 0 ? "Off" : "On"}`,
                        description:
                            "When this song ends, it will play again instead of moving to the next song.",
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "music repeat player",
        description:
            "Repeat the player, going back to the very beginning when songs run out.",
        options: [
            "i:repeat*:0- number of times to repeat (0 to cancel) (default infinite)",
        ],
        async execute(cmd, repeat) {
            repeat ??= -1;

            await connect(cmd, true);
            const server = get_server(cmd.guild.id);

            server.loop = repeat;

            await cmd.reply({
                embeds: [
                    {
                        title: `Loop ${repeat == 0 ? "Off" : "On"}`,
                        description:
                            "When the queue ends, it will be restarted instead of stopping.",
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "music radio",
        description:
            "Set the player to autoplay (via YouTube similar videos) when it runs out of songs.",
        options: ["b:on whether or not to enable radio mode"],
        async execute(cmd, radio) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);

            server.radio = radio;

            await cmd.reply({
                embeds: [
                    {
                        title: `Radio ${radio ? "On" : "Off"}`,
                        description: radio
                            ? "Radio mode is now on. When the queue ends, the first related song that is not in the queue will be automatically played."
                            : "Radio mode is now off.",
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "music remove",
        description: "Remove a song.",
        options: [
            "i:index index of the song (negative for past songs, 0 for the current song)",
        ],
        async execute(cmd, index) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);

            index += server.index;

            if (index < 0 || index >= server.queue.length) {
                return "That index is out of range.";
            }

            const removed = server.queue.splice(index, 1)[0];

            if (index < server.index) {
                --server.index;
                --server.playing;
            } else if (index == server.index) {
                check_queue(cmd, true);
            }

            await cmd.reply({
                embeds: [
                    {
                        title: "Song Removed",
                        description: `${hyperlink(removed)} was just removed.`,
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "music shuffle",
        description: "Shuffle the queue (only shuffles upcoming songs).",
        options: [],
        async execute(cmd) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);

            const items = server.queue.splice(
                server.index + 1,
                server.queue.length - server.index - 1
            );

            server.queue.splice(server.queue.length, 0, ...shuffle(items));

            await cmd.reply({
                embeds: [
                    {
                        title: "Shuffled",
                        description: `${items.length} song${
                            items.length == 1 ? " was" : "s were"
                        } shuffled.`,
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "music shuffle-all",
        description:
            "Shuffle all songs, including the history and current song.",
        options: [],
        async execute(cmd) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);

            const id = server.queue[server.index].videoId;
            shuffle(server.queue);

            if (server.queue[server.index].videoId != id) {
                check_queue(cmd, true);
            }

            await cmd.reply({
                embeds: [
                    {
                        title: "Shuffled All",
                        description: `${server.queue.length} song${
                            server.queue.length == 1 ? " was" : "s were"
                        } shuffled.`,
                        color: "GREEN",
                    },
                ],
            });
        },
    }),

    new Command({
        name: "music volume",
        description: "Set the music player's volume (not persistent).",
        options: ["i:volume:0-100 the volume to set"],
        async execute(cmd, volume) {
            await connect(cmd, true);
            const server = get_server(cmd.guild.id);

            if (!server.resource) return "I am not playing anything right now.";

            server.resource.volume.setVolume((server.volume = volume / 100));

            await cmd.reply({
                embeds: [
                    {
                        title: "Volume Set",
                        description: `The volume is now ${volume}%.`,
                        color: "GREEN",
                    },
                ],
            });
        },
    }),
];

const servers = new Map();

function get_server(guild_id) {
    if (!servers.has(guild_id)) servers.set(guild_id, {});
    const server = servers.get(guild_id);
    server.queue ??= [];
    server.index ??= 0;
    return server;
}

function get_player(server, song) {
    const player = createAudioPlayer();
    const stream = ytdl(song.url, {
        filter: "audioonly",
        highWaterMark: 1 << 25,
    });
    const resource = (server.resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
    }));

    if (server.volume !== undefined) resource.volume.setVolume(server.volume);
    player.play(resource);
    return entersState(player, AudioPlayerStatus.Playing, 5000);
}

async function connect(cmd, no_create) {
    if (!cmd.member.voice.channel) {
        throw "You must be in a voice channel to use this command.";
    }

    const server = get_server(cmd.guild.id);
    const my_channel = client.home.me.voice.channel;

    if (my_channel && server.connection) {
        if (my_channel.id != cmd.member.voice.channel.id) {
            throw "You must be in the same voice channel as me to use this command.";
        }

        return server.connection;
    }

    if (no_create) {
        throw "I am not currently in a voice channel or playing any music.";
    }

    try {
        server.channel = cmd.member.voice.channel;
        server.connection = joinVoiceChannel({
            channelId: server.channel.id,
            guildId: cmd.guild.id,
            adapterCreator: cmd.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: false,
        });

        const connection = server.connection;

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 30000);

            connection.on("stateChange", async (_, state) => {
                if (state.status == VoiceConnectionStatus.Disconnected) {
                    if (
                        state.reason ==
                            VoiceConnectionDisconnectReason.WebSocketClose &&
                        state.closeCode == 4014
                    ) {
                        try {
                            await entersState(
                                connection,
                                VoiceConnectionStatus.Connecting,
                                5000
                            );
                        } catch {
                            connection.destroy();
                        }
                    }
                } else if (connection.rejoinAttempts < 5) {
                    setTimeout(
                        () => connection.rejoin(),
                        (connection.rejoinAttempts + 1) * 5000
                    );
                } else {
                    connection.destroy();
                }
            });
        } catch (error) {
            console.error(error);
            connection.destroy();
            throw "Connection state was not ready within 30 seconds.";
        }
    } catch (error) {
        console.error(error);
        throw "I was unable to join your channel.";
    }
}

function ytdl_to_simple(result) {
    result.url = result.video_url;
    result.timestamp = stringify_duration(parseInt(result.lengthSeconds));

    try {
        result.image = result.thumbnails[result.thumbnails.length - 1].url;
    } catch {}

    result.author.url = result.author.channel_url;

    return result;
}

async function get_songs(query) {
    if (ytdl.validateURL(query)) {
        try {
            return [ytdl_to_simple((await ytdl.getInfo(query)).videoDetails)];
        } catch {
            throw "I could not get the video from that URL.";
        }
    } else {
        try {
            const results = (await yts.search(query)).videos;
            if (results.length == 0) throw 0;
            return results;
        } catch {
            try {
                await ytpl(query);
            } catch {
                throw "I could not find anything with that query.";
            }

            throw "I could not find anything with that query. If you meant to queue a playlist, please use `/music playlist`.";
        }
    }
}

async function play(cmd, query, prompt, nosend) {
    await connect(cmd);
    const results = await get_songs(query);

    if (results.length == 1 || !prompt) {
        if (!nosend) await cmd.deferReply();
        await queue(cmd, (x) => cmd.editReply(x), results[0], nosend);
    } else {
        const message = await cmd.reply({
            embeds: [
                {
                    title: "Search Results",
                    description: results
                        .slice(0, 5)
                        .map(
                            (item, index) =>
                                `\`${index + 1}.\` ${hyperlink(item)}`
                        )
                        .join("\n"),
                },
            ],
            components: [
                {
                    type: "ACTION_ROW",
                    components: results.slice(0, 5).map((_, index) => ({
                        type: "BUTTON",
                        style: "SECONDARY",
                        customId: `music.select.${index}`,
                        emoji: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"][index],
                    })),
                },
                {
                    type: "ACTION_ROW",
                    components: [
                        {
                            type: "BUTTON",
                            style: "DANGER",
                            customId: "music.select.cancel",
                            emoji: "❌",
                        },
                    ],
                },
            ],
            fetchReply: true,
        });

        let index, click;

        try {
            click = await message.awaitMessageComponent({
                filter: (response) => response.user.id == cmd.user.id,
                time: 600000,
            });

            const raw = click.customId.substring(13);
            if (raw == "cancel") throw 0;

            index = parseInt(raw);
        } catch {
            await message.edit({ components: [] });
            return;
        }

        await click.deferUpdate();
        await queue(cmd, (x) => click.editReply(x), results[index]);
    }
}

async function queue(cmd, send, item, nosend, requester) {
    const server = get_server(cmd.guild.id);
    item.requester = requester ?? cmd.user;
    server.queue.push(item);

    if (!nosend) {
        const embed = embed_for(item);
        embed.title = "Song Queued";
        embed.description = `${hyperlink(item)} has been added to the queue.`;
        await send({ embeds: [embed], components: [] });
    }

    check_queue(cmd);
}

function embed_for(item) {
    return {
        fields: [
            {
                name: "Creator",
                value: `[${Util.escapeMarkdown(item.author.name)}](${
                    item.author.url
                })`,
                inline: true,
            },
            {
                name: "Requested By",
                value: item.requester.toString(),
                inline: true,
            },
            {
                name: "Duration",
                value: item.timestamp,
                inline: true,
            },
        ],
        image: { url: item.image },
        color: "GREEN",
    };
}

async function end(cmd, server) {
    if (server.channel.members.size == 0) {
        try {
            (await connect(cmd, true)).destroy();
        } catch {}
    } else {
        try {
            server.player.stop();
        } catch {}
    }
}

async function check_queue(cmd, force) {
    const server = get_server(cmd.guild.id);

    if (server.index >= server.queue.length) {
        if (server.radio) {
            const related = (
                await ytdl.getInfo(server.queue[server.queue.length - 1].url)
            ).related_videos;

            while (related.length > 0) {
                if (
                    !server.queue.some((item) => item.videoId == related[0].id)
                ) {
                    break;
                }

                related.shift();
            }

            if (related.length == 0) {
                await end(cmd, server);
                await cmd.channel.send({
                    embeds: [
                        {
                            title: "Radio Mode - No Videos Found",
                            description:
                                "There are no more songs left in the queue and I could not find any related videos that were not already played. `/music play` your favorite songs to keep the music going.",
                            color: "AQUA",
                        },
                    ],
                });
            } else {
                try {
                    const id = related[0].id;
                    const item = ytdl_to_simple(
                        (await ytdl.getInfo(id)).videoDetails
                    );
                    item.requester = client.user;
                    server.queue.push(item);
                    server.index = server.queue.length - 1;
                    force = true;
                } catch {
                    await cmd.channel.send({
                        embeds: [
                            {
                                title: "Radio Mode Failed",
                                description:
                                    "An unexpected error occurred while trying to load a related song.",
                                color: "RED",
                            },
                        ],
                    });
                }
            }
        } else if (server.loop) {
            server.index = 0;
            if (server.loop > 0) --server.loop;
        } else {
            await end(cmd, server);
            return;
        }
    }

    if (!force && server.playing == server.index) return;

    const song = server.queue[server.index];
    const connection = await connect(cmd);

    server.player = await get_player(server, song);
    connection.subscribe(server.player);
    server.playing = server.index;
    server.paused = false;

    server.player.on(AudioPlayerStatus.Idle, () => {
        if (server.repeat) {
            if (server.repeat > 0) --server.repeat;
            check_queue(cmd, true);
        } else {
            if (server.index <= server.queue.length) ++server.index;
            check_queue(cmd);
        }
    });

    const embed = embed_for(song);
    embed.title = "Now Playing!";
    embed.description = hyperlink(song);

    await cmd.channel.send({ embeds: [embed] });
}

async function show(cmd, title, items, direction) {
    const messages = [];
    let index = 0;

    const color = await get_setting("embed-color");

    while (items.length > 0) {
        messages.push({
            embeds: [
                {
                    title,
                    description: items
                        .splice(0, 10)
                        .map(
                            (item) =>
                                `\`${(index += direction)}.\` ${hyperlink(
                                    item
                                )}`
                        )
                        .join("\n"),
                    color,
                },
            ],
        });
    }

    await pagify(cmd, messages);
}

function stringify_duration(seconds) {
    let result = "";

    if (seconds > 3600) {
        result += Math.floor(seconds / 3600) + ":";
        seconds %= 3600;
    }

    result += `${Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0")}:${Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0")}`;

    return result;
}

function hyperlink(item) {
    return `[${Util.escapeMarkdown(item.title)}](${item.url})`;
}
