import { Tilemap } from "./tilemap.js";


// TODO: Bottom tiles is just a complement of the top tiles, minus 0?
const BOTTOM_LAYER_TILES : number[] = [1, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const TOP_LAYER_TILES : number[] = [2, 3];

const ALWAYS_SOLID_TILES : number[] = [1, 11];
const ROCK_SOLIDS : number[] = [6, 9];


export class PuzzleState {


    private layers : number[][];

    // Public to save bytes
    public turnsLeft : number = 13;

    public readonly width : number;
    public readonly height : number;


    constructor(cloneableState : PuzzleState | undefined, baseMap? : Tilemap)  {

        this.layers = new Array<number[]> (2);

        if (cloneableState !== undefined) {

            this.turnsLeft = cloneableState.turnsLeft;

            this.width = cloneableState.width;
            this.height = cloneableState.height;

            this.layers[0] = Array.from(cloneableState.layers[0]);
            this.layers[1] = Array.from(cloneableState.layers[1]);
            return;
        }

        this.width = baseMap.width;
        this.height = baseMap.height;

        this.layers[0] = baseMap.filterTiles(BOTTOM_LAYER_TILES);
        this.layers[1] = baseMap.filterTiles(TOP_LAYER_TILES);
    }


    public getTile(layer : number, x : number, y : number, def : number = 0, mask : number = 31) : number {
    
        if (layer < 0 || layer >= this.layers.length ||
            x < 0 || y < 0 || x >= this.width || y >= this.height) {

            return def;
        }
        return this.layers[layer][y*this.width + x] & mask;
    }


    public cloneTo(target : PuzzleState) : void {

        for (let i = 0; i < this.width*this.height; ++ i) {

            target.layers[0][i] = this.layers[0][i];
            target.layers[1][i] = this.layers[1][i];
        }

        target.turnsLeft = this.turnsLeft;
    }


    public iterate(func : (bottomTileID : number, topTileID : number, x : number, y : number) => void) : void {

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                func(this.layers[0][y*this.width + x], this.layers[1][y*this.width + x], x, y);
            }
        }
    }


    public isSolid(x : number, y : number, ignoreSpecialTiles : boolean) : boolean {

        const bottom : number = this.getTile(0, x, y);
        const topTile : number = this.getTile(1, x, y);

        // TODO: All the other missing checks
        // TODO 2: Use a table
        return topTile != 0 ||  
            (!ignoreSpecialTiles && bottom == 4) ||
            (ignoreSpecialTiles && ROCK_SOLIDS.includes(bottom)) ||
            ALWAYS_SOLID_TILES.includes(bottom);
    }


    public setTile(layer : number, x : number, y : number, newValue : number, mask : number = 0) : void {

        if (layer < 0 || layer >= this.layers.length ||
            x < 0 || y < 0 || x >= this.width || y >= this.height) {

            return;
        }
        this.layers[layer][y*this.width + x] = (newValue & 31) | (mask << 5);
    }


    public swapBottomLayerTile(v1 : number, v2 : number) : void {

        for (let i = 0; i < this.layers[0].length; ++ i) {

            if (this.layers[1][i] != 0) {

                continue;
            }

            const v : number = this.layers[0][i];
            if (v == v1) {

                this.layers[0][i] = v2;
            }
            else if (v == v2) {

                this.layers[0][i] = v1;
            }
        }
    }
}
