function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isAdmin(id) {
    return config.discord?.admins?.includes(id.toString());
}

export {
    sleep,
    isAdmin
}