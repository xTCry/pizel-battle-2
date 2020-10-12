import {Pixel} from '../src/Pixel/Pixel'

const response = '4444[[300721,1602492975452],[10017,1602492979163],[466974,1602492982650],[32245,1602492994123]]';

const MAX_WIDTH = 2;
const MAX_HEIGHT = 2;

const pixelsFreez = response.toString().substr(MAX_WIDTH * MAX_HEIGHT);

if (pixelsFreez) {
    try {
        JSON.parse(pixelsFreez).forEach((t) => {
            let sData = Array.isArray(t) ? t : []; /* slicedToArray(t, 2) */
            let offsetData = sData[0];
            let timeToFreez = sData[1];
            let { x, y } = Pixel.unOffset(offsetData);

            console.log('Freez', { x, y }, timeToFreez);

            Pixel.createFreeze(x,y, {}).forEach((t)=> {
                // this.freeezedPixels[Pixel.offset(t.x, t.y)] = timeToFreez;
            });
            // this.setTimerForUpdateFreeze(r);
        });
    } catch (r) {
        console.error(r);
    }
}
