import { rand, sleep } from '../tools';
import { colorIndexDecode, Pixel, PixelFlag } from './Pixel';
import { WarriorAccount } from './PixelAccount';
import { VKUserParams } from '../VKUser';
import { LoadingState } from '../types';
import { log } from '../logger';
import { HealthCheck } from './HealthCheck';

export enum BattleState {
    NONE = 0,
    WAIT = 1,
    DRAWING = 2,
}

/**
 * Главный класс приложения для Поля Битвы
 */
export class CBattleField {
    /**
     * Массив воинов (аккаунтов)
     */
    public warriors: Map<number, WarriorAccount> = new Map();

    private lastSayOnline = 0;

    public healthCheck: HealthCheck = new HealthCheck();

    public freeezedPixels: { [key: number]: number } = {};
    private freezeTimers: { [key: number]: NodeJS.Timeout } = {};
    private freezeOverdraw: { [key: number]: Pixel[] } = {};
    private updatesPixel: Pixel[] = [];

    /**
     * Наше загруженное изображение в пикселях
     */
    // public myPixels = {};
    public arPixels: Pixel[] = [];

    /**
     * Состояние заргузки оригинального полотна
     */
    public originalFieldLoadingState: LoadingState = LoadingState.NONE;

    /**
     * Текущии изменения всего поля получаемые через WebSocket
     */
    public mainCanvas: Record<number, number> = {};

    /**
     * ID главного слушателя сокета
     */
    public mainListenerId = null;

    /**
     * Loop TTL
     */
    public loopTtl: number = 3e3;

    public battleState: BattleState = BattleState.NONE;

    constructor() {
        this.loop().then();
    }

    public async addWarrior(payload: VKUserParams) {
        const warrior = new WarriorAccount(payload);
        const loaded = await warrior.start();

        if (!loaded) {
            log.warn(`Failed start @${warrior.userId}`);
            return null;
        }

        if (this.warriors.has(warrior.userId)) {
            log.warn(`This warrior already added @${warrior.userId}`);
            return null;
        }

        this.warriors.set(warrior.userId, warrior);
        // this.Go();
        return warrior;
    }

    /**
     * Попытка установить ID главного слушателя сокета (check Main WebSocket Listener)
     */
    public checkMWSL(userId: number) {
        // Ессли это текущий и он не подключен
        if (this.mainListenerId == userId && this.warriors.has(userId) && !this.warriors.get(userId).connected) {
            for (const [userId, acc] of this.warriors.entries()) {
                if (acc.connected) {
                    this.mainListenerId = userId;
                    return true;
                }
            }
        }
        // Этот активен и он стал главным
        else if (userId < this.warriors.size && this.warriors.has(userId) && this.warriors.get(userId).connected) {
            this.mainListenerId = userId;
            return true;
        }
        // Если ничего не остается как этот
        else if (
            !this.mainListenerId ||
            (this.warriors.has(this.mainListenerId) && !this.warriors.get(this.mainListenerId).connected)
        ) {
            this.mainListenerId = userId;
            return true;
        }

        return false;
    }

    public sayOnline(usersOnline: number) {
        if (Date.now() - this.lastSayOnline > 30e3) {
            log /* .info */.bgDarkGray(`Online: ${usersOnline} users`);
            this.drawStatus();
            this.lastSayOnline = Date.now();
        }
    }

    public drawStatus() {
        log.debug.bgDarkGray(`Connected [${this.connectedWarriors.size}/${this.warriors.size}]`);
        log.debug.bgDarkGray(`Alive [${this.aliveWarriors.size}/${this.connectedWarriors.size}]`);
    }

    public Go() {
        this.battleState = BattleState.DRAWING;
    }

    public Stop() {
        this.battleState = BattleState.WAIT;
    }

