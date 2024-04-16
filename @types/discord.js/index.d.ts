import { Collection } from "discord.js";
import { YamlConfig } from "../config";

declare module "discord.js" {
    export interface Client {
        commands: Collection<unknown, unknown>
        config: YamlConfig
    }
}