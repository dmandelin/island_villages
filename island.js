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
                this.tiles[x][y].addVillage(new Village(100));
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
    constructor() {
        this.svg = document.getElementById('map');
        this.panel = document.getElementById('panel');
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
        this.addTextDiv('Year 1');
        if (village) {
            this.addTextDiv('Village population: ' + village.pop);
            this.addTextDiv('  Produce: ' + village.produce);
        }
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
    addTextDiv(text) {
        const div = document.createElement('div');
        div.innerText = text;
        this.panel.appendChild(div);
    }
}
// ---------------------------------- MVC ----------------------------------
const island = new Island(10, 10);
const view = new View();
document.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
    }
});
document.getElementById("play")?.addEventListener("click", playVideo);
document.getElementById("pause")?.addEventListener("click", pauseVideo);
function playVideo() {
    // Play your media here
}
function pauseVideo() {
    // Pause your media here
}
// ---------------------------- Library functions ----------------------------
function randRange(a, b) {
    return Math.floor(Math.random() * (b - a));
}
