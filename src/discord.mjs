import Discord from "discord.js";
import { config, reloadConfig } from "./env.mjs";
import { searchStickersAll, reloadStickers } from "./stickers.mjs";
// import chatgpt from "./chatgpt.mjs";
import { isAdmin } from "./utils.mjs";
import { isValidInviter, addDbInvite, getChannelId as inviteGetChannelId, configSubpath as inviteConfigSubpath } from "./discordInvite.mjs";
// https://discord.com/api/oauth2/authorize?client_id=<>&permissions=277025410112&scope=bot%20applications.commands

const client = new Discord.Client({
    intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages, Discord.GatewayIntentBits.MessageContent]
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
    sticker: {
        data: new Discord.SlashCommandBuilder()
            .setName('sticker')
            .setDescription('搜尋貼圖')
            .addStringOption(option => option.setName('keyword').setDescription('關鍵字').setRequired(true)),
        execute: async (interaction) => {
            await interaction.deferReply({
                ephemeral: true
            });

            try {
                const keyword = interaction.options.getString('keyword');
                const stickers = await searchStickersAll(keyword);

                if (stickers.length == 0) {
                    await interaction.editReply({ content: `找不到 ${keyword} 的貼圖`, ephemeral: true });
                    return;
                }

                const embed = new Discord.EmbedBuilder()
                    .addFields({
                        name: "搜尋結果",
                        value: stickers.map(sticker => `[${sticker.名稱}](${sticker["圖片網址"] ?? sticker["i.imgur"]})`).join('\n')
                    });

                await interaction.editReply({ embeds: [embed], ephemeral: true });
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: `發生錯誤。`, ephemeral: true });
            }
        }
    },
    reload_sticker: {
        data: new Discord.SlashCommandBuilder()
            .setName('reload_sticker')
            .setDescription('重新載入貼圖'),
        execute: async (interaction) => {
            await interaction.deferReply({
                ephemeral: true
            });

            if (!isAdmin(interaction.user.id)) {
                await interaction.editReply({ content: `存取被拒。`, ephemeral: true });
                return;
            }

            try {
                await reloadStickers();
                await interaction.editReply({ content: `重新載入貼圖成功。`, ephemeral: true });
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: `發生錯誤。`, ephemeral: true });
            }
        }
    },
    // chatgpt: {
    //     data: new Discord.SlashCommandBuilder()
    //         .setName('chatgpt')
    //         .setDescription('與 ChatGPT 聊天')
    //         .addStringOption(option => option.setName('question').setDescription('問題').setRequired(true))
    //         .addBooleanOption(option => option.setName('ephemeral').setDescription('隱藏對話'))
    //         .addBooleanOption(option => option.setName('reset').setDescription('重置對話'))
    //         .addUserOption(option => option.setName('user').setDescription('Session 使用者')),
    //     execute: async (interaction) => {
    //         const ephemeral = interaction.options.getBoolean('ephemeral');
    //         const reset = interaction.options.getBoolean('reset');

    //         const cmgr = chatgpt.conversationManager;

    //         await interaction.deferReply({
    //             ephemeral
    //         });

    //         let sessionId = `${interaction.guildId}-${interaction.user.id}`;
    //         let user = interaction.user;
    //         if (isAdmin(interaction.user.id) && interaction.options.getUser('user')) {
    //             sessionId = `${interaction.guildId}-${interaction.options.getUser('user').id}`;
    //             user = interaction.options.getUser('user');
    //         }

    //         if (reset) try {
    //             cmgr.deleteConversation(sessionId);
    //         } catch (e) {
    //             console.error(e);
    //             await interaction.editReply({ content: `重置對話發生錯誤。`, ephemeral});
    //             return;
    //         }

    //         try {
    //             const question = interaction.options.getString('question');

    //             const conversation = await cmgr.getConversation(sessionId);

    //             let lastAnswer = 0;
    //             const answer = await conversation.sendMessage(question, {
    //                 onProgress: async(x) => {
    //                     if (Date.now() - lastAnswer > 1000) {
    //                         lastAnswer = Date.now();
    //                         await interaction.editReply({ embeds: chatgpt.buildEmbeds(question, x, user)});
    //                     }
    //                 }
    //             });
    //             await interaction.editReply({ embeds: chatgpt.buildEmbeds(question, answer, user)});
    //         } catch (e) {
    //             console.error(e);
    //             await interaction.editReply({ content: `發生錯誤。\n非常有可能是 ChatGPT 伺服器過載。`, ephemeral});
    //         }
    //     }
    // },
    // chatgpt_keys: {
    //     data: new Discord.SlashCommandBuilder()
    //         .setName('chatgpt_keys')
    //         .setDescription('查看 ChatGPT 的 Session'),
    //     execute: async (interaction) => {
    //         await interaction.deferReply({
    //             ephemeral: true
    //         });

    //         if (!isAdmin(interaction.user.id)) {
    //             await interaction.editReply({ content: `存取被拒。`, ephemeral: true });
    //             return;
    //         }

    //         const cmgr = chatgpt.conversationManager;

    //         try {
    //             const keys = cmgr.getConversationKeys();
    //             const embed = new Discord.EmbedBuilder()
    //                 .addFields({
    //                     name: "ChatGPT Session",
    //                     value: keys.length ? keys.map(x => x.split("-")[1]).map(x => `<@${x}>`).join('\n') : "沒有 Session"
    //                 });

    //             await interaction.editReply({ embeds: [embed], ephemeral: true });
    //         } catch (e) {
    //             console.error(e);
    //             await interaction.editReply({ content: `發生錯誤。`, ephemeral: true });
    //         }
    //     }
    // },
    // chatgpt_refresh: {
    //     data: new Discord.SlashCommandBuilder()
    //         .setName('chatgpt_refresh')
    //         .setDescription('重新載入 ChatGPT'),
    //     execute: async (interaction) => {
    //         await interaction.deferReply({
    //             ephemeral: true
    //         });

    //         if (!isAdmin(interaction.user.id)) {
    //             await interaction.editReply({ content: `存取被拒。`, ephemeral: true });
    //             return;
    //         }

    //         try {
    //             reloadConfig();
    //             chatgpt.refreshSessionToken();
    //             await interaction.editReply({ content: `重新載入成功。`, ephemeral: true });
    //         } catch (e) {
    //             console.error(e);
    //             await interaction.editReply({ content: `發生錯誤。`, ephemeral: true });
    //         }
    //     }
    // },
    reload_config: {
        data: new Discord.SlashCommandBuilder()
            .setName('reload_config')
            .setDescription('重新載入設定檔'),
        execute: async (interaction) => {
            await interaction.deferReply({
                ephemeral: true
            });

            if (!isAdmin(interaction.user.id)) {
                await interaction.editReply({ content: `存取被拒。`, ephemeral: true });
                return;
            }

            try {
                reloadConfig();
                await interaction.editReply({ content: `重新載入成功。`, ephemeral: true });
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: `發生錯誤。`, ephemeral: true });
            }
        }
    },
    invite: {
        data: new Discord.SlashCommandBuilder()
            .setName('invite')
            .setDescription('產生一次性邀請連結'),
        execute: async (interaction) => {
            await interaction.deferReply({
                ephemeral: true
            });

            const channelId = inviteGetChannelId(interaction.guildId, interaction.channelId);
            if (!channelId) {
                await interaction.editReply({ content: `無法在此建立邀請連結。`, ephemeral: true });
                return;
            }

            if (!await isValidInviter(interaction.user, channelId, interaction.member.joinedTimestamp)){
                console.error(`邀請連結建立失敗：${interaction.user.tag}\n${JSON.stringify({ 
                    channelId: interaction.channel.id, channelName: interaction.channel.name,
                    guildId: interaction.guildId, guildName: interaction.guild.name,
                    joinedAt: interaction.member.joinedTimestamp
                })}}`)
                await interaction.editReply({ content: `您已超過邀請次數，或是無法在此建立邀請連結。`, ephemeral: true });
                return;
            }

            try {
                const guild = await client.guilds.fetch(interaction.guildId);
                const invite = await guild.invites.create(channelId, {
                    temporary: true,
                    maxAge: config[inviteConfigSubpath].maxAge,
                    maxUses: 1,
                    unique: true,
                    reason: `邀請連結由 ${interaction.user.tag} 建立。`
                });
                await addDbInvite(interaction.user.id, interaction.channelId, {
                    createdAt: invite.createdTimestamp,
                    expiresAt: invite.expiresTimestamp,
                    code: invite.code,
                })
                await interaction.editReply({ content: `邀請連結已建立: ${invite.url}`, ephemeral: true });
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: `發生錯誤。`, ephemeral: true });
            }
        }
    },
    emoji: {
        data: new Discord.SlashCommandBuilder()
            .setName('emoji')
            .setDescription('取得表情符號的圖片連結')
            .addStringOption(option => option.setName('message-id').setDescription('來源訊息 ID').setRequired(true)),
        execute: async (interaction) => {
            await interaction.deferReply({
                ephemeral: true
            });

            if (!isAdmin(interaction.user.id)) {
                await interaction.editReply({ content: `存取被拒。`, ephemeral: true });
                return;
            }

            try {
                const messageId = interaction.options.getString('message-id');
                const message = await interaction.channel.messages.fetch(messageId);

                const emojis = message.content.match(/<a?:[a-zA-Z0-9_]+:[0-9]+>/g);
                if (!emojis) {
                    await interaction.editReply({ content: `訊息內沒有表情符號。`, ephemeral: true });
                    return;
                }

                const postEmojis = emojis.map(emoji => {
                    const emojiName = emoji.match(/:[a-zA-Z0-9_]+:/)[0];
                    const emojiId = emoji.match(/:([0-9]+)/)[1];
                    const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${emoji.startsWith('<a:') ? 'gif' : 'webp'}`;
                    return ({
                        name: emojiName,
                        url: emojiUrl
                    })
                });

                const embed = new Discord.EmbedBuilder()
                    .addFields({
                        name: "搜尋結果",
                        value: postEmojis.map(pe => `[${pe.name}](${pe.url})`).join('\n')
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