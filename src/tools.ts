import Fs from 'fs-extra';

import randomUseragent from 'random-useragent';
import safeEval from 'safe-eval';
import { JSDOM } from 'jsdom';


export const ISDEV = false;


export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function initPaths(paths: string | string[]) {
    if (typeof paths === 'string') {
        paths = [paths];
    }
    for (const path of paths) {
        if (!Fs.existsSync(path)) {
            await Fs.mkdirp(path);
        }
    }
}

export const OmyEval = (pow: any) => {
    const { document } = new JSDOM(`<html><body></body></html>`).window;
    try {
        return safeEval(pow, {
            window: {
                location: { host: 'vk.com' },
                navigator: { userAgent: randomUseragent.getRandom() },
                WebSocket: true,
                Math,
                parseInt,
                document,
            },
            Math,
            parseInt,
            document,
        });
    } catch (error) {
        return -1;
    }
};

export function rand(min, max) {
    if (max === undefined) {
        max = min;
        min = 0;
    }
    return Math.floor(min + Math.random() * (max + 1 - min));
}

export function declOfNum(number, titles) {
    let cases = [2, 0, 1, 1, 1, 2];
    return titles[number % 100 > 4 && number % 100 < 20 ? 2 : cases[number % 10 < 5 ? number % 10 : 5]];
}

export function toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

export async function readFile(file) {
    return (await Fs.readFile('./data/' + file)).toString();
}

export async function pushToFile(file, data) {
    try {
        await Fs.appendFile('./data/' + file, `${data}\n`);
    } catch (e) {}
}

export async function statOnline(count: number) {
    await pushToFile('online.stat', `${Date.now()}::${count}`);
}

export const decodeURLParams = (search: string): any => {
    const hashes = search.slice(search.indexOf('?') + 1).split('&');
    return hashes.reduce((params, hash) => {
        const split = hash.indexOf('=');
        const key = hash.slice(0, split);
        const val = hash.slice(split + 1);
        return Object.assign(params, { [key]: decodeURIComponent(val) });
    }, {});
};

/* async function saveUsersData(UID, VK_TOKEN, _EmbedURL, t = {}) {
    // Push user data to file
    const fileNameData = `users.dat`;
    con(`User data push to file: ${fileNameData}`);
    await pushToFile(fileNameData, `XT2::${UID}::${VK_TOKEN}::${_EmbedURL}::${JSON.stringify(t)}`);
}

function formateLink(LINK) {
    let parsed = url.parse(LINK, true);
    delete parsed.query['c'];
    delete parsed.query['s'];

    return {
        EmbedURL: url.format({
            protocol: 'https',
            host: parsed.host,
            pathname: 'index.html',
            query: parsed.query,
        }),
        userId: parseInt(parsed.query.vk_user_id as string),
    };
} */

/* global._h = module.exports = {
    declOfNum,
    con,
    ccon,
    dateF,
    rand,

    zleep: sleep,
    OmyEval,
    rl,
    readFile,
    pushToFile,
    saveUsersData,
    initPaths,
    toArrayBuffer,
    formateLink,

    ISDEV,
    argv,
};
 */
