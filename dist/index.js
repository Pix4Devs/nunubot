"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const yaml_1 = __importDefault(require("yaml"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const voice_1 = require("@discordjs/voice");
const node_cluster_1 = __importDefault(require("node:cluster"));
const numCPUs = require('node:os').availableParallelism();
if (node_cluster_1.default.isPrimary) {
    console.log((0, voice_1.generateDependencyReport)());
    console.log(`Primary ${process.pid} is running`);
    for (let i = 0; i < numCPUs; i++) {
        node_cluster_1.default.fork();
    }
    node_cluster_1.default.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
}
else {
    console.log(`[worker-${process.pid}] started`);
    const CONFIG = yaml_1.default.parse(node_fs_1.default.readFileSync(node_path_1.default.join(__dirname, "../", "config.yaml")).toString());
    const client = new discord_js_1.Client({
        intents: [
            3276799, discord_js_1.GatewayIntentBits.GuildVoiceStates
        ]
    });
    const RUNTIME = CONFIG.environment.runtime;
    client.commands = new discord_js_1.Collection();
    client.config = CONFIG;
    let cmds = node_fs_1.default.readdirSync(node_path_1.default.join(__dirname, "cmds"));
    for (let i = 0; i < cmds.length; i++) {
        let path_ = node_path_1.default.join(__dirname, "cmds", cmds[i]);
        let stat = node_fs_1.default.statSync(node_path_1.default.join(path_));
        if (stat.isDirectory()) {
            // deep link after this dir is not supported
            let files = node_fs_1.default.readdirSync(node_path_1.default.join(path_));
            for (let x = 0; x < files.length; x++) {
                stat = node_fs_1.default.statSync(node_path_1.default.join(path_, files[x]));
                if (stat.isFile() && files[x].includes(`.${RUNTIME}`)) {
                    let cmd = require(node_path_1.default.join(path_, files[x]));
                    client.commands.set(cmds[i].replace(`.${RUNTIME}`, ""), cmd);
                }
            }
            continue;
        }
        if (stat.isFile() && cmds[i].includes(`.${RUNTIME}`)) {
            let cmd = require(node_path_1.default.join(path_));
            client.commands.set(cmds[i].replace(`.${RUNTIME}`, ""), cmd);
        }
    }
    const rest = new discord_js_1.REST().setToken(CONFIG.bot.token);
    const payload = client.commands.map((v, k, coll) => v.data.toJSON());
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield rest.put(discord_js_1.Routes.applicationCommands(CONFIG.bot.id), {
            body: payload
        }).catch((err) => {
            console.error(err);
            process.exit(-1);
        });
    }))();
    client.on(discord_js_1.Events.ClientReady, () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (client.user !== null)
            (_a = client.user) === null || _a === void 0 ? void 0 : _a.setPresence({
                status: "dnd",
                activities: [{
                        name: "Employee of Pix4",
                        url: "https://pix4.dev",
                        type: discord_js_1.ActivityType.Competing
                    }]
            });
    }));
    var PLAYER = (0, voice_1.createAudioPlayer)();
    PLAYER.on(voice_1.AudioPlayerStatus.Idle, (oldState, newState) => {
        let conn = (0, voice_1.getVoiceConnection)(client.config.bot.guildId);
        if (typeof conn !== "undefined")
            conn.destroy();
    });
    client.on(discord_js_1.Events.VoiceStateUpdate, (oldState, newState) => {
        var _a;
        if (newState.guild.id === client.config.bot.guildId
            && !((_a = newState.member) === null || _a === void 0 ? void 0 : _a.user.bot) && !oldState.mute && !newState.mute) {
            let conn = (0, voice_1.getVoiceConnection)(newState.guild.id);
            if (typeof conn !== "undefined")
                conn.destroy();
            conn = (0, voice_1.joinVoiceChannel)({
                channelId: newState.channelId,
                guildId: newState.guild.id,
                adapterCreator: newState.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });
            conn.on(voice_1.VoiceConnectionStatus.Disconnected, (oldState_, newState_) => {
                console.log("rejoin");
                if (!conn.rejoin())
                    conn.destroy();
            });
            conn.receiver.speaking.once("start", (uid) => {
                var AUDIO_FEED = (0, voice_1.createAudioResource)(node_path_1.default.join(__dirname, "../", "feed", client.config.bot.mp3File));
                conn.subscribe(PLAYER);
                PLAYER.play(AUDIO_FEED);
                (0, voice_1.entersState)(PLAYER, voice_1.AudioPlayerStatus.Playing, 1000 * 300);
                setTimeout(() => {
                    // garbage collector
                    AUDIO_FEED = null;
                    conn.disconnect();
                }, 1000 * 300);
            });
        }
    });
    client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _b, _c, _d, _e;
        try {
            switch (true) {
                case interaction.isChatInputCommand():
                    interaction = interaction;
                    let cmd = client.commands.get(interaction.commandName);
                    cmd.execute(interaction);
                    return;
                case interaction.isMessageComponent():
                    let uid = (_c = (_b = interaction.message.components[0]) === null || _b === void 0 ? void 0 : _b.components[0]) === null || _c === void 0 ? void 0 : _c.customId;
                    if (uid === null) {
                        yield interaction.reply({ ephemeral: true, content: "❌ Cannot retrieve UID of the member that invoked the avatar command" });
                        return;
                    }
                    let invoker = (_e = (_d = interaction.message.components[0]) === null || _d === void 0 ? void 0 : _d.components[0]) === null || _e === void 0 ? void 0 : _e.customId;
                    if (invoker === null)
                        throw new Error("Failed acquiring information about command invoker.");
                    if (!(interaction.user.id === invoker))
                        throw new Error(`Only the invoker(<@${invoker}>) of the command is allowed to perform delete action`);
                    yield interaction.message.delete();
                    yield interaction.reply({
                        ephemeral: true,
                        content: "🫡 Successfully deleted the bot's ``COMMAND OUTPUT``"
                    });
            }
        }
        catch (err) {
            if (interaction.isRepliable()) {
                yield interaction.reply({ ephemeral: true, content: `🫡 OOPS, something went wrong...\n\n\`\`\`${err}\`\`\`` });
            }
            console.log(err);
        }
    }));
    client.login(CONFIG.bot.token);
}
