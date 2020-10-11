import { Pixel } from './Pixel';
import { WarriorAccount } from './PixelAccount';

export class HealthCheck {
    private map: Map<Pixel['hash2'], WarriorAccount> = new Map();

    public onPlace(pixel: Pixel, warrior: WarriorAccount) {
        this.map.set(pixel.hash2, warrior);
    }

    public onPixel(pixel: Pixel) {
        if (this.map.has(pixel.hash2)) {
            this.map.delete(pixel.hash2);
        }
    }

    public check(pixel: Pixel) {
        if (this.map.has(pixel.hash2)) {
            this.map.delete(pixel.hash2);
            return false;
        }
        return true;
    }
}
