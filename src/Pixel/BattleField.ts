import { rand, sleep } from '../tools';
import { colorIndexDecode, Pixel } from './Pixel';
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
    protected warriors: Map<number, WarriorAccount> = new Map();

    private lastSayOnline = 0;

    private healthCheck: HealthCheck = new HealthCheck();

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

    // в данный момент процесс зарисовки? (последнее время)
    public InPocess = 0;

    public typeDraw = 1; // 1 - protect, 2 - spam

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

    public sayOnline(e: number) {
        if (Date.now() - this.lastSayOnline > 30e3) {
            log /* .info */.bgDarkGray(`Online: ${e} users`);
            log /* .info */.bgDarkGray(`Alive [${this.aliveWarriors.size}/${this.warriors.size}]`);
            log /* .info */.bgDarkGray(`Connected [${this.connectedWarriors.size}/${this.warriors.size}]`);
            this.lastSayOnline = Date.now();
        }
    }

    public Go() {
        this.battleState = BattleState.DRAWING;
    }

    public Stop() {
        this.battleState = BattleState.WAIT;
    }

    public onNewPixel(pixel: Pixel) {
        this.healthCheck.onPixel(pixel);
        this.mainCanvas[pixel.offset] = pixel.colorId;
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

            // const pixelsFreez = response.toString().substr(PixelCC.MAX_WIDTH * PixelCC.MAX_HEIGHT);

            /* if (pixelsFreez) {
                try {
                    Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.g)(pixelsFreez);
                    JSON.parse(pixelsFreez).forEach(function (t) {
                        var n = Object(
                                _Users_i_nedzvetskiy_projects_pixel_frontend_node_modules_babel_preset_react_app_node_modules_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__.a
                            )(t, 2),
                            a = n[0],
                            r = n[1],
                            o = Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.x)(a),
                            i = o.x,
                            c = o.y;
                        _Pixel__WEBPACK_IMPORTED_MODULE_7__.a.createFreeze(i, c, {}).forEach(function (t) {
                            this.freeezedPixels[Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.r)(t.x, t.y)] = r;
                        });
                        this.setTimerForUpdateFreeze(r);
                    });
                } catch (r) {
                    Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.f)(r);
                }
            } */

            /* window.Uint8ClampedArray && window.ImageData
                ? Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.i)(pixelsData, this.context)
                : Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.h)(pixelsData, this.context);

            account.updatesPixel.forEach((t) => {
                var n = t.x,
                    a = t.y,
                    r = t.color;
                this.drawPixel(n, a, r);
            }); */

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

                const pixels = this.arPixels.sort((a, b) => (rand(0, 5) === 3 ? 1 : b.importance - a.importance));

                for (const pixel of pixels) {
                    if (this.mainCanvas[pixel.offset] === pixel.colorId) {
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
                    const pixel2 = new Pixel({ x: pixel.x, y: pixel.y, colorId: pixel.colorId });
                    warrior.sendPixel(pixel2);
                    warrior.debug('Draw to', pixel2.toString());

                    await sleep(50);

                    if (true) {
                        this.healthCheck.onPlace(pixel2, warrior);
                        setTimeout(() => {
                            if (!this.healthCheck.check(pixel2)) {
                                warrior.debug('I am alive? (Pixel not ping)');
                            }
                        }, 10e3);
                    }
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
            if (acc.connected && acc.isAlive) {
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
}

const BattleField = new CBattleField();
export default BattleField;
