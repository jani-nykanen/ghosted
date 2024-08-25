import { Canvas, Flip } from "./canvas.js";
import { ProgramEvent } from "./event.js";
import { BitmapAsset } from "./mnemonics.js";
import { Scene, SceneParameter } from "./scene.js";
import { Tilemap } from "./tilemap.js";
import { LEVEL_DATA } from "./leveldata.js";
import { drawWallMap, generateWallMap } from "./wallmap.js";
import { PuzzleState } from "./puzzlestate.js";


const FLOOR_TILES : number[] = [0, 3, 4];


export class Game implements Scene {


    private baseMap : Tilemap | undefined = undefined;
    private wallMap : number[] | undefined = undefined;
    private shadowMap : number[] | undefined = undefined;

    private states : PuzzleState[];
    private activeState : PuzzleState | undefined = undefined;

    private width : number = 0;
    private height : number = 0;


    constructor() {

        this.states = new Array<PuzzleState> ();
    }


    private drawFrame(canvas : Canvas) : void {

        // Horizontal
        for (let x = -1; x < this.width*2 + 1; ++ x) {

            const corner : boolean = x == -1 || x == this.width*2;

            // Frame bars
            for (let i = 0; i < 2; ++ i) {

                
                canvas.drawBitmap(BitmapAsset.GameArt, (Number(x == this.width*2) | Number(i*2)) as Flip, 
                    x*8 + Number(x < 0), -7 + i*(this.height*16 + 6), corner ? 1 : 8, 48, 8 - Number(corner), 8);
            }
            // Bottom part
            canvas.drawBitmap(BitmapAsset.GameArt, Number(x == this.width*2) as Flip, 
                x*8, this.height*16 + 6, corner ? 0 : 8, 56, 8, 8);
        }

        // Vertical
        for (let y = 0; y < this.height*2; ++ y) {

            for (let i = 0; i < 2; ++ i) {

                canvas.drawBitmap(BitmapAsset.GameArt, (i*Flip.Horizontal) as Flip, 
                    -7 + i*(this.width*16 + 6), y*8, 8, 48, 8, 8, 4, 4, Math.PI/2);
            }
        }
    }


    private drawBottomLayer(canvas : Canvas) : void {

        canvas.fillRect(8, 8, (this.width - 1)*16, (this.height - 1)*16, "#000000");

        // Overlaying layer
        for (let y = 1; y < this.height - 1; ++ y) {

            for (let x = 1; x < this.width - 1; ++ x) {

                const tileID : number = this.activeState.getTile(0, x, y);

                if (!FLOOR_TILES.includes(tileID)) {

                    continue;
                }

                const dx : number = x*16;
                const dy : number = y*16;

                canvas.fillRect(dx, dy, 16, 16, x % 2 == y % 2 ? "#ffdb92" : "#dbb66d");

                switch (tileID) {

                // Hole
                case 3:
                    canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, dx, dy, 16, 32, 16, 16);
                    break;

                // Cross on the floor
                case 4:
                    canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, dx + 4, dy + 4, 0, 32, 8, 8);
                    break;

                default:
                    break;
                }
            }
        }
    }


    public onChange(param : SceneParameter, event : ProgramEvent) : void {

        // TODO: Get the level index from param?

        this.baseMap = new Tilemap(LEVEL_DATA[0]);
        [this.wallMap, this.shadowMap] = generateWallMap(this.baseMap);

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
        this.drawFrame(canvas);
        this.drawBottomLayer(canvas);
        drawWallMap(canvas, this.wallMap, this.shadowMap, this.baseMap.width, this.baseMap.height);
        canvas.moveTo();
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }

}