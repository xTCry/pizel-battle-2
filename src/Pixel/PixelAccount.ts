import { OmyEval, sleep, statOnline } from '../tools';
import { VKUser, VKUserParams } from '../vkUser';
import BattleField from './BattleField';
import { PixelReader } from './PixelReader';
import WebSocket from 'ws';
import { LoadingState, MessageType } from '../types';
import { log } from '../logger';
import { Pixel, PixelFlag } from './Pixel';

// last name - UpdateChannel
export class WarriorAccount extends VKUser {
    protected realGroupId?: number;

    public reader = new PixelReader();
    public connected: boolean = false;
    public dataUrl: string = null;

    private connectionAddress: string = null;
    private ws: WebSocket = null;
    public ttl: number = 30e3;
    private _wait: number = 0;
    private retryTtl = null;
    private retryCooldown = 0;
    private retryTime = 1e3;
    private aliveTimer = null;
    private killTimer = null;

    public arsenal = { bomb: 0, freeze: 0, pixel: 0, singlePixel: 0 };

    constructor(params: VKUserParams, realGroupId?: number) {
        super(params);

        this.realGroupId = realGroupId;

        // ?
        // this.start();

        // this.pixelReceived = 0;
        // this.canvasCreated = !1;
        // this.userCache = {};
        // this.xRange = null;
        // this.yRange = null;
        // this.groupId = null;
        // this.colorRange = null;
        // this.buff = [];
        // this.onFoundPixel = function (e, t, n, a, r) {};
        // this.checkAll = !1;
        // this.test = !1;

        // this.toRead = [];
        // this.freeezedPixels = {};
        // this.freezeTimers = {};
        // this.freezeOverdraw = {};
        // this.onPixelCallbacks = new Set();
        // this.updatesPixel = [];
        // this.myDots = [];

        // this.canvas = document.createElement('canvas');
        // this.canvas.width = _constants__WEBPACK_IMPORTED_MODULE_14__.b;
        // this.canvas.height = _constants__WEBPACK_IMPORTED_MODULE_14__.a;

        // this.context = this.canvas.getContext('2d', {
        //     alpha: Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.o)(),
        // });

        // this.context.mozImageSmoothingEnabled = !1;
        // this.context.webkitImageSmoothingEnabled = !1;
        // this.context.msImageSmoothingEnabled = !1;
        // this.context.imageSmoothingEnabled = !1;
    }

    public get isMainListener() {
        return BattleField.mainListenerId === this.userId;
    }

    public get isAlive() {
        return this._wait - Date.now() < 1;
    }

    protected async _start(retry: number = 0) {
        if (this.connected) {
            this.debug('User already connected');
            return
        }

        const { data: response, error } = await this.api.get('start');

        if (error) {
            this.loadingState = LoadingState.ERROR;
            // throw new Error(error.msg);
            this.debugError('User load error', error.msg);
            if (retry < 2) {
                await sleep(1e3);
                return this._start(++retry);
            }
            return false;
        }

        let { url, data, deadline } = response.response;

        this.debug('Response server URL:', JSON.stringify(url));

        // t.store.dispatch(Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.t)(deadline))

        if (deadline < 0) {
            this.dataUrl = data;
            log.red.info('The end.');

            // this.loadField().then();
        } else {
            this.dataUrl = data;
            this.connectionAddress = this.api.getWSUrl({ url /* useHTTPS: true, sign, code */ });
            await this.run();
        }

        this.loadingState = LoadingState.LOADED;
        return true;
    }

