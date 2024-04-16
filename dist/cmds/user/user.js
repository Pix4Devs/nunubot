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
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed_1 = require("../../utils/embed");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('user')
        .setDescription('User functions')
        .addSubcommand(subcommand => subcommand.setName("avatar")
        .setDescription("Get user's avatar")
        .addUserOption(option => option
        .setName("member")
        .setDescription("Select member")
        .setRequired(true))),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = {
                sub: interaction.options.getSubcommand(true)
            };
            let selectedUser = interaction.options.getUser("member", true);
            if (cmd.sub !== "avatar") {
                yield interaction.reply({
                    ephemeral: true, embeds: [
                        (0, embed_1.BuildEmbed)()
                            .setTitle("Operation Failure")
                            .setDescription(`❌❔ \`\`${cmd.sub}\`\` is not a known command.`)
                            .setFooter({
                            text: "Pix4 Crew",
                            iconURL: interaction.client.config.bot.logo
                        })
                    ]
                });
                return;
            }
            let embed = (0, embed_1.BuildEmbed)()
                .setTitle(`${selectedUser.username}'s avatar`)
                .setImage(selectedUser.avatarURL({ forceStatic: true }))
                .setFooter({
                text: "Pix4 Crew",
                iconURL: interaction.client.config.bot.logo
            });
            let avatar = selectedUser.avatarURL({ forceStatic: true });
            if (avatar === null) {
                embed.setDescription("Member has no avatar");
            }
            else {
                embed.setImage(selectedUser.avatarURL({ forceStatic: true }));
            }
            yield interaction.reply({
                embeds: [embed],
                components: [
                    new discord_js_1.ActionRowBuilder()
                        .addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId(interaction.user.id)
                        .setEmoji("❌")
                        .setLabel("Delete")
                        .setStyle(discord_js_1.ButtonStyle.Primary))
                ]
            });
        });
    },
};
