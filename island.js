// Island villages
//
// General plan and feature list
//   - Production may vary by terrain type or other factors
// - If population is large, part of the village may leave to found a new village
//   - Productivity may be lowered in a new village
// Later
// - Fishing villages
// - Trade and exchange between fishing and farming villages
class Island {
    w;
    h;
    tiles;
    villages = [];
    year_ = 1;
    get year() { return this.year_; }
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
    addVillage(x, y, pop) {
        const village = new Village(x, y, pop);
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
            this.addVillage(pos[0], pos[1], newPop);
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
                this.addVillage(x, y, randRange(89, 127));
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
    x;
    y;
    pop_;
    growthConstant = 10;
    capacity = 300;
    lastPopChange_ = 0;
    constructor(x, y, pop_) {
        this.x = x;
        this.y = y;
        this.pop_ = pop_;
    }
    get pop() { return this.pop_; }
    set pop(pop) { this.pop_ = pop; }
    get lastPopChange() { return this.lastPopChange_; }
    step() {
        this.trySplit();
        this.stepPop();
    }
    trySplit() {
        if (this.capacity / this.pop < 1.05 && Math.random() < 0.1) {
            this.split();
        }
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
            addH3(this.panel, `Village ${i + 1}`);
            this.widgets.push(new TextWidget(this.panel, 'Population', () => `${village.pop} (${withSign(village.lastPopChange)})`));
            ++this.length;
        }
        for (const widget of this.widgets) {
            widget.refresh();
        }
    }
}
class TextWidget {
    panel;
    label;
    supplier;
    sep;
    div;
    constructor(panel, label, supplier, sep = ': ') {
        this.panel = panel;
        this.label = label;
        this.supplier = supplier;
        this.sep = sep;
        this.div = document.createElement('div');
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
        document.getElementById(elementId)?.addEventListener(event, fn);
    }
    step() {
        island.step();
        view.refresh();
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
// ---------------------------- Library functions ----------------------------
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
function addH3(e, text) {
    const ch = document.createElement('h3');
    ch.innerText = text;
    e.appendChild(ch);
}
