import { config } from "./env.mjs";

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isAdmin(id) {
    return config.discord?.admins?.includes(id.toString());
}

function log(...x){
    if (config.debug){
        console.log(...x);
    }
}

function error(...x){
    if (config.debug){
        console.error(...x);
    }
}

export {
    sleep,
    isAdmin,
    log,
    error,
}