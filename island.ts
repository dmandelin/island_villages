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
    readonly village: Village;
    protected year_: number = 1;

    get year(): number { return this.year_; }

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
                this.village = new Village(100);
                this.tiles[x][y].addVillage(this.village);
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

    get produce(): number {
        return Math.min(this.pop, 300);
    }
}

const svgNamespace = "http://www.w3.org/2000/svg";

class View {
    protected readonly svg: HTMLElement;
    
    readonly panel: HTMLElement;
    readonly widgets: TextWidget[];

    constructor() {
        this.panel = document.getElementById('panel')!;
        this.widgets = [
            new TextWidget(this, 'Year', () => island.year, ' '),
            new TextWidget(this, 'Population', () => island.village.pop),
            new TextWidget(this, 'Produce', () => island.village.produce),
        ];

        this.svg = document.getElementById('map')!;
        const tileSize = 50;
        const borderSize = 1;

        let village: Village|undefined = undefined;
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
                    village = tile.village;
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

class TextWidget {
    readonly div: HTMLDivElement;

    constructor(protected readonly view, 
        protected readonly label: string, protected readonly supplier: () => number|string,

        sep = ': ') {
        this.div = document.createElement('div');
        this.div.innerText = `${label}${sep}${supplier()}`;
        view.panel.appendChild(this.div);
    }
}

class Controller {
    bind(elementId:string, event: string, fn: () => void) {
        document.getElementById(elementId)?.addEventListener(event, fn);
    }

    step() {
        console.log('step');
    }
}

// ---------------------------------- Setup ----------------------------------

const island = new Island(10, 10);
const view = new View();
const controller = new Controller();

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowRight':
            controller.step();
    }
});

controller.bind('step', 'click', controller.step)

// ---------------------------- Library functions ----------------------------

function randRange(a: number, b: number) {
    return Math.floor(Math.random() * (b - a))
}

