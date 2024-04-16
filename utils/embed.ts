import { EmbedBuilder } from "discord.js";

const SCHEME = [
    "6329c2",
    "3530bf",
    "433eb8"
]

// just a blueprint builder
export const BuildEmbed = (): EmbedBuilder => {
    return new EmbedBuilder()
        .setColor(`#${SCHEME[Math.floor(Math.random() * SCHEME.length)]}`)
}