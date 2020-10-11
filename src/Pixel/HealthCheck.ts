import { Pixel } from "./Pixel";
import { WarriorAccount } from "./PixelAccount";

export class HealthCheck {
    private map: Map<Pixel['hash'], WarriorAccount> = new Map();

    public onPlace(pixel: Pixel, warrior: WarriorAccount) {
        this.map.set(pixel.hash, warrior);
    }

    public onPixel(pixel: Pixel) {
        if (this.map.has(pixel.hash)) {
            this.map.delete(pixel.hash);
        }
    }

    public check(pixel: Pixel) {
        if (this.map.has(pixel.hash)) {
            this.map.delete(pixel.hash);
            return false;
        }
        return true;
    }
}