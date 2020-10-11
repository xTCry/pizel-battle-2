import { initPaths, readFile } from './tools';
import { config } from './config';
import BattleField from './Pixel/BattleField';
import TemplateField from './TemplateField';
import Readline from './readline';
import { log } from './logger';
import { Pixel } from './Pixel/Pixel';

Readline.Prompt();

// Start Start app
(async function () {
    log.info('Loading...');

    return await InitApp();
})();

async function addMainWarrior() {
    const embedURL = config.get('TEST_EMBED_URL');
    if (!embedURL) {
        log.info('Empty embed url');
        return;
    }

    let wrrior = await BattleField.addWarrior({ embedURL });

    Readline.on('q', (_x: string, _y: string, asBuff: boolean = false) => {
        let x = parseInt(_x, 10);
        let y = parseInt(_y, 10);

        if (asBuff) {
            let pixBuff = [
                new Pixel(x, y, 8),
                new Pixel(x + 1, y, 8),
                new Pixel(x, y + 1, 8),
                new Pixel(1 - x, y + 1, 8),
            ];
    
            log.info.blue('Pixels', pixBuff);
            wrrior.sendBufferPixel(pixBuff);
            return;
        }

        let pixel = new Pixel(x, y, 8);
        log.info.blue('Pixel', pixel);
        wrrior.sendPixel(pixel);
    });
}

async function InitApp() {
    await initPaths(['./data/', './logs/']);
    await TemplateField.loadTemplateField();
    TemplateField.watchFolder('./data/');

    await addMainWarrior();
    // return

    const usersDataContent = (await readFile('users.data'))
    if (!usersDataContent) {
        log.error('Not found file ./data/users.data');
        return;
    }

    let arUsersData = [];
    const usersData = usersDataContent
        .split('\n')
        .filter((e) => e.length > 0)
        .map((e) => e.replace(/\r?\n|\r/g, '').split('::'))
        .filter((e) => e.length > 2);

    if (!usersData.length) {
        log.error('Empty users data from ./data/users.data');
        return;
    }

    for (const user of usersData) {
        const [userId, token, , , embedURL] = user;
        arUsersData.push({ userId, token, embedURL });
    }

    // log.info.green(`Load warroirs...`, arUsersData);

    const Warroirs = await Promise.all(
        arUsersData.filter((e) => !!e.embedURL).map(({ embedURL }) => BattleField.addWarrior({ embedURL }))
    );

    log.info.green(`Loaded ${Warroirs.length}/${arUsersData.length} Warroirs`);

    BattleField.Go();

    // ...

    /*
    let successLoaded = 0;
    accounts = [];

    if (VK_TOKENS.length == 0 && CUSTOM_LINKS.length == 0) {
        con(`Не установлен ни один токен. Смотри ${colors.bold(`README.md`)}.`);
        process.exit();
    }

    for (const tid in VK_TOKENS) {
        const curToken = VK_TOKENS[tid];

        let data = workdUsers.find((e) => e.token == curToken);
        if (!data) {
            data = await inVKProc(curToken, VK_PLAY_GID);
            await saveUsersData(data.userId, data.token, data.EmbedURL);
        }

        if (data) {
            const bot = new xBot(data.userId);
            bot.init(data.EmbedURL, data.userId);
            bot.pid = tid;
            accounts.push(bot);
            con(`Loaded + [${tid * 1 + 1}\\${VK_TOKENS.length}]`, 'green');
            successLoaded++;

            omyLog(`StartApp::VK_Authd;`, {
                astroData: {
                    VK_TOKEN: curToken,
                    USER_ID: data.userId,
                    EmbedURL: data.EmbedURL,
                },
            });
        } else {
            con(`Died: ${curToken.slice(0, 5)}`, 'red');
        }
    }
    countSuccessAccs = successLoaded;

    successLoaded = 0;
    for (const tid in CUSTOM_LINKS) {
        const data = formateLink(CUSTOM_LINKS[tid]);
        if (data.userId && data.EmbedURL) {
            const bot = new xBot(data.userId);
            bot.init(data.EmbedURL, data.userId);
            bot.pid = countSuccessAccs + tid;
            accounts.push(bot);
            con(`Loaded + [${tid * 1 + 1}\\${CUSTOM_LINKS.length}]`, 'green');
            successLoaded++;

            omyLog(`StartApp::VK_Linkd;`, {
                astroData: {
                    VK_LINK: CUSTOM_LINKS[tid],
                    USER_ID: data.userId,
                    EmbedURL: data.EmbedURL,
                },
            });
        } else {
            con(`Link RIP: №${tid}`, 'red');
        }
    }

    countSuccessAccs += successLoaded;

    // Start all bots
    for (const bot of accounts) {
        try {
            if (LINEAR_WS) {
                await bot.start();
            } else {
                bot.start();
            }
        } catch (e) {
            // TODO: remove this acc
        }
    } */
}
