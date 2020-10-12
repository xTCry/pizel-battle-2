import { toArrayBuffer } from '../tools';
import BattleField from './BattleField';
import { Pixel } from './Pixel';

export class PixelReader {
    public bisy: boolean = false;
    public toRead: any[] = [];

    readAsArrayBuffer(buffer_: Buffer | ArrayBuffer | Buffer[]) {
        this.bisy = true;
        try {
            const buffer = toArrayBuffer(buffer_);
            const len = buffer.byteLength / 4;
            const data = new Int32Array(buffer, 0, len);

            const cell_amount = Math.floor(len / 3);

            for (let i = 0; i < cell_amount; i++) {
                const newPixel = Pixel.unpack(data[3 * i], data[1 + 3 * i], data[2 + 3 * i]);
                BattleField.onNewPixel(newPixel);
            }

            if (this.toRead.length > 0) {
                const blobRows = this.toRead.shift();
                this.readAsArrayBuffer(blobRows);
            } else {
                this.bisy = false;
            }
            return true;
        } catch (err) {
            this.bisy = false;
        }
        return false;
    }
}
