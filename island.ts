// Island villages
//
// General plan and feature list
// - Island of square land tiles surrounded by square water tiles
// - Villages appear as a dot or cluster of dots in a tile
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
            const row: Tile[] = [];
            for (let y = 0; y < h; ++y) {
                const isWater = x == 0 || x == w - 1 || y == 0 || y == h - 1;
                row.push(new Tile(isWater));
            }
            this.tiles.push(row);
        }
    }
}

class Tile {
    constructor(readonly isWater) {}
}

class View {
    constructor() {
        const svg = document.getElementById('map')!;

        const svgNamespace = "http://www.w3.org/2000/svg";
        const tileSize = 50;
        const borderSize = 1;

        island.tiles.forEach((row, i) => {
            row.forEach((tile, j) => {
                const rect = document.createElementNS(svgNamespace, 'rect');
                rect.setAttribute('x', String(j * tileSize));
                rect.setAttribute('y', String(i * tileSize));
                rect.setAttribute('width', String(tileSize));
                rect.setAttribute('height', String(tileSize));
                rect.setAttribute('fill', tile.isWater ? '#AEDFF7' : '#8CB39F');
                rect.setAttribute('stroke', 'lightgray');
                rect.setAttribute('stroke-width', String(borderSize));
                svg.appendChild(rect);
            });
        });
    }
}

const island = new Island(10, 10);
const view = new View();

document.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
    }
});