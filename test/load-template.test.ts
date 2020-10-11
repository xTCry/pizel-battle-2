import Fs from 'fs-extra';
import { createCanvas, loadImage } from 'canvas';
import { Pixel } from '../src/Pixel/Pixel';
import { log } from '../src/logger';

let myPixels = {};

const startLoadImage = async () => {
    let canvas = createCanvas(Pixel.MAX_WIDTH, Pixel.MAX_HEIGHT);

    const ctx = canvas.getContext('2d');

    let src: string | Buffer = null;
    if (Fs.existsSync('./data/template.png')) {
        src = await Fs.readFile('./data/template.png');
        log.info('Try load saved drawn file...');
    }

    if (!src) {
        throw new Error('Source image has not been empty!');
    }

    try {
        const resultImg = await loadImage(src!);
        log.info(`Image loaded`);

        const { width, height } = resultImg;
        canvas.width = width;
        canvas.height = height;

        const argsc = [0, 0, canvas.width, canvas.height];
        ctx.drawImage(resultImg, ...argsc);
        // @ts-ignore
        const { data: img } = ctx.getImageData(...argsc);

        log.info(`IMG size: ${img.length} pixels`);

        log.info('colorMapByteArray', Pixel.colorMapByteArray);
        
        for (let i = 0; i < img.length; i += 4) {
            // Skip Alpha channel
            if (img[i + 3] === 0) {
                continue;
            }

            const x = ((i / 4) % width) + 1;
            const y = ~~(i / 4 / width) + 1;
            const colorID = Pixel.findColorIDbyColor([img[i], img[i + 1], img[i + 2]]);
            log.info('colorID', colorID, [img[i], img[i + 1], img[i + 2]]);

            if (colorID >= 0) {
                myPixels[Pixel.offset(x, y)] = colorID;
            }
        }

        log.info(`Loaded ${Object.keys(myPixels).length} pixels`);

        log.info('myPixels', myPixels);
    } catch (error) {
        log.error('Load drawn image failed');
        console.error(error);
    }
};

startLoadImage().then();