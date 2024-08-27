import { Tilemap } from "./tilemap.js";


const BOTTOM_LAYER_TILES : number[] = [1, 4, 5];
const TOP_LAYER_TILES : number[] = [2, 3];


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


    public iterate(layer : number, func : (tileID : number, x : number, y : number) => void) : void {

        if (layer < 0 || layer >= this.layers.length) {

            return;
        }

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                func(this.layers[layer][y*this.width + x], x, y);
            }
        }
    }


    public isSolid(x : number, y : number, isRock : boolean) : boolean {

        // TODO: All the other missing checks
        // TODO 2: Use a table
        return this.getTile(0, x, y) == 1 ||  
            this.getTile(1, x, y) != 0 ||
            (!isRock && this.getTile(0, x, y) == 4)
    }


    public setTile(layer : number, x : number, y : number, newValue : number, mask : number = 0) : void {

        if (layer < 0 || layer >= this.layers.length ||
            x < 0 || y < 0 || x >= this.width || y >= this.height) {

            return;
        }
        this.layers[layer][y*this.width + x] = (newValue & 31) | (mask << 5);
    }
}
