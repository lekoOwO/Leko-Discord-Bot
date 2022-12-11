import Discord from "discord.js";
import { config } from "./env.mjs";
import { searchStickers } from "./spongebobStickers.mjs";
import chatgpt from "./chatgpt.mjs";
import { isAdmin } from "./utils.mjs";
// https://discord.com/api/oauth2/authorize?client_id=<>&permissions=277025410112&scope=bot%20applications.commands

const client = new Discord.Client({
    intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages]
});

client.on(Discord.Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`找不到 ${interaction.commandName} 的指令。`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        try {
            await interaction.reply({ content: '執行指令時發生錯誤。', ephemeral: true });
        } catch (error) {
            await interaction.editReply({ content: '執行指令時發生錯誤。', ephemeral: true });
        }
        
    }
});

const commands = {
    sb: {
        data: new Discord.SlashCommandBuilder()
            .setName('sb')
            .setDescription('搜尋海綿寶寶貼圖')
            .addStringOption(option => option.setName('keyword').setDescription('關鍵字').setRequired(true)),
        execute: async (interaction) => {
            await interaction.deferReply({
                ephemeral: true
            });

            try {
                const keyword = interaction.options.getString('keyword');
                const stickers = await searchStickers(keyword);

                if (stickers.length == 0) {
                    await interaction.editReply({ content: `找不到 ${keyword} 的貼圖`, ephemeral: true });
                    return;
                }

                const embed = new Discord.EmbedBuilder()
                    .addFields({
                        name: "搜尋結果",
                        value: stickers.map(sticker => `[${sticker.名稱}](${sticker["i.imgur"]})`).join('\n')
                    });

                await interaction.editReply({ embeds: [embed], ephemeral: true });
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: `發生錯誤。`, ephemeral: true });
            }
        }
    },
    chatgpt: {
        data: new Discord.SlashCommandBuilder()
            .setName('chatgpt')
            .setDescription('與 ChatGPT 聊天')
            .addStringOption(option => option.setName('question').setDescription('問題').setRequired(true))
            .addBooleanOption(option => option.setName('ephemeral').setDescription('隱藏對話'))
            .addBooleanOption(option => option.setName('reset').setDescription('重置對話'))
            .addUserOption(option => option.setName('user').setDescription('Session 使用者')),
        execute: async (interaction) => {
            const ephemeral = interaction.options.getBoolean('ephemeral');
            const reset = interaction.options.getBoolean('reset');

            const cmgr = chatgpt.conversationManager;

            await interaction.deferReply({
                ephemeral
            });

            let sessionId = `${interaction.guildId}-${interaction.user.id}`;
            if (isAdmin(interaction.user.id) && interaction.options.getUser('user')) {
                sessionId = `${interaction.guildId}-${interaction.options.getUser('user').id}`;
            }

            if (reset) try {
                cmgr.deleteConversation(sessionId);
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: `重置對話發生錯誤。`, ephemeral});
                return;
            }

            try {
                const question = interaction.options.getString('question');

                const conversation = await cmgr.getConversation(sessionId);
                const answer = await conversation.sendMessage(question);

                await interaction.editReply({ embeds: chatgpt.buildEmbeds(question, answer, interaction.user)});
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: `發生錯誤。\n非常有可能是 ChatGPT 伺服器過載。`, ephemeral});
            }
        }
    },
    chatgpt_keys: {
        data: new Discord.SlashCommandBuilder()
            .setName('chatgpt_keys')
            .setDescription('查看 ChatGPT 的 Session'),
        execute: async (interaction) => {
            await interaction.deferReply({
                ephemeral: true
            });

            if (!isAdmin(interaction.user.id)) {
                await interaction.editReply({ content: `存取被拒。`, ephemeral: true });
                return;
            }

            const cmgr = chatgpt.conversationManager;

            try {
                const keys = cmgr.conversations.getConversationKeys();
                const embed = new Discord.EmbedBuilder()
                    .addFields({
                        name: "ChatGPT Session",
                        value: keys.map(x => x.split("-")[1]).map(x => `<@${x}>`).join('\n')
                    });

                await interaction.editReply({ embeds: [embed], ephemeral: true });
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: `發生錯誤。`, ephemeral: true });
            }
        }
    }
}

client.commands = new Discord.Collection();
for (const command of Object.values(commands)) {
    client.commands.set(command.data.name, command);
};

async function refreshCommands(guildId) {
    try {
        const rest = new Discord.REST({ version: '10' }).setToken(config.discord.token);
        console.log(`Started refreshing ${Object.keys(commands).length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Discord.Routes.applicationGuildCommands(config.discord.clientId, guildId),
            { body: Object.values(commands).map(c => c.data.toJSON()) },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands on ${guildId}.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
}
export { client, refreshCommands, Discord };