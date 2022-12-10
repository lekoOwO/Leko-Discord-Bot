import fs from 'fs';
import path from "path";

const CONFIG_FILE_PATH = path.resolve(path.join(process.cwd(), 'data', "config.json"));

function getStaticFilePath(filename){
    return path.resolve(path.join(process.cwd(), 'static', filename));
}

const config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));

export {config, getStaticFilePath};