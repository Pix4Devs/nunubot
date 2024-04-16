import {
    ActivityType, Client, Collection, REST,
    Routes, Events, ChatInputCommandInteraction,
    CommandInteraction, GatewayIntentBits
} from 'discord.js';
import YAML from 'yaml'
import fs from 'node:fs'
import path from 'node:path'
import { YamlConfig } from './@types/config';
import {
    joinVoiceChannel, getVoiceConnection, createAudioPlayer,
    generateDependencyReport, createAudioResource, entersState,
    AudioPlayerStatus, VoiceConnectionStatus,
    VoiceConnection
} from "@discordjs/voice"
import cluster from "node:cluster"
const numCPUs = require('node:os').availableParallelism();

if (cluster.isPrimary) {
    console.log(generateDependencyReport())
    console.log(`Primary ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    console.log(`[worker-${process.pid}] started`)
    const CONFIG: YamlConfig = YAML.parse(fs.readFileSync(path.join(
        __dirname, "../",
        "config.yaml"
    )).toString())

    const client = new Client({
        intents: [
            3276799, GatewayIntentBits.GuildVoiceStates
        ]
    });


    const RUNTIME = CONFIG.environment.runtime
    client.commands = new Collection()
    client.config = CONFIG

    let cmds = fs.readdirSync(path.join(__dirname, "cmds"))

    for (let i = 0; i < cmds.length; i++) {
        let path_ = path.join(__dirname, "cmds", cmds[i])
        let stat = fs.statSync(path.join(path_))

        if (stat.isDirectory()) {
            // deep link after this dir is not supported
            let files = fs.readdirSync(
                path.join(path_)
            )
            for (let x = 0; x < files.length; x++) {
                stat = fs.statSync(path.join(path_, files[x]))
                if (stat.isFile() && files[x].includes(`.${RUNTIME}`)) {
                    let cmd = require(
                        path.join(path_, files[x])
                    )
                    client.commands.set(cmds[i].replace(`.${RUNTIME}`, ""), cmd)
                }
            }
            continue
        }

        if (stat.isFile() && cmds[i].includes(`.${RUNTIME}`)) {
            let cmd = require(
                path.join(path_)
            )
            client.commands.set(cmds[i].replace(`.${RUNTIME}`, ""), cmd)
        }
    }

    const rest = new REST().setToken(CONFIG.bot.token);
    const payload = client.commands.map((v, k, coll) => (v as any).data.toJSON());


    (async () => {
        const data = await rest.put(
            Routes.applicationCommands(CONFIG.bot.id),
            {
                body: payload
            }
        ).catch((err) => {
            console.error(err);
            process.exit(-1)
        })
    })();


    client.on(Events.ClientReady, async () => {
        if (client.user !== null)
            client.user?.setPresence({
                status: "dnd",
                activities: [{
                    name: "Employee of Pix4",
                    url: "https://pix4.dev",
                    type: ActivityType.Competing
                }]
            })
    });


    var PLAYER = createAudioPlayer()

    PLAYER.on(AudioPlayerStatus.Idle, (oldState, newState) => {
        let conn = getVoiceConnection(client.config.bot.guildId)
        if (typeof conn !== "undefined")
            conn.destroy()
    })

    client.on(Events.VoiceStateUpdate, (oldState, newState) => {
        if (newState.guild.id === client.config.bot.guildId
            && !newState.member?.user.bot && !oldState.mute && !newState.mute) {
            let conn = getVoiceConnection(newState.guild.id)
            if (typeof conn !== "undefined")
                conn.destroy()

            conn = joinVoiceChannel({
                channelId: newState.channelId as string,
                guildId: newState.guild.id,
                adapterCreator: newState.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            }) as VoiceConnection

            conn.on(VoiceConnectionStatus.Disconnected, (oldState_, newState_) => {
                console.log("rejoin")
                if (!conn.rejoin())
                    conn.destroy()
            })
            conn.receiver.speaking.once("start", (uid) => {
                var AUDIO_FEED = createAudioResource(
                    path.join(__dirname, "../", "feed", client.config.bot.mp3File)
                );

                conn.subscribe(PLAYER)
                PLAYER.play(AUDIO_FEED)

                entersState(PLAYER, AudioPlayerStatus.Playing, 1000 * 300)
                setTimeout(() => {
                    // garbage collector
                    AUDIO_FEED = null as any
                    conn.disconnect()
                }, 1000 * 300)
            })
        }
    })

    client.on(Events.InteractionCreate, async (interaction) => {
        try {
            switch (true) {
                case interaction.isChatInputCommand():
                    interaction = interaction as ChatInputCommandInteraction

                    let cmd = client.commands.get(interaction.commandName) as {
                        data: any,
                        execute: (arg0: CommandInteraction) => any
                    }
                    cmd.execute(interaction)
                    return
                case interaction.isMessageComponent():
                    let uid = interaction.message.components[0]?.components[0]?.customId

                    if (uid === null) {
                        await interaction.reply({ ephemeral: true, content: "❌ Cannot retrieve UID of the member that invoked the avatar command" })
                        return
                    }


                    let invoker = interaction.message.components[0]?.components[0]?.customId
                    if (invoker === null)
                        throw new Error("Failed acquiring information about command invoker.")

                    if (!(interaction.user.id === invoker))
                        throw new Error(`Only the invoker(<@${invoker}>) of the command is allowed to perform delete action`)

                    await interaction.message.delete()
                    await interaction.reply({
                        ephemeral: true,
                        content: "🫡 Successfully deleted the bot's ``COMMAND OUTPUT``"
                    })
            }
        } catch (err) {
            if (interaction.isRepliable()) {
                await interaction.reply({ ephemeral: true, content: `🫡 OOPS, something went wrong...\n\n\`\`\`${err}\`\`\`` })
            }
            console.log(err)
        }
    })

    client.login(CONFIG.bot.token);
}
