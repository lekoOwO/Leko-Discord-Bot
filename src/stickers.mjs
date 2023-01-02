import { config } from './env.mjs';
import fs from 'fs';

import { Readable } from 'stream';
import { finished } from 'stream/promises';

async function searchStickers(keyword, csvPath) {
    const matchLines = [];

    const data = await fs.promises.readFile(csvPath, 'utf8');
    const lines = data.split('\n');
    const header = lines[0].split(',').map(x => x.trim());

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(keyword)) {
            matchLines.push(line);
        }
    }

    const result = [];
    for (let i = 0; i < matchLines.length; i++) {
        const line = matchLines[i];
        const cols = line.split(',');
        const obj = {};
        for (let j = 0; j < header.length; j++) {
            obj[header[j]] = cols[j];
        }
        result.push(obj);
    }
    return result;
}

async function initStickers() {
    await Promise.all(
        Object.values(config.stickers).map(async x => {
            if (fs.existsSync(x.file)) return;
            if (!x.url) {
                console.error(`initStickers: Stickers file ${x.file} not found and no url provided.`);
                return;
            }
            console.log(`Downloading stickers file ${x.file}.`);

            try {
                const res = await fetch(x.url);
                const body = Readable.fromWeb(res.body);
                const stream = fs.createWriteStream(x.file);
                await finished(body.pipe(stream));
            } catch (e) {
                console.error(`initStickers: Failed to download stickers file ${x.file}.`);
                console.error(e);
            }
        })
    )
}

async function reloadStickers() {
    await Promise.all(
        Object.values(config.stickers).map(async x => {
            if (!x.url) {
                console.error(`reloadStickers: Stickers file ${x.file} not found and no url provided.`);
                return;
            }
            console.log(`Downloading stickers file ${x.file}.`);

            try {
                const res = await fetch(x.url);
                const body = Readable.fromWeb(res.body);
                const stream = fs.createWriteStream(x.file);
                await finished(body.pipe(stream));
            } catch (e) {
                console.error(`reloadStickers: Failed to download stickers file ${x.file}.`);
                console.error(e);
            }
        })
    )
}

async function searchStickersAll(keyword) {
    await initStickers();

    const result = [];
    await Promise.all(Object.values(config.stickers).map(async (x) => {
        const stickers = await searchStickers(keyword, x.file);
        result.push(...stickers);
    }));
    return result;
};

initStickers();

export { searchStickers, searchStickersAll, initStickers, reloadStickers };