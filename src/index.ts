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

TemplateField.path2file = './data/drawme.test.png';

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

    await addMainWarrior();
    // return;

    const fileName = 'users.ini';
    const usersDataContent = await readFile(fileName);
    if (!usersDataContent) {
        log.error(`Not found file ./data/${fileName}`);
        return;
    }

    let arUsersData = [];
    const usersData = usersDataContent
        .split('\n')
        .filter((e) => e && e.length > 0 && !e.startsWith('#'))
        .map((e) => e.replace(/\r?\n|\r/g, '').split('::'))
        .filter((e) => e.length > 2);

    if (!usersData.length) {
        log.error(`Empty users data from ./data/${fileName}`);
        return;
    }

    for (const user of usersData) {
        if (user[0] === 'XT2') {
            let [, userId, token, embedURL] = user;
            embedURL = embedURL
                .toString()
                .replace('https://pixel2019.vkforms.ru', 'https://prod-app7148888-4344348240cf.pages.vk-apps.com');
            arUsersData.push({ userId, token, embedURL });
        } else {
            const [userId, token, , , embedURL] = user;
            arUsersData.push({ userId, token, embedURL });
        }
    }

    // log.info.green(`Load warroirs...`, arUsersData);

    const Warroirs = await Promise.all(
        arUsersData.filter((e) => !!e.embedURL).map(({ embedURL }) => BattleField.addWarrior({ embedURL }))
    );

    log.info.green(`Loaded ${Warroirs.length}/${arUsersData.length} Warroirs`);

    log.info.green.underline('Enter start');
    // BattleField.Go();
}
