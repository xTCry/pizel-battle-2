import { Pixel } from '../src/Pixel/Pixel';
import { rand } from '../src/tools';

async function start() {
    let arPixels: Pixel[] = [];

    for (let i = 0; i < 15; ++i) {
        let x = i * 5;
        let y = i * 2 + 5;
        let colorId = rand(0, 25);
        let importance = rand(0, 5) !== 3 ? i % 2 : 255;

        arPixels.push(new Pixel({ x, y, colorId, importance }));
    }

    console.log(
        'arPixels\n',
        arPixels.map((e) => `[${e.x};\t${e.y};\t${e.colorId};]\t ${e.importance}`).join('\n')
    );

    arPixels.sort((a, b) => (rand(0, 5) === 3 ? 1 : b.importance - a.importance));

    console.log(
        'arPixels sorted\n',
        arPixels.map((e) => `[${e.x};\t${e.y};\t${e.colorId}]\t ${e.importance}\t ${e.offset}`).join('\n')
    );
}

start().then();
