import { Align, Canvas, Flip } from "./canvas.js";
import { InputState, ProgramEvent } from "./event.js";
import { Action, BitmapAsset } from "./mnemonics.js";
import { Scene, SceneParameter } from "./scene.js";
import { Tilemap } from "./tilemap.js";
import { LEVEL_DATA } from "./leveldata.js";
import { drawWallMap, generateWallMap } from "./wallmap.js";
import { PuzzleState } from "./puzzlestate.js";
import { Direction, GameObject, GameObjectType } from "./gameobject.js";
import { Vector } from "./vector.js";


export const enum EffectType {

    None = 0,
    SpreadingHole = 1, // what now
    ShrinkingHole = 2,
    EmergingSlime = 3,
    SplashingSlime = 4,
};


export type EffectCallback = (type : EffectType, x : number, y : number) => void; 


export class Game implements Scene {


    private baseMap : Tilemap | undefined = undefined;
    private wallMap : number[] | undefined = undefined;
    private shadowMap : number[] | undefined = undefined;

    private stateBuffer : PuzzleState[];
    private activeState : PuzzleState | undefined = undefined;

    private width : number = 0;
    private height : number = 0;

    private objects : GameObject[];
    private isMoving : boolean = false;

    private effectType : EffectType = EffectType.None;
    private effectTimer : number = 0.0;
    private effectPos : Vector = new Vector(0, 0);
    private blockingEffect : boolean = true;


    private readonly setEffect : EffectCallback = (type : EffectType, x : number, y : number) => {

        this.effectPos.x = x;
        this.effectPos.y = y;

        this.effectType = type;
        this.effectTimer = 1.0;

        this.blockingEffect = type != EffectType.SplashingSlime;
    };


    constructor() {

        this.stateBuffer = new Array<PuzzleState> ();

        this.objects = new Array<GameObject> ();
    }


    private parseInitialObject() : void {

        this.activeState.iterate(1, (id : number, x : number, y : number) : void => {

            switch (id) {

            // Player & rock
            case 2:
            case 3:

                this.objects.push(new GameObject(id as GameObjectType, x, y, this.setEffect));
                break;

            default:
                break;
            }

        });
    }


    private checkUnderlyingTiles(event : ProgramEvent) : void {

        for (let o of this.objects) {

            o.checkUnderlyingTiles(this.activeState, event);
        }
    } 


    private resetState() : void {

        this.effectTimer = 0.0;

        for (let o of this.objects) {

            o.stopMoving();
        }

        const resetIndices : boolean[] = (new Array<boolean> (this.objects.length)).fill(false);

        // Reset objects to the their corresponding locations
        this.activeState.iterate(1, (tileID : number, x : number, y : number) : void => {

            if (tileID <= 1) {

                return;
            }

            for (let i = 0; i < this.objects.length; ++ i) {

                const o : GameObject = this.objects[i];
                if (resetIndices[i] || (tileID & 31) != o.type) {

                    continue;
                }
                resetIndices[i] = true;
                o.setPosition(x, y, (tileID >> 5) as Direction);
                break;
            }
        });
    }


    private undo(event : ProgramEvent) : void {

        if (this.stateBuffer.length < 2) {

            return;
        }

        this.stateBuffer[this.stateBuffer.length - 2].cloneTo(this.activeState);
        this.stateBuffer.pop();

        this.resetState();
    }


    private reset(event : ProgramEvent) : void {

        this.activeState = new PuzzleState(undefined, this.baseMap);
        this.resetState();

        this.stateBuffer.push(new PuzzleState(this.activeState));
    }


    private drawBackgroundGrid(canvas : Canvas) : void {

        const GRID_SIZE : number = 32;

        canvas.setColor("#2492ff");

        const loopx : number = ((canvas.width/GRID_SIZE + 1)/2) | 0;
        const loopy : number = ((canvas.height/GRID_SIZE + 1)/2) | 0;

        for (let y = -loopy - 1; y < loopy + 2; ++ y) {

            for (let x = -loopx - 1; x < loopx + 2; ++ x) {

                if ((y + loopy*2) % 2 == (x + loopx*2) % 2)
                    continue;

                canvas.fillRect(
                    canvas.width/2 - x*GRID_SIZE, canvas.height/2 - y*GRID_SIZE, 
                    GRID_SIZE, GRID_SIZE);
            }
        }
    }