    public onNewPixel(pixel: Pixel) {
        this.healthCheck.onPixel(pixel);
        // this.drawPixel(pixel);

        if (this.isFreeze(pixel.x, pixel.y)) {
            if (!this.freezeOverdraw[pixel.offset]) {
                this.freezeOverdraw[pixel.offset] = [pixel];
            }
            this.freezeOverdraw[pixel.offset].push(pixel);
        } else {
            if (this.originalFieldLoadingState === LoadingState.LOADED) {
                this.drawPixel(pixel);
            } else {
                this.updatesPixel.push(pixel);
                // this.overDrawDot(e, t, n, a) &&
                //     PixelFlag.NONE === pixel.flag &&
                //     this.store.dispatch(Object(_modules_EventList__WEBPACK_IMPORTED_MODULE_11__.m)(a, e, t));
            }
        }

        if (pixel.flag === PixelFlag.FREZE || pixel.flag === PixelFlag.FREZE_CENTER) {
            let timeMs = Date.now() + Pixel.FREEZE_TIME;
            this.freeezedPixels[pixel.offset] = timeMs;
            this.setTimerForUpdateFreeze(timeMs);
        }
    }

    public drawPixel(pixel: Pixel) {
        this.mainCanvas[pixel.offset] = pixel.colorId;
    }

    public unsetPixel(pixel: Pixel) {
        this.mainCanvas[pixel.offset] = -1;
    }

    public setTimerForUpdateFreeze(timeMs: number) {
        const timerId = timeMs - (timeMs % 1e3) + 1e3;
        if (this.freezeTimers[timerId]) {
            return;
        }

        this.freezeTimers[timerId] = setTimeout(() => {
            delete this.freezeTimers[timerId];

            const nowMs = Date.now();
            let pixelOffsets = [];

            Object.keys(this.freeezedPixels).forEach((pixelOffset) => {
                if (this.freeezedPixels[pixelOffset] <= nowMs) {
                    pixelOffsets.push(pixelOffset);
                }
            });

            pixelOffsets.forEach((pixelOffset) => {
                delete this.freeezedPixels[pixelOffset];
                if (this.freezeOverdraw[pixelOffset]) {
                    // log.debug('Freeze overdraw:', pixelOffset);
                    this.freezeOverdraw[pixelOffset].forEach((pixel) => {
                        this.drawPixel(pixel);
                    });
                }
                delete this.freezeOverdraw[pixelOffset];
            });

            // this.store.dispatch(Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.E)());
            // window.requestAnimationFrame(redraw);
        }, Math.max(timerId - Date.now(), 500));
    }

    public async loadFieldData(account: WarriorAccount) {
        this.originalFieldLoadingState = LoadingState.LAODING;

        try {
            log.info.green('Try load original field');
            const response = this.fetchFieldData(account);
            const pixelsData = response.toString().substr(0, Pixel.MAX_WIDTH * Pixel.MAX_HEIGHT);

            for (let y = 0; y < Pixel.MAX_HEIGHT; y++) {
                for (let x = 0; x < Pixel.MAX_WIDTH; x++) {
                    const color = colorIndexDecode[pixelsData[y * Pixel.MAX_WIDTH + x]];
                    this.onNewPixel(new Pixel({ x: x, y: y, colorId: color }));
                }
            }

            log.info.green('Origin field loaded');

            const pixelsFreez = response.toString().substr(Pixel.MAX_WIDTH * Pixel.MAX_HEIGHT);

            if (pixelsFreez) {
                try {
                    JSON.parse(pixelsFreez).forEach((sData) => {
                        if (!Array.isArray(sData) || sData.length < 1) {
                            return;
                        }

                        /* slicedToArray(t, 2) */
                        let [offsetData, timeToFreez] = sData[0];
                        let { x, y } = Pixel.unOffset(offsetData);

                        // console.log('Freez', { x, y }, timeToFreez);

                        Pixel.createFreeze(x, y).forEach((t) => {
                            this.freeezedPixels[Pixel.offset(t.x, t.y)] = timeToFreez;
                        });
                        this.setTimerForUpdateFreeze(timeToFreez);
                    });
                } catch (r) {
                    console.error(r);
                }
            }

            /* window.Uint8ClampedArray && window.ImageData
                ? Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.i)(pixelsData, this.context)
                : Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.h)(pixelsData, this.context); */

            this.updatesPixel.forEach((pixel) => {
                this.drawPixel(pixel);
            });
            this.updatesPixel = [];

            this.originalFieldLoadingState = LoadingState.LOADED;
        } catch (error) {
            log.error('Failed laod main field', error);
            account.reconnect();
            this.originalFieldLoadingState = LoadingState.NONE;
        }
    }

