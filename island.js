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
    village;
    year_ = 1;
    get year() { return this.year_; }
    step() {
        this.village.step();
        ++this.year_;
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
                this.village = new Village(x, y, 100);
                this.tiles[x][y].addVillage(this.village);
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
    lastPopChange_ = 0;
    constructor(x, y, pop_) {
        this.x = x;
        this.y = y;
        this.pop_ = pop_;
    }
    get pop() { return this.pop_; }
    set pop(pop) { this.pop_ = pop; }
    get produce() {
        return 1 * Math.min(this.pop, 300) +
            0.1 * Math.min(this.pop, 200) +
            0.1 * Math.min(this.pop, 100);
    }
    get popChange() {
        const sr = this.produce / this.pop;
        const r = 0.1 * (sr - 1);
        return Math.round(r * this.pop);
    }
    step() {
        const popChange = this.popChange;
        this.pop += popChange;
        this.lastPopChange_ = popChange;
    }
}
const svgNamespace = "http://www.w3.org/2000/svg";
const tileSize = 50;
class View {
    svg;
    panel;
    widgets;
    refresh() {
        for (const w of this.widgets) {
            w.refresh();
        }
    }
    constructor() {
        this.panel = document.getElementById('panel');
        this.widgets = [
            new TextWidget(this, 'Year', () => island.year, ' '),
            new TextWidget(this, 'Population', () => island.village.pop),
            new TextWidget(this, 'Produce', () => island.village.produce),
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
        this.widgets.push(new VillageWidget(this, this.svg, island.village));
    }
}
class TextWidget {
    view;
    label;
    supplier;
    sep;
    div;
    constructor(view, label, supplier, sep = ': ') {
        this.view = view;
        this.label = label;
        this.supplier = supplier;
        this.sep = sep;
        this.div = document.createElement('div');
        this.refresh();
        view.panel.appendChild(this.div);
    }
    refresh() {
        this.div.innerText = `${this.label}${this.sep}${this.supplier()}`;
    }
}
class VillageWidget {
    view;
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
    constructor(view, svg, village) {
        this.view = view;
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
    return Math.floor(Math.random() * (b - a));
}
