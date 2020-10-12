import Fs from 'fs-extra';
import Path from 'path';
import chokidar from 'chokidar';
import { Canvas, createCanvas, loadImage } from 'canvas';
import { config } from './config';
import { rand } from './tools';
import BattleField from './Pixel/BattleField';
import { Pixel } from './Pixel/Pixel';
import { LoadingState } from './types';
import { log } from './logger';

export class CTemplateField {
    public loadingState = LoadingState.NONE;
    public path2file = './data/template.png';
    // private lastSRC: string = null;
    private cooldown: number = 0;

    constructor() {}

    public async loadTemplateField(_IMG_URL?: string) {
        if (Date.now() - this.cooldown <= 10 * 1e3 || this.loadingState === LoadingState.LAODING) {
            return false;
        }

        this.cooldown = Date.now();
        this.loadingState = LoadingState.LAODING;

        // Загружаемое изображение
        const canvas: Canvas = createCanvas(Pixel.MAX_WIDTH, Pixel.MAX_HEIGHT);
        const ctx = canvas.getContext('2d');

        let src: string | Buffer = null;

        const IMG_URL = _IMG_URL || config.get('IMG_URL');
        if (IMG_URL) {
            src = `${IMG_URL}?r=${rand(11111, 199999)}`;
        } else if (Fs.existsSync(this.path2file)) {
            src = await Fs.readFile(this.path2file);
            log.info('Try load saved drawn file...');
        }

        if (!src) {
            throw new Error(`Source image has not been empty! Try save new image to ${this.path2file}`);
        }

        try {
            const resultImg = await loadImage(src, {
                timeout: 180e3
            });
            log.info('Image loaded');

            const { width, height } = resultImg;
            canvas.width = width;
            canvas.height = height;

            const argsc = [0, 0, canvas.width, canvas.height];
            ctx.drawImage(resultImg, ...argsc);
            // @ts-ignore
            const { data: img } = ctx.getImageData(...argsc);

            log.info(`Template field size: ${img.length} pixels`);

            // let myPixels = {};
            let arPixels = [];
            for (let i = 0; i < img.length; i += 4) {
                // Skip Alpha channel
                if (img[i + 3] === 0) {
                    continue;
                }

                const x = ((i / 4) % width) + 1;
                const y = ~~(i / 4 / width) + 1;
                const colorId = Pixel.findColorIDbyColor([img[i], img[i + 1], img[i + 2]]);
                const importance = img[i + 3];

                // TODO: Сделать поиск по приблизительному цвету, если такой не был найден
                if (colorId >= 0) {
                    arPixels.push(new Pixel({ x, y, colorId, importance }));
                    // myPixels[Pixel.offset(x, y)] = colorId;
                }
            }

            log.info.green(`Loaded ${arPixels.length} pixels`);
            BattleField.arPixels = arPixels;

            // log.info(`Loaded ${Object.keys(myPixels).length} pixels`);
            // BattleField.myPixels = myPixels;

            this.loadingState = LoadingState.LOADED;
            return true;
        } catch (error) {
            log.error('Load drawn image failed', error);
            this.loadingState = LoadingState.ERROR;
        }
        return false;
    }

    public watchFolder(folder: string) {
        try {
            log.info(`Watching for folder changes on: ${folder}`);

            const watcher = chokidar.watch(folder, { persistent: true });
            watcher.on('change', async (filePath) => {
                if (Path.basename(filePath) === this.fileName) {
                    log.info(`${filePath} has been changed.`);
                    this.loadTemplateField();
                }
            });
        } catch (error) {
            log.error(error);
        }
    }

    public get fileName(): string {
        return Path.basename(this.path2file);
    }
}

const TemplateField = new CTemplateField();
export default TemplateField;
