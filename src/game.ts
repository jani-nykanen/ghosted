import { Canvas, Flip } from "./canvas.js";
import { ProgramEvent } from "./event.js";
import { BitmapAsset } from "./mnemonics.js";
import { Scene, SceneParameter } from "./scene.js";
import { Tilemap } from "./tilemap.js";
import { LEVEL_DATA } from "./leveldata.js";
import { drawWallMap, generateWallMap } from "./wallmap.js";
import { PuzzleState } from "./puzzlestate.js";
import { GameObject, GameObjectType } from "./gameobject.js";


const FLOOR_TILES : number[] = [0];


export class Game implements Scene {


    private baseMap : Tilemap | undefined = undefined;
    private wallMap : number[] | undefined = undefined;
    private shadowMap : number[] | undefined = undefined;

    private states : PuzzleState[];
    private activeState : PuzzleState | undefined = undefined;

    private width : number = 0;
    private height : number = 0;

    private objects : GameObject[];


    constructor() {

        this.states = new Array<PuzzleState> ();

        this.objects = new Array<GameObject> ();
    }


    private parseInitialObject() : void {

        this.activeState.iterate(1, (id : number, x : number, y : number) : void => {

            switch (id) {

            // Player & rock
            case 2:
            case 3:

                this.objects.push(new GameObject(id as GameObjectType, x, y));
                break;

            default:
                break;
            }

        });
    }


    private drawBackgroundGrid(canvas : Canvas) : void {

        const GRID_SIZE : number = 32;

        canvas.setColor("#4992ff");

        const loopx : number = ((canvas.width/GRID_SIZE + 1)/2) | 0;
        const loopy : number = ((canvas.height/GRID_SIZE + 1)/2) | 0;

        for (let y = -loopy; y < loopy; ++ y) {

            canvas.fillRect(0, canvas.height/2 - y*GRID_SIZE, canvas.width, 1);
        }

        for (let x = -loopx; x < loopx; ++ x) {

            canvas.fillRect(canvas.width/2 - x*GRID_SIZE, 0, 1, canvas.height);
        }
    }


    private drawFrame(canvas : Canvas) : void {

        // Horizontal
        for (let x = -1; x < this.width*2 + 1; ++ x) {

            const corner : boolean = x == -1 || x == this.width*2;

            // Frame bars
            for (let i = 0; i < 2; ++ i) {

                
                canvas.drawBitmap(BitmapAsset.GameArt, (Number(x == this.width*2) | Number(i*2)) as Flip, 
                    x*8 + Number(x < 0), -7 + i*(this.height*16 + 6), 
                    corner ? 49 : 56, 0, 8 - Number(corner), 8);
            }
            // Bottom part
            canvas.drawBitmap(BitmapAsset.GameArt, Number(x == this.width*2) as Flip, 
                x*8, this.height*16 + 6, corner ? 48 : 56, 8, 8, 8);
        }

        // Vertical
        for (let y = 0; y < this.height*2; ++ y) {

            for (let i = 0; i < 2; ++ i) {

                canvas.drawBitmap(BitmapAsset.GameArt, (i*Flip.Horizontal) as Flip, 
                    -7 + i*(this.width*16 + 6), y*8, 
                    56, 0, 8, 8, 4, 4, Math.PI/2);
            }
        }
    }


    private drawBottomLayer(canvas : Canvas) : void {

        canvas.fillRect(8, 8, (this.width - 1)*16, (this.height - 1)*16, "#000000");

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
        
        this.objects.length = 0;
        this.parseInitialObject();

    }


    public update(event : ProgramEvent) : void {

        const MOVE_SPEED : number = 1.0/16.0;

        let anyMoved : boolean = false;
        do {

            anyMoved = false;
            for (let o of this.objects) {

                anyMoved = o.control(this.activeState, event) || anyMoved;
            }
        }
        while (anyMoved);

        for (let o of this.objects) {

            o.update(this.activeState, MOVE_SPEED, event);
        }
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.clear("#006db6");
        this.drawBackgroundGrid(canvas);

        canvas.drawText(BitmapAsset.FontWhite, "HELLO WORLD!", 2, 2, -1);
        canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, 16, 16);

        canvas.moveTo(canvas.width/2 - this.baseMap!.width*8, canvas.height/2 - this.baseMap!.height*8);

        this.drawFrame(canvas);
        this.drawBottomLayer(canvas);
        drawWallMap(canvas, this.wallMap, this.shadowMap, this.baseMap.width, this.baseMap.height);

        this.objects.sort((a : GameObject, b : GameObject) => a.renderPos.y - b.renderPos.y);
        for (let o of this.objects) {

            o.draw(canvas);
        }

        canvas.moveTo();
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }

}