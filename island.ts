// Island villages
//
// General plan and feature list
//   - Production may vary by terrain type or other factors
// - If population is large, part of the village may leave to found a new village
//   - Productivity may be lowered in a new village
// Later
// - Fishing villages
// - Trade and exchange between fishing and farming villages

const VILLAGE_NAMES = [
    'Moku',
    'Kumu',
    'Kahiko',
    'Hikina',
    'Ho\'kahi',
];

class Island {
    readonly tiles: Tile[][];
    readonly villages: Village[] = [];
    protected year_: number = 1;

    get year(): number { return this.year_; }

    get pop() {
        return sum(this.villages.map(v => v.pop));
    }

    get lastPopChange() {
        return sum(this.villages.map(v => v.lastPopChange));
    }

    tile(x: number, y: number): Tile|undefined {
        const col = this.tiles[x];
        return col ? col[y] : undefined;
    }

    step() {
        const villages = [...this.villages];
        for (const village of villages) {
            village.step();
        }
        ++this.year_;
    }

    protected readonly moveOffsets = [
        [-2, 0], [-1, -1], [-1, 0], [-1, 1],
        [0, -2], [0, -1], [0, 1], [0, 2],
        [1, -1], [1, 0], [1, 1], [2, 0],
    ];

    generateVillageName() {
        if (VILLAGE_NAMES.length) {
            return VILLAGE_NAMES.shift();
        }
        return `Village ${this.villages.length + 1}`;
    }

    addVillage(x: number, y: number, pop: number) {
        const village = new Village(this.generateVillageName(), x, y, pop);
        this.villages.push(village);
        this.tiles[x][y].addVillage(village);
    }

    addVillageFrom(village: Village, newPop: number) {
        // Find all sites available within 1.5 tiles.
        const cands: [number, number][] = []
        for (const [dx, dy] of this.moveOffsets) {
            const x = village.x + dx;
            const y = village.y + dy;
            const tile = this.tile(x, y);
            if (tile && !tile.isWater && !tile.village) {
                cands.push([x, y]);
            }
        }

        // Choose at random.
        const pos = randElement(cands);
        if (pos) {
            this.addVillage(pos[0], pos[1], newPop);
        }
    }

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
                this.tiles[x][y-1]?.isWater || this.tiles[x][y+1]?.isWater) 
            {
                this.addVillage(x, y, randRange(89, 127));
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
    protected readonly growthConstant = 10;
    protected readonly capacity = 300;
    protected lastPopChange_: number = 0;

    constructor(readonly name: string, readonly x: number, readonly y: number, protected pop_: number) {
    }

    get pop() { return this.pop_; }
    protected set pop(pop: number) { this.pop_ = pop; }
    setPop(pop: number) { this.pop = pop; }

    get lastPopChange() { return this.lastPopChange_; }

    step() {
        this.trySplit();
        this.stepPop();
    }

    trySplit() {
        if (this.crowded() && Math.random() < 0.1) {
            this.split();
        }
    }

    crowded() {
        return this.capacity / this.pop < 1.05;
    }

    split() {
        const newVillagersFraction = Math.random() * 0.5 + 0.1;
        const newVillagers = Math.round(newVillagersFraction * this.pop);
        island.addVillageFrom(this, newVillagers);
        this.pop -= newVillagers;
    }

    stepPop() {
        const popChange = poisson(this.nextPopChange);
        this.pop += popChange;
        this.lastPopChange_ = popChange;
    }

    get nextPopChange() {
        const r = this.pop / this.capacity;
        return this.growthConstant * r * (1 - r);
    }
}

const svgNamespace = "http://www.w3.org/2000/svg";
const tileSize = 50;

class View {
    protected readonly svg: HTMLElement;
    
    readonly panel: HTMLElement;
    readonly widgets: Widget[];
    readonly villageWidgets: VillageWidget[] = []; 

    refresh() {
        for (const w of this.widgets) {
            w.refresh();
        }

        if (this.villageWidgets.length < island.villages.length) {
            for (let i = this.villageWidgets.length; i < island.villages.length; ++i) {
                this.villageWidgets.push(new VillageWidget(this.svg, island.villages[i]));
            }
        }
        for (const w of this.villageWidgets) {
            w.refresh();
        }
    }

    constructor() {
        this.panel = document.getElementById('panel')!;
        this.widgets = [
            new TextWidget(this.panel, 'Year', () => island.year, ' '),
            new TextWidget(this.panel, 'Population', () => `${island.pop} (${island.lastPopChange})`),
            new VillageListWidget(this.panel),
        ];

        this.svg = document.getElementById('map')!;
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
            });
        });

        this.refresh();
    }
}

