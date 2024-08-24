import { Tilemap } from "./tilemap.js";


const computeNeighborhood = (dx : number, dy : number, tilemap : Tilemap) : boolean[] => {

    const out : boolean[] = new Array<boolean> (9);
    for (let y = -1; y <= 1; ++ y) {

        for (let x = -1; x <= 1; ++ x) {

            out[(y + 1)*3 + (x + 1)] = tilemap.getTile(dx + x, dy + y, 1) == 1;
        }
    }
    return out;
}


const computeTile = (target : number[], x : number, y : number, tilemap : Tilemap) : void => {

    const neighborhood : boolean[] = computeNeighborhood(x, y, tilemap);

    let index : number = y*tilemap.width*4 + x*2;
    target[index] = 0;

    if (!neighborhood[1] || !neighborhood[3]) {

		target[index] = 2;
		if (neighborhood[1]) {

			target[index] = 10;

		} else if (neighborhood[3]) {

			target[index] = 3;
		}

	} else if (!neighborhood[0]) {

		target[index] = 6;
	}
}


export const generateWallMap = (tilemap : Tilemap) : number[] => {

    const out : number[] = (new Array<number> (tilemap.width*tilemap.height*4)).fill(-1);

    for (let y = 0; y < tilemap.height; ++ y) {

        for (let x = 0; x < tilemap.width; ++ x) {

            computeTile(out, x, y, tilemap);
        }
    }
    return out;
}


