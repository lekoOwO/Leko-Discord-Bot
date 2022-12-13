import { config, getDataFilePath } from "./env.mjs";
import { isAdmin } from "./utils.mjs";
import fs from "fs";
import { Mutex } from 'async-mutex';

const CONFIG_SUBPATH = "discord_invite";
const DISCORD_INVITE_FILE_PATH = getDataFilePath("discord-invite.json");

const mutex = new Mutex();
let discordInvite = {};

async function addDbInvite(userId, channelId, invite){
    if (!discordInvite.hasOwnProperty(userId)){
        discordInvite[userId] = {};
    }
    if (!discordInvite[userId].hasOwnProperty(channelId)){
        discordInvite[userId][channelId] = [];
    }
    await mutex.runExclusive(() => {
        discordInvite[userId][channelId].push(invite);
        fs.writeFileSync(DISCORD_INVITE_FILE_PATH, JSON.stringify(discordInvite, null, 4));
    });
};

function getDbUserInvitesWithIn(userId, channelId, interval){
    if (!discordInvite.hasOwnProperty(userId)){
        return [];
    }
    if (!discordInvite[userId].hasOwnProperty(channelId)){
        return [];
    }
    return discordInvite[userId][channelId].filter(x => x.createdAt > Date.now() - interval);
};

if (!fs.existsSync(DISCORD_INVITE_FILE_PATH)) {
    fs.writeFileSync(DISCORD_INVITE_FILE_PATH, JSON.stringify(discordInvite, null, 4)); 
}

discordInvite = JSON.parse(fs.readFileSync(DISCORD_INVITE_FILE_PATH, 'utf8'));

async function isValidInviter(inviter, channelId, joinedAt) {
    if (!config[CONFIG_SUBPATH].channels.includes(channelId)) return false;
    if (inviter.bot) return false;
    if (await isAdmin(inviter.id)) return true;
    if (joinedAt < Date.now() - config[CONFIG_SUBPATH].validAfter) return false;
    if (getDbUserInvitesWithIn(inviter.id, channelId, config[CONFIG_SUBPATH].interval).length < config[CONFIG_SUBPATH].invitesPerInterval) return true;

    return false;
}

function getChannelId(guildId, channelId){
    if (config[CONFIG_SUBPATH].channels.includes(channelId)) return channelId;
    else if (config[CONFIG_SUBPATH].guildToChannelMap.hasOwnProperty(guildId)) return config[CONFIG_SUBPATH].guildToChannelMap[guildId];
    else return null;
}

export {
    addDbInvite,
    getChannelId,
    isValidInviter,
    CONFIG_SUBPATH as configSubpath
}