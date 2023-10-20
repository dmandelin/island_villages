// Island villages
//
// General plan and feature list
//   - Production may vary by terrain type or other factors
// - If population is large, part of the village may leave to found a new village
//   - Productivity may be lowered in a new village
// Later
// - Fishing villages
// - Trade and exchange between fishing and farming villages
// More on splitting
// - There needs to be some sort of cost to splitting, otherwise growth is maximized
//   by always splitting.
// - Ideas:
//   - More vulnerable to predators and raiding
//   - Farms not built up yet, need to clear land and condition soil
//   - Distance from friends, family, potential mates, and ritual sites
// - At first, we can deal with this as a simple abstraction
//   - There could be a minimum split size to deal with issues of major isolation
//   - Some kind of reduced productivity at first seems right, but what?
//     - In established villages, we have 1-8% growth per year, and we've assumed that
//       the produce that powers the population growth also powers expanding the farms.
//     - So, apparently with lots of land available, we can build farms at 8% per year
//     - Apparently various new settlements had it easier or harder than others
//       through history, so we have some choices.
//     - Let's say that population growth is greatly slowed but not stopped during
//       the buildup. Or not stopped on average.
//     - In general, the land will have some foraging carrying capacity, which could
//       be about 1/10 the farming capacity. If in the first year they can build 20%
//       or so of available farms (basic farms on the best land), then they have about
//       30% capacity, which is enough to bootstrap a small village. Even linear
//       buildout of 10% per year means 20%, so small enough splinters could do it
//     - It also makes sense for them to be some randomness or unknown factor about
//       getting started, but for now let's assume it's a small island that they
//       understand pretty well.
//     - We want a half-full village (0.25*max growth rate) to have a low incentive to
//       split, but a mostly full village (0.1*max growth rate) to have a good incentive
//       to split. Perhaps, then, a new village of 100 should have a growth rate about
//       1/6-1/8 the base rate. Normally it would 2/3. That would mean initial CC
//       around 120. Or, maybe just make it equal to the starting pop, then grow linearly
//       to the max over ten years.
const VILLAGE_NAMES = [
    'Moku',
    'Kumu',
    'Kahiko',
    'Hikina',
    'Ho\'kahi',
];
class Island {
    w;
    h;
    tiles;
    villages = [];
    year_ = 1;
    get year() { return this.year_; }
    get pop() {
        return sum(this.villages.map(v => v.pop));
    }
    get lastPopChange() {
        return sum(this.villages.map(v => v.lastPopChange));
    }
    tile(x, y) {
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
    moveOffsets = [
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
    addVillage(x, y, cap, pop) {
        const village = new Village(this.generateVillageName(), x, y, cap, pop);
        this.villages.push(village);
        this.tiles[x][y].addVillage(village);
    }
    addVillageFrom(village, newPop) {
        // Find all sites available within 1.5 tiles.
        const cands = [];
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
            this.addVillage(pos[0], pos[1], newPop, newPop);
        }
    }
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.tiles = [];
        for (let x = 0; x < w; ++x) {
            const col = [];
            for (let y = 0; y < h; ++y) {
                const isWater = x == 0 || x == w - 1 || y == 0 || y == h - 1;
                col.push(new Tile(isWater));
            }
            this.tiles.push(col);
        }
        while (true) {
            const x = randRange(0, w);
            const y = randRange(0, h);
            if (this.tiles[x][y].isWater)
                continue;
            if (this.tiles[x - 1][y]?.isWater || this.tiles[x + 1][y]?.isWater ||
                this.tiles[x][y - 1]?.isWater || this.tiles[x][y + 1]?.isWater) {
                this.addVillage(x, y, 300, randRange(89, 127));
                break;
            }
        }
    }
}
class Tile {
    isWater;
    village_;
    constructor(isWater) {
        this.isWater = isWater;
    }
    addVillage(village) {
        this.village_ = village;
    }
    get village() { return this.village_; }
}
class Village {
    name;
    x;
    y;
    cap_;
    pop_;
    static maxCap = 300;
    static fullTenure = 10;
    growthConstant = 0.08;
    lastPopChange_ = 0;
    constructor(name, x, y, cap_, pop_) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.cap_ = cap_;
        this.pop_ = pop_;
    }
    get pop() { return this.pop_; }
    set pop(pop) { this.pop_ = pop; }
    setPop(pop) { this.pop = pop; }
    get cap() { return this.cap_; }
    set cap(cap) { this.cap_ = cap; }
    get lastPopChange() { return this.lastPopChange_; }
    step() {
        this.trySplit();
        this.stepPop();
        this.stepCap();
    }
    trySplit() {
        if (this.crowded() && Math.random() < 0.1) {
            this.split();
        }
    }
    crowded() {
        return this.cap / this.pop < 1.05;
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
        const r = this.pop / this.cap;
        return this.growthConstant * r * (1 - r) * this.pop;
    }
    stepCap() {
        if (this.cap < Village.maxCap) {
            this.cap = Math.ceil(this.cap + Village.maxCap / Village.fullTenure);
        }
    }
}
const svgNamespace = "http://www.w3.org/2000/svg";
const tileSize = 50;
class View {
    svg;
    panel;
    widgets;
    villageWidgets = [];
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
        this.panel = document.getElementById('panel');
        this.widgets = [
            new TextWidget(this.panel, 'Year', () => island.year, ' '),
            new TextWidget(this.panel, 'Population', () => `${island.pop} (${island.lastPopChange})`),
            new VillageListWidget(this.panel),
        ];
        this.svg = document.getElementById('map');
        const borderSize = 1;
        let village = undefined;
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
class VillageListWidget {
    panel;
    widgets = [];
    length = 0;
    constructor(panel) {
        this.panel = panel;
        this.refresh();
    }
    refresh() {
        for (let i = this.length; i < island.villages.length; ++i) {
            const village = island.villages[i];
            addH3(this.panel, village.name, 'village-name');
            this.widgets.push(new TextWidget(this.panel, 'Population', () => this.popText(village), ': ', 'village-data'));
            ++this.length;
        }
        for (const widget of this.widgets) {
            widget.refresh();
        }
    }
    popText(v) {
        const crowded = v.crowded() ? ' | full' : '';
        const building = v.cap < Village.maxCap ? ` | ${Math.round(100 * v.cap / Village.maxCap)}% built` : '';
        return `${v.pop} (${withSign(v.lastPopChange)}${crowded}${building})`;
    }
}
class TextWidget {
    panel;
    label;
    supplier;
    sep;
    div;
    constructor(panel, label, supplier, sep = ': ', className = '') {
        this.panel = panel;
        this.label = label;
        this.supplier = supplier;
        this.sep = sep;
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
    svg;
    village;
    positions = [
        [23, 23],
        [21, 27],
        [25, 27],
        [19, 23],
        [27, 23],
        [21, 19],
        [25, 19],
    ];
    dots = 0;
    constructor(svg, village) {
        this.svg = svg;
        this.village = village;
        const textElement = document.createElementNS(svgNamespace, 'text');
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
        if (newDots === this.dots)
            return;
        for (let i = this.dots; i < newDots; ++i) {
            const [rx, ry] = this.positions[i];
            this.addVillageDot(this.village.x * tileSize + rx, this.village.y * tileSize + ry);
        }
        this.dots = newDots;
    }
    addVillageDot(x, y) {
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
    bind(elementId, event, fn) {
        document.getElementById(elementId)?.addEventListener(event, fn.bind(this));
    }
    tickDuration = 100;
    running = false;
    tLast = 0;
    boundTick = this.tick.bind(this);
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
        if (!this.running)
            return;
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
controller.bind('step', 'click', controller.step);
controller.bind('play', 'click', controller.run);
controller.bind('pause', 'click', controller.stop);
// ---------------------------- Library functions ----------------------------
function sum(ns) {
    let s = 0;
    for (const n of ns)
        s += n;
    return s;
}
function randRange(a, b) {
    return Math.floor(a + Math.random() * (b - a));
}
function randElement(array) {
    return array[randRange(0, array.length)];
}
function poisson(lambda) {
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
function withSign(n) {
    return (n < 0 ? "" : "+") + n;
}
function addH3(e, text, className) {
    const ch = document.createElement('h3');
    ch.innerText = text;
    ch.className = className;
    e.appendChild(ch);
}
