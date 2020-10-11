import { initPaths, readFile } from './tools';
import { config } from './config';
import BattleField from './Pixel/BattleField';
import TemplateField from './TemplateField';
import Readline from './readline';
import { log } from './logger';
import { Pixel } from './Pixel/Pixel';
import { WarriorAccount } from './Pixel/PixelAccount';

Readline.Prompt();

// Start Start app
InitApp().then();

// TemplateField.path2file = './data/drawme.test.png';

async function addMainWarrior() {
    const embedURL = config.get('TEST_EMBED_URL');
    if (!embedURL) {
        log.info('Empty embed url');
        return;
    }

    await BattleField.addWarrior({ embedURL });
}

Readline.on('q', (_x: string, _y: string) => {
    let x = parseInt(_x, 10);
    let y = parseInt(_y, 10);

    let pixel = new Pixel({ x: x, y: y, colorId: 0 });

    const warriors = BattleField.aliveWarriors.entries();
    const { value, done } = warriors.next();
    
    if (done) {
        log.info.yellow('Not warriors');
        return;
    }
    const [userId, warrior] = value as [number, WarriorAccount];
    warrior.debug('Send custom Pixel', pixel);
    warrior.sendPixel(pixel);
});
Readline.on('start', () => {
    BattleField.Go();
    log.info.blue('Battle started');
});
Readline.on('stop', () => {
    BattleField.Stop();
    log.info.blue('Battle stopped');
});

async function InitApp() {
    log.info('Loading...');

    await initPaths(['./data/', './logs/']);
    await TemplateField.loadTemplateField();
    TemplateField.watchFolder('./data/');

    // await addMainWarrior();
    // return;

    // log.info.green(`Load warroirs...`, arUsersData);

    let usersData = await LoadUsers();
    let embedsData = await LoadEmbeds();
    let embeds = [
        ...usersData.filter((e) => !!e.embedURL).map(({ embedURL }) => embedURL),
        ...embedsData
    ];

    const Warroirs = await Promise.all(
        embeds.filter(Boolean).map((embedURL) => BattleField.addWarrior({ embedURL }))
    );

    log.info.green(`Loaded ${Warroirs.length}/${embeds.length} Warroirs`);

    log.info.green.underline('Enter start');
    // BattleField.Go();
}

async function LoadUsers() {
    const fileName = 'users.ini';
    const dataContent = await readFile(fileName);
    if (!dataContent) {
        log.error(`Not found file ./data/${fileName}`);
        return [];
    }

    let usersData = [];
    const arData = dataContent
        .split('\n')
        .filter((e) => e && e.length > 0 && !e.startsWith('#'))
        .map((e) => e.replace(/\r?\n|\r/g, ''))
        .map((e) => e.split('::'))
        .filter((e) => e.length > 2);

    if (!arData.length) {
        log.error(`Empty data from ./data/${fileName}`);
        return [];
    }

    for (const data of arData) {
        if (data[0] === 'XT2') {
            let [, userId, token, embedURL] = data;
            embedURL = embedURL
                .toString()
                .replace('https://pixel2019.vkforms.ru', 'https://prod-app7148888-4344348240cf.pages.vk-apps.com');
            usersData.push({ userId, token, embedURL });
        } else {
            let [userId, token, , , embedURL] = data;
            embedURL = embedURL
                .toString()
                .replace('https://prod-app7148888-a4ac5e7b4372.pages.vk-apps.com', 'https://prod-app7148888-4344348240cf.pages.vk-apps.com');
            usersData.push({ userId, token, embedURL });
        }
    }

    return usersData;
}

async function LoadEmbeds() {
    const fileName = 'embeds.ini';
    const dataContent = await readFile(fileName);
    if (!dataContent) {
        log.error(`Not found file ./data/${fileName}`);
        return [];
    }

    let embedsData = [];
    const arData = dataContent.split('\n').filter((e) => e && e.length > 0 && !e.startsWith('#'))
    .map((e) => e.replace(/\r?\n|\r/g, ''));

    if (!arData.length) {
        log.error(`Empty data from ./data/${fileName}`);
        return [];
    }

    for (const data of arData) {
        let embedURL = data
            .toString()
            .replace(
                'https://prod-app7148888-a4ac5e7b4372.pages.vk-apps.com',
                'https://prod-app7148888-4344348240cf.pages.vk-apps.com'
            );
        embedsData.push(embedURL);
    }

    return embedsData;
}