    private drawFrame(canvas : Canvas) : void {

        // Shadow
        canvas.setAlpha(0.25);
        canvas.setColor("#000000");
        canvas.fillRect(-2, 4, this.width*16 + 13, this.height*16 + 12);
        canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, this.width*16 + 7, -1, 16, 32, 5, 5);
        canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, -7, this.height*16 + 12, 24, 32, 5, 5);
        canvas.setAlpha();

        // Background color
        canvas.fillRect(-2, -2, this.width*16 + 4, this.height*16 + 4, "#924900");

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


    private drawFloorTile(canvas : Canvas, x : number, y : number) : void {

        canvas.fillRect(x*16, y*16, 16, 16, x % 2 == y % 2 ? "#ffdb92" : "#dbb66d");
    }


    private drawBottomLayer(canvas : Canvas) : void {

        canvas.fillRect(8, 8, (this.width - 1)*16, (this.height - 1)*16, "#000000");

        for (let y = 1; y < this.height - 1; ++ y) {

            for (let x = 1; x < this.width - 1; ++ x) {

                const tileID : number = this.activeState.getTile(0, x, y);

                const dx : number = x*16;
                const dy : number = y*16;

                this.drawFloorTile(canvas, x, y);

                // TODO: Use a lookup table since a lot of repeating drawBitmap calls?
                switch (tileID) {

                // Hole
                case 4:
                    canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, dx, dy, 48, 32, 16, 16);
                    break;

                // Cross
                case 5:
                    canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, dx + 4, dy + 4, 24, 40, 8, 8);
                    break;

                // Slime
                case 6:
                    canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, dx, dy, 32, 48, 16, 16);
                    break;

                default:
                    break;
                }
            }
        }
    }


    private drawEffect(canvas : Canvas) : void {

        const HOLE_SX : number[] = [24, 48, 56, 48];
        const HOLE_SY : number[] = [40, 48, 48, 32];

        if (this.effectTimer <= 0) {

            return;
        }

        const dx : number = this.effectPos.x*16;
        const dy : number = this.effectPos.y*16;

        const t : number = 1 - this.effectTimer;

        switch (this.effectType) {

        case EffectType.SpreadingHole: {

            const frame : number = Math.min(2, (t*3) | 0);

            this.drawFloorTile(canvas, this.effectPos.x, this.effectPos.y);
            canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, 
                dx + 4, dy + 4,
                HOLE_SX[frame], HOLE_SY[frame], 8, 8);
            }
            break;

        
        case EffectType.ShrinkingHole: {

            const frame : number = Math.max(1, Math.ceil((this.effectTimer)*3));
            const dim : number = frame == 3 ? 16 : 8;

            canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, 
                dx + (16 - dim)/2, dy+ (16 - dim)/2,
                HOLE_SX[frame], HOLE_SY[frame], dim, dim);
            }
            break;

        case EffectType.EmergingSlime: {

            this.drawFloorTile(canvas, this.effectPos.x, this.effectPos.y);

            const frame : number = Math.min(2, ((1.0 - this.effectTimer)*3) | 0);
            if (frame == 0) {
                break;
            }

            canvas.drawBitmap(BitmapAsset.GameArt, Flip.None,
                dx + 4, dy + 4,
                48 + (frame - 1)*8, 56, 8, 8);
            }
            break;

        case EffectType.SplashingSlime: 

            if (t > 0.5) {

                break;
            }
            canvas.setColor("#6d6db6");
            canvas.fillRing(dx + 8, dy + 8, t*2*8, 2 + t*2*8);
            break;

        default:
            break;
        }
    }


    private drawHUD(canvas : Canvas) : void {

        canvas.drawText(BitmapAsset.FontOutlines, "#",
            canvas.width/2 - 18, 2);
        canvas.drawText(BitmapAsset.FontOutlines, String(this.activeState.turnsLeft),
            canvas.width/2 + 4, 2, -8, 0, Align.Center);
    }


    public onChange(param : SceneParameter, event : ProgramEvent) : void {

        // TODO: Get the level index from param?

        this.baseMap = new Tilemap(LEVEL_DATA[0]);
        [this.wallMap, this.shadowMap] = generateWallMap(this.baseMap);

        this.width = this.baseMap.width;
        this.height = this.baseMap.height;

        this.stateBuffer.push(new PuzzleState(undefined, this.baseMap));
        this.activeState = new PuzzleState(this.stateBuffer[0]);
        
        this.objects.length = 0;
        this.parseInitialObject();
    }


    public update(event : ProgramEvent) : void {

        const MAX_BUFFER_SIZE : number = 64;
        const MOVE_SPEED : number = 1.0/16.0;

        if (event.getAction(Action.Undo) == InputState.Pressed) {

            this.undo(event);
            return;
        }
        if (event.getAction(Action.Restart) == InputState.Pressed) {

            this.reset(event);
            return;
        }

        let anyMoved : boolean = false;
        if (this.effectTimer <= 0.0 || !this.blockingEffect) {

            do {

                anyMoved = false;
                for (let o of this.objects) {

                    anyMoved = o.control(this.activeState, event) || anyMoved;
                }
            }
            while (anyMoved);
        }
        const wasMoving : boolean = this.isMoving;

        this.isMoving = false;
        for (let o of this.objects) {

            o.update(this.activeState, MOVE_SPEED, event);
            this.isMoving = o.isMoving() || this.isMoving;
        }

        if (wasMoving && !this.isMoving) {

            this.checkUnderlyingTiles(event);

            this.activeState.turnsLeft = Math.max(0, this.activeState.turnsLeft - 1);
            this.stateBuffer.push(new PuzzleState(this.activeState));
            if (this.stateBuffer.length >= MAX_BUFFER_SIZE) {

                this.stateBuffer.shift();
            }
        }

        if (this.effectTimer > 0) {

            this.effectTimer -= MOVE_SPEED*event.tick;
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
        this.drawEffect(canvas);
        drawWallMap(canvas, this.wallMap, this.shadowMap, this.baseMap.width, this.baseMap.height);
        
        this.objects.sort((a : GameObject, b : GameObject) => a.renderPos.y - b.renderPos.y);

        // Shadows
        canvas.setAlpha(0.25);
        for (let o of this.objects) {

            o.drawShadow(canvas);
        }
        canvas.setAlpha();
        // Objects itself
        for (let o of this.objects) {

            o.draw(canvas, this.activeState);
        }

        canvas.moveTo();
        this.drawHUD(canvas);
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }

}