    private async fetchFieldData(account: WarriorAccount, rety: number = 0) {
        const retryTime = 2;
        const url = `${account.dataUrl}?ts=${new Date().getMinutes()}-${new Date().getHours()}`;
        try {
            const { response, data, error } = await account.api.requestCustom('GET', url);

            if (error) {
                throw new Error(error.msg);
            }

            if (response.status !== 200) {
                if (rety < retryTime) {
                    await sleep(1e3 * Math.random() + 100);
                    return await this.fetchFieldData(account, rety + 1);
                }

                throw new Error(`Bad status ${response.status} for data url: ${url}`);
            }

            // log.info('Data field size', data.toString().length);

            if (data.toString().length >= Pixel.MAX_WIDTH * Pixel.MAX_HEIGHT) {
                return data;
            }

            if (rety < retryTime) {
                await sleep(1e3 * Math.random() + 100);
                return await this.fetchFieldData(account, rety + 1);
            }

            throw new Error(
                `Bad response length, expect: ${Pixel.MAX_WIDTH * Pixel.MAX_HEIGHT} got ${data.toString().length}`
            );
        } catch (error) {
            this.originalFieldLoadingState = LoadingState.ERROR;
            throw new Error(`fetch bitmap data from ${url} error: ${error.message}`);
        }
    }

    /**
     * Цикл для отрисовки шаблона
     */
    private async loop() {
        while (true) {
            try {
                if (this.battleState !== BattleState.DRAWING) {
                    await sleep(this.loopTtl);
                    continue;
                }

                const aliveWarriors = this.aliveWarriors;
                if (!aliveWarriors.size) {
                    // TODO: сделать расчет до ближайшего выхода в бой
                    await sleep(this.loopTtl);
                    continue;
                }

                log('[LOOP] aliveWarriors', aliveWarriors.size);

                const warriors = aliveWarriors.entries();

                // const pixelsKeys = Object.keys(this.myPixels).sort(() => Math.random() - 0.5);
                // log.bright.info('pixelsKeys', pixelsKeys.length);

                /* for (const pixelId of pixelsKeys) {
                    const { x, y } = Pixel.unOffset(parseInt(pixelId, 10));
                    const color = this.myPixels[pixelId];
                    if (this.mainCanvas[pixelId] === color) {
                        continue;
                    } */

                const pixels = this.arPixels.sort(
                    () => Math.random() - 0.5
                ); /* .sort((a, b) => (rand(0, 10) > 6 ? 1 : b.importance - a.importance)) */

                for (const pixel of pixels) {
                    if (this.mainCanvas[pixel.offset] === pixel.colorId || this.isFreeze(pixel.x, pixel.y)) {
                        continue;
                    }

                    const { value, done } = warriors.next();
                    if (done) {
                        log.info.yellow('Warriors ended, waiting for new...');
                        break;
                    }
                    const [userId, warrior] = value as [number, WarriorAccount];

                    this.mainCanvas[pixel.offset] = pixel.colorId;
                    // this.mainCanvas[pixelId] = color;
                    // const pixel = new Pixel({ x: x, y: y, colorId: color });
                    warrior.sendPixel(pixel);
                    warrior.log.debug('Draw to', pixel.toString());

                    await sleep(50);
                }
                // ...

                await sleep(this.loopTtl * Math.random() + 5e3);
            } catch (error) {
                log.error('Loop error', error);
            }
        }
    }

    get aliveWarriors(): Map<number, WarriorAccount> {
        let warriorsMap = new Map();

        for (const [userId, acc] of this.warriors.entries()) {
            if (acc.connected && acc.isAlive && !acc.isMainListener) {
                warriorsMap.set(userId, acc);
            }
        }

        return warriorsMap;
    }

    get connectedWarriors(): Map<number, WarriorAccount> {
        let warriorsMap = new Map();

        for (const [userId, acc] of this.warriors.entries()) {
            if (acc.connected) {
                warriorsMap.set(userId, acc);
            }
        }

        return warriorsMap;
    }

    isFreeze(x: number, y: number) {
        return this.freeezedPixels[Pixel.offset(x, y)] > Date.now();
    }
}

const BattleField = new CBattleField();
export default BattleField;
