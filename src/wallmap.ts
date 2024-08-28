import { Canvas, Flip } from "./canvas.js";
import { BitmapAsset } from "./mnemonics.js";
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


const computeTileWall = (target : number[], neighborhood : boolean[], 
    x : number, y : number, tilemap : Tilemap) : void => {

    //
    // TODO: If running out of space, use lookup tables instead.
    //

    // Top-left corner
    let index : number = y*tilemap.width*4 + x*2;
    target[index] = 0;
    if (!neighborhood[1] || !neighborhood[3]) {

		target[index] = 1;
		if (neighborhood[1]) {

			target[index] = 4;

		} 
        else if (neighborhood[3]) {

			target[index] = 3;
		}

	} 
    else if (!neighborhood[0]) {

		target[index] = 5;
	}

    // Top-right corner
    target[++ index] = 0;
    if (!neighborhood[1] || !neighborhood[5]) {

		target[index] = 2;
		if (neighborhood[1]) {

			target[index] = 10;

		} 
        else if (neighborhood[5]) {

			target[index] = 3;
		}

	} 
    else if (!neighborhood[2]) {

		target[index] = 6;
	}


    // Bottom-left corner
    target[index += tilemap.width*2 - 1] = 0;
    if (!neighborhood[7] || !neighborhood[3]) {

		target[index] = 7;
		if (neighborhood[7]) {

			target[index] = 4;

		} 
        else if (neighborhood[3]) {

			target[index] = 9;
		}

	} 
    else if (!neighborhood[6]) {

		target[index] = 11;
	}

     // Bottom-right corner
     target[++ index] = 0;
     if (!neighborhood[7] || !neighborhood[5]) {
 
         target[index] = 8;
         if (neighborhood[7]) {
 
            target[index] = 10;
 
         } 
         else if (neighborhood[5]) {
 
            target[index] = 9;
         }
 
     } 
     else if (!neighborhood[8]) {
 
         target[index] = 12;
     }
     
}


const computeTileShadow = (target : number[], neighborhood : boolean[],
    x : number, y : number, tilemap : Tilemap) : void => {

    const index : number = y*tilemap.width*4 + x*2;

    // Corner
    if (neighborhood[0]) {

        target[index] = 2;
        if (neighborhood[1] && neighborhood[3]) {

			target[index] = 1;

		} 
        else if (!neighborhood[1] && !neighborhood[3]) {

			target[index] = 6;

		} 
        else if (!neighborhood[1]) {

			target[index] = 5;
		}
    }
    else {

        if (neighborhood[1] && neighborhood[3]) {

			target[index] = 1;

		} 
        else if (!neighborhood[1] && neighborhood[3]) {

			target[index] = 3;

		} 
        else if (!neighborhood[3] && neighborhood[1]) {

			target[index] = 4;
		}
    }

    // Top
	if (neighborhood[1]) {

		target[index + 1] = 2;
	}

	// Left
	if (neighborhood[3]) {

		target[index + tilemap.width*2] = 5;
	}
}


export const generateWallMap = (tilemap : Tilemap) : [number[], number[]] => {

    const walls : number[] = (new Array<number> (tilemap.width*tilemap.height*4)).fill(-1);
    const shadows : number[] = (new Array<number> (tilemap.width*tilemap.height*4)).fill(0);

    for (let y = 0; y < tilemap.height; ++ y) {

        for (let x = 0; x < tilemap.width; ++ x) {

            const neighborhood : boolean[] = computeNeighborhood(x, y, tilemap);

            if (tilemap.getTile(x, y) != 1) {

                computeTileShadow(shadows, neighborhood, x, y, tilemap);
                continue;
            }
            computeTileWall(walls, neighborhood, x, y, tilemap);  
        }
    }

    return [walls, shadows];
}


export const drawWallMap = (canvas : Canvas, wallMap : number[], shadowMap : number[], 
    width : number, height : number) : void => {

    canvas.setColor("#dbdbdb");

    for (let y = 0; y < height*2; ++ y) {

        for (let x = 0; x < width*2; ++ x) {

            const tileID : number = wallMap[y*width*2 + x] - 1;
            const shadowId : number = shadowMap[y*width*2 + x] - 1;

            if (shadowId >= 0) {
                    
                const sx : number = shadowId % 4;
                const sy : number = (shadowId/4) | 0;

                canvas.setAlpha(0.25);
                canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, x*8, y*8, sx*8, 32 + sy*8, 8, 8);
                canvas.setAlpha();
            }

            if (tileID == -2) {

                continue;
            }

            if (tileID == -1) {

                canvas.fillRect(x*8, y*8, 8, 8);
                continue;
            }

            const sx : number = tileID % 6;
            const sy : number = (tileID/6) | 0;

            canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, x*8, y*8, sx*8, sy*8, 8, 8);
        }
    }
}
