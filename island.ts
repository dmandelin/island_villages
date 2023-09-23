// Island villages
//
// General plan and feature list
// - Each square has some kind of diminishing returns production capacity
//   - May vary by terrain type or other factors
// - Population of villages changes according to relative production
// - If population is large, part of the village may leave to found a new village
//   - Productivity may be lowered in a new village
// Later
// - Fishing villages
// - Trade and exchange between fishing and farming villages

class Island {
    readonly tiles: Tile[][];

    constructor(readonly w: number, readonly h: number) {
        this.tiles = [];
        for (let x = 0; x < w; ++x) {
            const col: Tile[] = [];
            for (let y = 0; y < h; ++y) {
                const isWater = x == 0 || x == w - 1 || y == 0 || y == h - 1;
                col.push(new Tile(isWater));
            }
            this.tiles.push(col);
        }

        while (true) {
            const x = randRange(0, w);
            const y = randRange(0, h);
            if (this.tiles[x][y].isWater) continue;
            if (this.tiles[x-1][y]?.isWater || this.tiles[x+1][y]?.isWater || 
                this.tiles[x][y-1]?.isWater || this.tiles[x][y+1]?.isWater) {
                this.tiles[x][y].addVillage(new Village(100));
                break;
            }
        }
    }
}

class Tile {
    protected village_?: Village;

    constructor(readonly isWater) {}

    addVillage(village: Village) {
        this.village_ = village;
    }

    get village() { return this.village_; }
}

class Village {
    constructor(protected pop_: number) {
    }

    get pop() { return this.pop_; }
    protected set pop(pop: number) { this.pop_ = pop; }
}

const svgNamespace = "http://www.w3.org/2000/svg";

class View {
    protected readonly svg: HTMLElement;

    constructor() {
        this.svg = document.getElementById('map')!;

        const tileSize = 50;
        const borderSize = 1;

        island.tiles.forEach((col, x) => {
            col.forEach((tile, y) => {
                const rx = x * tileSize;
                const ry = y * tileSize;

                const rect = document.createElementNS(svgNamespace, 'rect');
                rect.setAttribute('x', String(rx));
                rect.setAttribute('y', String(ry));
                rect.setAttribute('width', String(tileSize));
                rect.setAttribute('height', String(tileSize));
                rect.setAttribute('fill', tile.isWater ? '#AEDFF7' : '#8CB39F');
                rect.setAttribute('stroke', 'lightgray');
                rect.setAttribute('stroke-width', String(borderSize));
                this.svg.appendChild(rect);

                if (tile.village) {
                    this.addVillageDot(rx + 23, ry + 23);
                    this.addVillageDot(rx + 21, ry + 27);
                    this.addVillageDot(rx + 25, ry + 27);
                }
            });
        });
    }

    protected addVillageDot(x: number, y: number) {
        const rect = document.createElementNS(svgNamespace, 'rect');
        rect.setAttribute('x', String(x));
        rect.setAttribute('y', String(y));
        rect.setAttribute('width', '3');
        rect.setAttribute('height', '3');
        rect.setAttribute('fill', '#080808');
        this.svg.appendChild(rect);
    }
}

const island = new Island(10, 10);
const view = new View();

document.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
    }
});

function randRange(a: number, b: number) {
    return Math.floor(Math.random() * (b - a))
}