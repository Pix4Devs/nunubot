"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildEmbed = void 0;
const discord_js_1 = require("discord.js");
const SCHEME = [
    "6329c2",
    "3530bf",
    "433eb8"
];
// just a blueprint builder
const BuildEmbed = () => {
    return new discord_js_1.EmbedBuilder()
        .setColor(`#${SCHEME[Math.floor(Math.random() * SCHEME.length)]}`);
};
exports.BuildEmbed = BuildEmbed;
