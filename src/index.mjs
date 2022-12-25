import { config } from "./env.mjs";
import { client, Discord, refreshCommands } from "./discord.mjs";

client.once(Discord.Events.ClientReady, async c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    console.log(`Join bot to your server: https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&permissions=414464691265&scope=bot%20applications.commands`)
    for(const guild of c.guilds.cache.values()) {
        console.log(`Started refreshing ${guild.name} application (/) commands.`);
        refreshCommands(guild.id);
    }
});

client.on(Discord.Events.GuildCreate, async guild => {
    console.log(`Started refreshing ${guild.name} application (/) commands.`);
    refreshCommands(guild.id);
})

client.login(config.discord.token);