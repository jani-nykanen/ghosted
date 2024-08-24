import { Canvas, Flip } from "./canvas.js";
import { ProgramEvent } from "./event.js";
import { BitmapAsset } from "./mnemonics.js";
import { Scene, SceneParameter } from "./scene.js";
import { Tilemap } from "./tilemap.js";
import { LEVEL_DATA } from "./leveldata.js";
import { drawWallMap, generateWallMap } from "./wallmap.js";
import { PuzzleState } from "./puzzlestate.js";


const FLOOR_TILES : number[] = [3, 4];


export class Game implements Scene {


    private baseMap : Tilemap | undefined = undefined;
    private wallMap : number[] | undefined = undefined;

    private states : PuzzleState[];
    private activeState : PuzzleState | undefined = undefined;

    private width : number = 0;
    private height : number = 0;


    constructor() {

        this.states = new Array<PuzzleState> ();
    }


    private drawBottomLayer(canvas : Canvas) : void {

        canvas.fillRect(0, 0, this.width*16, this.height*16, "#000000");

        // TODO: Add "iterate" function to save bytes?

        // Bottom layer
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                // TODO: add dx, dy 

                const tileID : number = this.activeState.getTile(0, x, y);
                if (FLOOR_TILES.includes(tileID) && 
                    !FLOOR_TILES.includes(this.activeState.getTile(0, x, y - 1))) {

                    canvas.fillRect(x*16, y*16, 16, 4, x % 2 != y % 2 ? "#b69249" : "#926d00");
                }

                switch (tileID) {

                // Platform
                case 4:
                    canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, x*16, y*16, 0, 32, 16, 24);
                    canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, x*16 + 4, y*16 + 4, 16, 32, 8, 8);
                    break;

                default:
                    break;
                }
            }
        }

        // Overlaying layer
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                const tileID : number = this.activeState.getTile(0, x, y);
                if (tileID != 0) {

                    continue;
                }
                // Base floor tile
                canvas.fillRect(x*16, y*16, 16, 16, x % 2 == y % 2 ? "#ffdb92" : "#dbb66d");
            }
        }
    }


    public onChange(param : SceneParameter, event : ProgramEvent) : void {

        // TODO: Get the level index from param?

        this.baseMap = new Tilemap(LEVEL_DATA[0]);
        this.wallMap = generateWallMap(this.baseMap);

        this.width = this.baseMap.width;
        this.height = this.baseMap.height;

        this.states.push(new PuzzleState(undefined, this.baseMap));
        this.activeState = this.states[0];
    }


    public update(event : ProgramEvent) : void {
        
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.clear("#006db6");
        canvas.drawText(BitmapAsset.FontWhite, "HELLO WORLD!", 2, 2, -1);
        canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, 16, 16);

        canvas.moveTo(canvas.width/2 - this.baseMap!.width*8, canvas.height/2 - this.baseMap!.height*8);
        this.drawBottomLayer(canvas);
        drawWallMap(canvas, this.wallMap, this.baseMap.width, this.baseMap.height);
        canvas.moveTo();
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }

}