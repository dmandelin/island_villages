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
    w;
    h;
    tiles;
    village;
    year_ = 1;
    get year() { return this.year_; }
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
                this.village = new Village(100);
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
    pop_;
    constructor(pop_) {
        this.pop_ = pop_;
    }
    get pop() { return this.pop_; }
    set pop(pop) { this.pop_ = pop; }
    get produce() {
        return Math.min(this.pop, 300);
    }
}
const svgNamespace = "http://www.w3.org/2000/svg";
class View {
    svg;
    panel;
    widgets;
    constructor() {
        this.panel = document.getElementById('panel');
        this.widgets = [
            new TextWidget(this, 'Year', () => island.year, ' '),
            new TextWidget(this, 'Population', () => island.village.pop),
            new TextWidget(this, 'Produce', () => island.village.produce),
        ];
        this.svg = document.getElementById('map');
        const tileSize = 50;
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
                if (tile.village) {
                    village = tile.village;
                    this.addVillageDot(rx + 23, ry + 23);
                    this.addVillageDot(rx + 21, ry + 27);
                    this.addVillageDot(rx + 25, ry + 27);
                }
            });
        });
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
class TextWidget {
    view;
    label;
    supplier;
    div;
    constructor(view, label, supplier, sep = ': ') {
        this.view = view;
        this.label = label;
        this.supplier = supplier;
        this.div = document.createElement('div');
        this.div.innerText = `${label}${sep}${supplier()}`;
        view.panel.appendChild(this.div);
    }
}
class Controller {
    bind(elementId, event, fn) {
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
controller.bind('step', 'click', controller.step);
// ---------------------------- Library functions ----------------------------
function randRange(a, b) {
    return Math.floor(Math.random() * (b - a));
}
