

export class Tilemap {


    private tiles : number[];
    
    public readonly width : number;
    public readonly height : number;


    constructor(packedData : string) {

        this.width = parseInt(packedData[0]);
        this.height = parseInt(packedData[1]);
        this.tiles = packedData.substring(2).split("").map((c : string) => parseInt(c, 32));
    }


    public cloneTiles = () : number[] => Array.from(this.tiles);


    public filterTiles(filterTable : number[]) : number[] {

        const out : number[] = Array.from(this.tiles);
        for (const k in out) {

            if (!filterTable.includes(out[k])) {

                out[k] = 0;
            }
        }
        return out;
    }


    public getTile(x : number, y : number, def : number = 0) : number {

        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {

            return def;
        }
        return this.tiles[y*this.width + x];
    }


    public iterate(iterator : (value : number, x : number, y : number, i : number) => void) : void {

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                const i : number = y*this.width + x;
                iterator(this.tiles[i], x, y, i);
            }
        }
    }
}
