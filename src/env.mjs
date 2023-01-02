import fs from 'fs';
import path from "path";

function getDataFilePath(filename){
    return path.resolve(path.join(process.cwd(), 'data', filename));
}

const CONFIG_FILE_PATH = getDataFilePath("config.json");
let config;

function reloadConfig(){
    config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
    for(const sticker of Object.values(config.stickers)){
        sticker.file = getDataFilePath(sticker.file);
    }
}
reloadConfig();

export {config, getDataFilePath, reloadConfig};