import { ChatGPTAPI } from 'chatgpt'
import { config } from "./env.mjs";
import { sleep } from "./utils.mjs";

const conversations = {};

const api = new ChatGPTAPI({
    sessionToken: config.chatgpt.session_token
})

async function getConversation(id) {
    await api.ensureAuth();

    if (!conversations[id]) {
        const conversation = api.getConversation();
        conversations[id] = {
            conversationId: conversation.conversationId,
            parentMessageId: conversation.parentMessageId,
            date: Date.now()
        };
        return conversation;
    }

    conversations[id].date = Date.now();
    return api.getConversation({
        conversationId: conversations[id].conversationId,
        parentMessageId: conversations[id].parentMessageId
    })
}

function deleteConversation(id) {
    delete conversations[id];
}

async function clearConversations() {
    const interval = config.chatgpt?.interval ?? 1000 * 60 * 60;

    while(true) {
        for (const id in conversations) {
            if (Date.now() - conversations[id].date > interval) {
                delete conversations[id];
            }
        }
        await sleep(interval/2);
    }
}

clearConversations();

function buildEmbeds(question, answer, user){
    const embeds = [
        {
          "title": "問題",
          "description": question,
          "footer": {
            "text": user.tag,
            "icon_url": user.avatarURL()
          }
        },
        {
          "title": "回答",
          "description": answer,
          "footer": {
            "text": "ChatGPT",
            "icon_url": "https://i.imgur.com/X9DmG9x.jpeg"
          }
        }
    ];
    return embeds;
}

export default {
    getConversation,
    deleteConversation,
    buildEmbeds
}