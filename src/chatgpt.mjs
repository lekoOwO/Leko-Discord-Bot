import { ChatGPTAPI } from 'chatgpt'
import { config } from "./env.mjs";
import { sleep } from "./utils.mjs";

const api = new ChatGPTAPI({
    sessionToken: config.chatgpt.session_token
})

class ConversationManager {

    #conversations = {};
    #clearConversationPromise = null;

    async getConversation(id) {
        await api.ensureAuth();

        if (!this.#conversations[id]) {
            const conversation = api.getConversation();
            this.#conversations[id] = {conversation, date: Date.now()};
            return conversation;
        }

        this.#conversations[id].date = Date.now();
        return this.#conversations[id].conversation;
    }

    getConversationKeys(){
        return Object.keys(this.#conversations);
    }

    deleteConversation(id) {
        delete this.#conversations[id];
    }

    manualClearConversations() {
        for (const id of Object.keys(this.#conversations)) {
            if (Date.now() - this.#conversations[id].date > interval) {
                delete this.#conversations[id];
            }
        }
    }

    async #clearConversations() {
        const interval = config.chatgpt?.interval ?? 1000 * 60 * 60;

        while(true) {
            for (const id of Object.keys(this.#conversations)) {
                if (Date.now() - this.#conversations[id].date > interval) {
                    delete this.#conversations[id];
                }
            }
            await sleep(interval/2);
        }
    }

    startClearConversations() {
        if (this.#clearConversationPromise) return;
        this.#clearConversationPromise = this.#clearConversations();
    }
}

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

const conversationManager = new ConversationManager();
conversationManager.startClearConversations();

export default {
    ConversationManager,
    conversationManager,
    buildEmbeds
}