interface Widget {
    refresh();
}

class VillageListWidget {
    protected widgets: Widget[] = [];
    protected length: number = 0;

    constructor(protected readonly panel: HTMLElement) {
        this.refresh();
    }

    refresh() {
        for (let i = this.length; i < island.villages.length; ++i) {
            const village = island.villages[i];
            addH3(this.panel, village.name, 'village-name');
            this.widgets.push(
                new TextWidget(this.panel, 'Population', 
                    () => this.popText(village),
                    ': ',
                    'village-data'),
            );      
            ++this.length;
        }

        for (const widget of this.widgets) {
            widget.refresh();
        }
    }

    popText(v: Village) {
        const crowded = v.crowded() ? ' | full' : '';
        return `${v.pop} (${withSign(v.lastPopChange)}${crowded})`
    }
}

class TextWidget {
    readonly div: HTMLDivElement;

    constructor(protected readonly panel: HTMLElement, 
        protected readonly label: string, 
        protected readonly supplier: () => number|string,
        protected readonly sep = ': ',
        className: string = '') 
    {
        this.div = document.createElement('div');
        this.div.className = className;
        this.refresh();
        panel.appendChild(this.div);
    }

    refresh() {
        this.div.innerText = `${this.label}${this.sep}${this.supplier()}`;
    }
}

class VillageWidget {
    protected readonly positions = [
        [23, 23],
        [21, 27],
        [25, 27],
        [19, 23],
        [27, 23],
        [21, 19],
        [25, 19],
    ];

    dots: number = 0;

    constructor(
        protected readonly svg: HTMLElement, 
        protected readonly village: Village) 
    {
        const textElement = document.createElementNS(svgNamespace, 'text') as SVGTextElement;
        textElement.textContent = village.name;
        textElement.setAttribute('font-family', 'Macondo Swash Caps, cursive');
        textElement.setAttribute('font-weight', 'bold');
        textElement.setAttribute('font-size', '12px');
        textElement.setAttribute('x', String(this.village.x * tileSize + 8));
        textElement.setAttribute('y', String(this.village.y * tileSize + 14));
        svg.appendChild(textElement);
    
        this.refresh();
    }

    refresh() {
        const newDots = Math.max(1, Math.round(this.village.pop / 50));
        if (newDots === this.dots) return;

        for (let i = this.dots; i < newDots; ++i) {
            const [rx, ry] = this.positions[i];
            this.addVillageDot(this.village.x * tileSize + rx, this.village.y * tileSize + ry);
        }
        this.dots = newDots;
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

class Controller {
    bind(elementId:string, event: string, fn: () => void) {
        document.getElementById(elementId)?.addEventListener(event, fn.bind(this));
    }

    protected tickDuration = 100;

    protected running = false;
    protected tLast = 0;
    protected boundTick = this.tick.bind(this);

    step() {
        island.step();
        view.refresh();
    }

    run() {
        this.tLast = performance.now();
        this.running = true;
        this.tick();
    }

    tick() {
        if (!this.running) return;

        const tNow = performance.now();
        while (tNow - this.tLast >= this.tickDuration) {
            this.tLast += this.tickDuration;
            this.step();
        }

        requestAnimationFrame(this.boundTick);
    }

    stop() {
        this.running = false;
    }

    runTo1000() {
        island.villages[0].setPop(100);
        while (island.pop < 1000 && island.year < 1000) {
            island.step();
        }
        view.refresh();
        console.log(`Population ${island.pop} reached in year ${island.year}`);
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
controller.bind('play', 'click', controller.run)
controller.bind('pause', 'click', controller.stop)

// ---------------------------- Library functions ----------------------------

function sum(ns: readonly number[]): number {
    let s = 0;
    for (const n of ns) s += n;
    return s;
}

function randRange(a: number, b: number): number {
    return Math.floor(a + Math.random() * (b - a))
}

function randElement<T>(array: T[]): T {
    return array[randRange(0, array.length)]
}

function poisson(lambda: number): number {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1;

    do {
        k += 1;
        let u = Math.random();
        p *= u;
    } while (p > L);

    return k - 1;
}

function withSign(n: number): string {
    return (n < 0 ? "" : "+") + n;
}

function addH3(e: HTMLElement, text: string, className: string) {
    const ch = document.createElement('h3');
    ch.innerText = text;
    ch.className = className;
    e.appendChild(ch);
}
