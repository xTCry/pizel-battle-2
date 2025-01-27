import hash from 'object-hash';
import { toInt } from '../tools';

export enum PixelFlag {
    NONE = 0,
    BOMB = 1,
    FREZE = 2,
    PIXEL = 3,
    FREZE_CENTER = 4,
    RELOAD_CHAT = 5,
    BOMB_CENTER = 7,
    PIXEL_START = 8,
    FLAG_PIXEL = 9,
}

export type ColorId = number; // keyof typeof colorIndexDecode;

export const colorIndexDecode = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    a: 10,
    b: 11,
    c: 12,
    d: 13,
    e: 14,
    f: 15,
    g: 16,
    h: 17,
    i: 18,
    j: 19,
    k: 20,
    l: 21,
    m: 22,
    n: 23,
    o: 24,
    p: 25,
};

export class Pixel {
    static MAX_WIDTH = 1590;
    static MAX_HEIGHT = 400;
    static MIN_COLOR_ID = 0;
    static MAX_COLOR_ID = 25;

    static SIZE = Pixel.MAX_WIDTH * Pixel.MAX_HEIGHT;

    static FREEZE_TIME = 3e4;
    static EXPLORE_COLOR = 4;
    static LOCK_TIME = 15e3;
    static LOCK_COUNT = 30;

    public readonly x: number;
    public readonly y: number;
    public readonly colorId: ColorId;
    public readonly flag: PixelFlag;
    public readonly userId: number;
    public readonly groupId: number;
    public readonly importance: number = 255;
    public readonly ts: number;

    constructor({
        x,
        y,
        colorId,
        userId,
        groupId,
        flag = 0,
        importance,
    }: {
        x: any;
        y: any;
        colorId: any;
        userId?: any;
        groupId?: any;
        flag?: number;
        importance?: number;
    }) {
        this.x = toInt(x);
        this.y = toInt(y);
        this.colorId = toInt(colorId) as ColorId;
        this.flag = toInt(flag, PixelFlag.NONE);
        this.userId = toInt(userId, null);
        this.groupId = toInt(groupId, null);
        this.importance = toInt(importance, null);
        this.ts = Date.now();
    }

    static createExplode = function (e, t, n) {
        return [
            new Pixel({ x: e, y: t, colorId: 11, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
            new Pixel({ x: e, y: t + 1, colorId: 16, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
            new Pixel({ x: e, y: t - 1, colorId: 16, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
            new Pixel({ x: e + 1, y: t, colorId: 16, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
            new Pixel({ x: e + 1, y: t + 1, colorId: 15, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
            new Pixel({ x: e + 1, y: t - 1, colorId: 15, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
            new Pixel({ x: e - 1, y: t, colorId: 16, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
            new Pixel({ x: e - 1, y: t + 1, colorId: 15, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
            new Pixel({ x: e - 1, y: t - 1, colorId: 15, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
            new Pixel({ x: e + 2, y: t, colorId: 15, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
            new Pixel({ x: e - 2, y: t, colorId: 15, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
            new Pixel({ x: e, y: t + 2, colorId: 15, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
            new Pixel({ x: e, y: t - 2, colorId: 15, userId: n.id, groupId: n.groupId, flag: PixelFlag.BOMB }),
        ].filter((e) => e.isValid());
    };

    static createFreeze = function (x: number, y: number, userData: { id?: number; groupId?: number } = {}) {
        return [
            new Pixel({
                x: x,
                y: y,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
            new Pixel({
                x: x,
                y: y + 1,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
            new Pixel({
                x: x,
                y: y - 1,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
            new Pixel({
                x: x + 1,
                y: y,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
            new Pixel({
                x: x + 1,
                y: y + 1,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
            new Pixel({
                x: x + 1,
                y: y - 1,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
            new Pixel({
                x: x - 1,
                y: y,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
            new Pixel({
                x: x - 1,
                y: y + 1,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
            new Pixel({
                x: x - 1,
                y: y - 1,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
            new Pixel({
                x: x + 2,
                y: y,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
            new Pixel({
                x: x - 2,
                y: y,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
            new Pixel({
                x: x,
                y: y + 2,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
            new Pixel({
                x: x,
                y: y - 2,
                colorId: Pixel.EXPLORE_COLOR,
                userId: userData.id,
                groupId: userData.groupId,
                flag: PixelFlag.FREZE,
            }),
        ].filter((e) => e.isValid());
    };

    isValidRange() {
        return (
            this.x >= 0 &&
            this.x < Pixel.MAX_WIDTH &&
            this.y >= 0 &&
            this.y < Pixel.MAX_HEIGHT &&
            this.colorId >= Pixel.MIN_COLOR_ID &&
            this.colorId < Pixel.MAX_COLOR_ID
        );
    }

    isValid() {
        return this.isValidRange();
    }

    hasFlag(e: PixelFlag) {
        return this.flag === e;
    }

    pack() {
        const t = this.colorId + this.flag * Pixel.MAX_COLOR_ID;
        return this.x + this.y * Pixel.MAX_WIDTH + Pixel.SIZE * t;
    }

    static unpack(code: number, userId: number = 0, groupId: number = 0) {
        const n = Math.floor(code / Pixel.SIZE);
        const x = (code -= n * Pixel.SIZE) % Pixel.MAX_WIDTH;
        const y = (code - x) / Pixel.MAX_WIDTH;
        const colorId = n % Pixel.MAX_COLOR_ID;
        const flag = Math.floor(n / Pixel.MAX_COLOR_ID);

        return new Pixel({ x, y, colorId, flag, userId, groupId });
    }

    static colorMap = [
        '#FFFFFF',
        '#C2C2C2',
        '#858585',
        '#474747',
        '#000000',
        '#3AAFFF',
        '#71AAEB',
        '#4a76a8',
        '#074BF3',
        '#5E30EB',
        '#FF6C5B',
        '#FE2500',
        '#FF218B',
        '#99244F',
        '#4D2C9C',
        '#FFCF4A',
        '#FEB43F',
        '#FE8648',
        '#FF5B36',
        '#DA5100',
        '#94E044',
        '#5CBF0D',
        '#C3D117',
        '#FCC700',
        '#D38301',
    ];

    static colorMapByteArray = Pixel.colorMap.map((e) => {
        const r = e.substr(1, 2);
        const g = e.substr(3, 2);
        const b = e.substr(5, 2);
        return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
    });

    //
    static findColorIDbyColor(color: [number, number, number]) {
        // return Object.keys(PixelCC.colorIndexDecode).find(e => PixelCC.colorIndexDecode[e] == index);
        return Pixel.colorMapByteArray.findIndex((e) => e[0] === color[0] && e[1] === color[1] && e[2] === color[2]);
    }

    static offset(x: number, y: number): number {
        return y * Pixel.MAX_WIDTH + x;
    }

    static unOffset(index: number) {
        return {
            x: index % Pixel.MAX_WIDTH,
            y: Math.floor(index / Pixel.MAX_WIDTH),
        };
    }

    get [Symbol.toStringTag]() {
        return `Pixel(${this.x};${this.y};${this.colorId})${this.flag ? ` ^${this.flag}` : ''}${
            this.userId ? ` @${this.userId}` : ''
        }`;
    }

    get offset() {
        return Pixel.offset(this.x, this.y);
    }

    get hash() {
        return hash({
            x: this.x,
            y: this.y,
            colorId: this.colorId,
        });
    }

    get hash2() {
        return hash({
            x: this.x,
            y: this.y,
        });
    }
}
