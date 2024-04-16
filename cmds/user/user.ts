import { ActionRowBuilder, ChatInputCommandInteraction, SlashCommandBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { BuildEmbed } from "../../utils/embed";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('User functions')
        .addSubcommand(subcommand =>
            subcommand.setName("avatar")
                .setDescription("Get user's avatar")
                .addUserOption(option =>
                    option
                        .setName("member")
                        .setDescription("Select member")
                        .setRequired(true)
                )
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        let cmd = {
            sub: interaction.options.getSubcommand(true)
        }

        let selectedUser = interaction.options.getUser("member", true)
        if (cmd.sub !== "avatar") {
            await interaction.reply({
                ephemeral: true, embeds: [
                    BuildEmbed()
                        .setTitle("Operation Failure")
                        .setDescription(`❌❔ \`\`${cmd.sub}\`\` is not a known command.`)
                        .setFooter({
                            text: "Pix4 Crew",
                            iconURL: interaction.client.config.bot.logo
                        })
                ]
            })
            return
        }


        let embed = BuildEmbed()
            .setTitle(`${selectedUser.username}'s avatar`)
            .setImage(selectedUser.avatarURL({ forceStatic: true }))
            .setFooter({
                text: "Pix4 Crew",
                iconURL: interaction.client.config.bot.logo
            })

        let avatar = selectedUser.avatarURL({ forceStatic: true })

        if (avatar === null) {
            embed.setDescription("Member has no avatar")
        } else {
            embed.setImage(selectedUser.avatarURL({ forceStatic: true }))
        }

        await interaction.reply({
            embeds: [embed],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id)
                            .setEmoji("❌")
                            .setLabel("Delete")
                            .setStyle(ButtonStyle.Primary)
                    )
            ]
        })
    },
};