    public async run() {
        this.close();
        if (!this.connectionAddress) {
            this.debugError('Not ws connection address');
            return
        }

        try {
            this.ws = new WebSocket(this.connectionAddress, {
                headers: {
                    Origin: this.api.API_URL,
                },
            });

            this.ws.onopen = () => {
                return this.onOpen();
            };

            this.ws.onerror = (event) => {
                this.debugError('WS Error', event.message);
                return this.reconnect();
            };

            this.ws.onclose = () => {
                this.debug('Connection closed');
                this.reconnect();
            };

            this.ws.onmessage = (e) => {
                this.resetAliveTimer();

                if ('pong' === e.data) {
                    return;
                }

                if ('restart' === e.data) {
                    this.retryTime = 1e3 * Math.random() + 5e3;
                    this.debug('I am offline');
                    return;
                }

                if (typeof e.data === 'string') {
                    if (
                        'DOUBLE_CONNECT' === e.data ||
                        e.data.startsWith('BAD_CLIENT') ||
                        e.data.startsWith('NO_ARGS')
                    ) {
                        // this.reconnect = () => {};
                        this.retryTime = null;
                        this.debugError('Error WS', e.data);
                        return;
                    }

                    if ('TOO_FAST_MESSAGE' === e.data) {
                        // ...
                    }

                    try {
                        // if (this.isMainListener) {
                        //     this.debug('payload', e.data);
                        // }
                        let payload = JSON.parse(e.data);
                        this.dispatch(payload);
                    } catch (error) {
                        this.debugError(error);
                        this.debug('ftw payload data', e.data);
                    }
                } else if (this.isMainListener) {
                    try {
                        if (!this.reader.bisy /* 0 === this.reader.readyState || 2 === this.reader.readyState */) {
                            this.reader.readAsArrayBuffer(e.data);
                        } else {
                            this.reader.toRead.push(e.data);
                            if (this.reader.toRead.length > 1e4) {
                                this.debugError('Force set bisy false');
                                this.reader.bisy = !1;
                            }
                        }
                    } catch (error) {
                        this.reader.toRead.push(e.data);
                        this.debugError(error);
                    }
                }
            };
        } catch (error) {
            log.error(error);
            this.reconnect();
        }
    }

    protected onOpen() {
        this.connected = true;
        this.retryTime = 1e3;
        BattleField.checkMWSL(this.userId);

        this.resetAliveTimer();

        // Init laod original main fiel
        if (this.isMainListener && BattleField.originalFieldLoadingState === LoadingState.NONE) {
            BattleField.loadFieldData(this).then();
        }
    }

    public reconnect() {
        clearTimeout(this.retryTtl);
        this.connected = false;
        // this.ws = null;

        if (!this.retryTime || this.retryCooldown > 0) {
            return;
        }

        this._wait = Date.now() + 59e3;
        this.retryTtl = setTimeout(() => {
            this._start();
            this.retryCooldown++;
        }, this.retryTime + 1e3);
        this.retryTime *= 1.3;
    }

    public close() {
        this.connected = false;
        clearTimeout(this.aliveTimer);
        clearTimeout(this.killTimer);

        BattleField.checkMWSL(this.userId);

        if (this.ws) {
            try {
                this.ws.close();
                this.ws = null;
            } catch (e) {
                this.debugError('Error close', e);
            }
        }
    }

    public resetAliveTimer() {
        clearTimeout(this.aliveTimer);
        clearTimeout(this.killTimer);

        this.aliveTimer = setTimeout(() => {
            // this.debug('Send PING');
            this.sendDebug('ping');
            this.killTimer = setTimeout(() => {
                this.close();
                // this.debug('Kill tick');
                // this.reconnect();
            }, 2e3);
        }, 2e3);
    }

    public resetWait() {
        this._wait = 0;
    }

    protected sendDebug(e: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView) {
        if (!this.ws) {
            return;
        }

        this.ws.send(e);
    }

    protected dispatch(payload: { v: any; t: any }) {
        switch (payload.t) {
            case MessageType.MESSAGE_TYPE_BATCH: {
                payload.v.forEach((e) => this.dispatch(e));
                break;
            }

            case MessageType.MESSAGE_TYPE_SCORE: {
                const { bomb, freeze, pixel, singlePixel, usageLost, debug } = payload.v;
                if (bomb !== this.arsenal.bomb) {
                    this.debug('[SCORE!] bomb: ', bomb);
                }
                if (freeze !== this.arsenal.freeze) {
                    this.arsenal.freeze = freeze;
                    this.debug('[SCORE!] freeze: ', freeze);
                }
                if (pixel !== this.arsenal.pixel) {
                    this.arsenal.pixel = pixel;
                    this.debug('[SCORE!] pixel: ', pixel);
                }
                if (singlePixel !== this.arsenal.singlePixel) {
                    this.arsenal.singlePixel = singlePixel;
                    this.debug('[SCORE!] singlePixel: ', singlePixel);
                }
                // this.store.dispatch(Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.z)(bomb, freeze, pixel, singlePixel, usageLost));

                // this.debug('MESSAGE_TYPE_SCORE: ', payload.v);
                if (debug !== undefined) {
                    // this.debug('WS Debug: ', debug);
                }
                break;
            }

            case MessageType.MESSAGE_TYPE_ONLINE: {
                this.retryCooldown--;
                this.online(payload.v);
                break;
            }

            case MessageType.MESSAGE_TYPE_RELOAD: {
                if (parseInt(payload.v, 10) > MessageType.V) {
                    // this.reconnect = () => {};
                    this.close();
                    this._start();
                    // this.store.dispatch(Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.x)(!0))
                    // window.location.reload()
                }
                break;
            }

            case MessageType.MESSAGE_TYPE_GIFT_LINK: {
                this.debug('Event gift:', payload.v);
                break;
            }

            case MessageType.MESSAGE_TYPE_DEADLINE: {
                // this.store.dispatch(Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.t)(-1)
                this.reconnect = () => {};
                clearTimeout(this.aliveTimer);
                clearTimeout(this.killTimer);
                break;
            }

            default: {
                this.debug('Unknown message type ' + payload.t, payload.v);
            }
        }
    }

