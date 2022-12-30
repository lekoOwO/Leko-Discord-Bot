import { getStaticFilePath } from './env.mjs';
import fs from 'fs';

const CSV_PATH = {
    SPONGEBOB: getStaticFilePath('有點高畫質的表格(暫時救回來了) - 網址.csv'),
    場外: getStaticFilePath('場外板.csv'),
}

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

async function searchStickersAll(keyword) {
    const result = [];
    await Promise.all(Object.values(CSV_PATH).map(async (csvPath) => {
        const stickers = await searchStickers(keyword, csvPath);
        result.push(...stickers);
    }));
    return result;
}

export {searchStickers, searchStickersAll, CSV_PATH};