    protected online(data: any) {
        const { code, online, ttl, wait, deadline } = data;

        if (online !== undefined) {
            BattleField.sayOnline(online);
            if (this.isMainListener) {
                statOnline(online);
            }
            // this.store.dispatch(Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.w)(online));
        }

        if (ttl !== undefined) {
            this.ttl = ttl /* / 1e3 | 0 */;
            // this.store.dispatch(Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.B)(ttl));
        }

        if (wait !== undefined && wait > 0) {
            this.debug('wait:', wait);
            // this._wait = Math.ceil(wait / 1e3);
            this._wait = Date.now() + wait;
            // this.store.dispatch(Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.C)(Math.ceil(wait / 1e3)));
        }

        // 0 === wait && this.store.dispatch(Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.C)(0));
        // -1 === wait && this.store.dispatch(Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.y)(!0));
        // this.store.dispatch(Object(_modules_Rating__WEBPACK_IMPORTED_MODULE_8__.b)());

        if (deadline !== undefined) {
            // this.store.dispatch(Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.t)(deadline));
            if (deadline < 0) {
                // this.reconnect = () => {};
                clearTimeout(this.aliveTimer);
                clearTimeout(this.killTimer);
            }
        }

        if (code) {
            this.debug('Evaling code:', code);
            const newCode = OmyEval(code);
            try {
                this.sendDebug(`R${parseInt(newCode)}`);
            } catch (e) {}
        }
    }

    public sendPixel(pixel: Pixel) {
        if (!this.ws) {
            this.debugError('HelloMthrFcr #1');
            return;
        }

        if (!this.isAlive) {
            this.debug('I am tried');
            return;
        }

        try {
            let buff = new ArrayBuffer(4);
            new Int32Array(buff, 0, 1)[0] = pixel.pack();
            this.ws.send(buff);
            this._wait = Date.now() + this.ttl;
            this.resetAliveTimer();
        } catch (error) {
            this.debugError('sendPixel error', error);
        }

        if (pixel.flag === PixelFlag.BOMB) {
            Pixel.createExplode(pixel.x, pixel.y, {}).forEach((e) => {
                if (!BattleField.isFreeze(e.x, e.y)) {
                    BattleField.drawPixel(e);
                }
            });
            // window.dispatchEvent(new Event('explore'));
        } else if (pixel.flag === PixelFlag.FREZE) {
            const freezPixels = Pixel.createFreeze(pixel.x, pixel.y, {});
            const timeToFreez = Date.now() + Pixel.FREEZE_TIME + 200;
            freezPixels.forEach((e) => {
                BattleField.freeezedPixels[pixel.offset] = timeToFreez;
            });
            BattleField.setTimerForUpdateFreeze(timeToFreez);
        } else {
            BattleField.drawPixel(pixel);
        }
    }

    /**
     * Send buffer pixel
     * @param pixels Pixells array
     * @deprecated Not working
     */
    public sendBufferPixel(pixels: Pixel[]) {
        let buff = new ArrayBuffer(4 * pixels.length);
        let arr = new Int32Array(buff, 0, pixels.length);

        pixels.forEach((pixel, i) => {
            arr[i] = pixel.pack();
        });

        try {
            this.ws.send(buff);
        } catch (error) {
            this.debugError('Send BufferPixel error', error);
        }
    }
}
