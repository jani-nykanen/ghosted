import { Align, Bitmap, Canvas, Flip } from "./canvas.js";
import { InputState, ProgramEvent } from "./event.js";
import { Action, BitmapAsset, SoundEffect } from "./mnemonics.js";
import { Scene } from "./scene.js";
import { Tilemap } from "./tilemap.js";
import { LEVEL_DATA } from "./leveldata.js";
import { drawWallMap, generateWallMap } from "./wallmap.js";
import { PuzzleState } from "./puzzlestate.js";
import { Direction, GameObject, GameObjectType } from "./gameobject.js";
import { Vector } from "./vector.js";
import { Menu, MenuButton } from "./menu.js";
import { drawTransition } from "./transition.js";
import { storeProgress } from "./progress.js";


const BOTTOM_TILE_OBJECTS : number[] = [7, 8];
const TOP_TILE_OBJECTS : number[] = [2, 3];

const GHOST_TRANSFORM_TIMER : number = 24;


const CLEAR_TEXT_APPEAR_TIME : number = 30;
const CLEAR_LEAVE_STAGE_TIME : number = 90;


// For some reason "progress" array can have 13th entry that
// is always false, so "!progress.includes(false)" does not work
// here...
const levelsBeaten = (progress : boolean[]) : boolean => {

    for (let i = 0; i < 12; ++ i) {

        if (!progress[i]) {

            return false;
        }
    }
    return true;
}


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
    private playerRef : GameObject | undefined = undefined;
    private isMoving : boolean = false;

    private effectType : EffectType = EffectType.None;
    private effectTimer : number = 0.0;
    private effectPos : Vector = new Vector(0, 0);
    private blockingEffect : boolean = true;

    private transformTimer : number = 0;
    private animationTimer : number = 0;
    private arrowTimer : number = 0;
    private gridTimer : number = 0; // Only in the final level
    private shakeTimer : number = 0; // Same here

    private transitionTimer : number = 0;
    private fadingOut : boolean = false;

    private pauseMenu : Menu;

    private levelIndex : number = 0;

    private stageCleared : boolean = false;
    private clearTimer : number = 0;


    private readonly completedLevels : boolean[];


    private readonly setEffect : EffectCallback = (type : EffectType, x : number, y : number) => {

        this.effectPos.x = x;
        this.effectPos.y = y;

        this.effectType = type;
        this.effectTimer = 1.0;

        this.blockingEffect = type != EffectType.SplashingSlime;
    };


    constructor(completedLevels : boolean[]) {

        this.completedLevels = completedLevels;

        this.stateBuffer = new Array<PuzzleState> ();
        this.objects = new Array<GameObject> ();

        this.pauseMenu = new Menu(
        [
            new MenuButton("RESUME", () => true),
            new MenuButton("UNDO", (event : ProgramEvent) : boolean => {
                this.undo(event);
                return true;
            }),
            new MenuButton("RESTART", (event : ProgramEvent) : boolean => {

                this.reset(event);
                return true;
            }),
            new MenuButton("AUDIO: ON", (event : ProgramEvent, button : MenuButton) : boolean => {

                event.toggleAudio();
                button.text = event.getAudioString();
                
                return false;
            }),
            new MenuButton("QUIT", (event : ProgramEvent) : boolean => {

                // event.changeScene("ls", event);
                this.transitionTimer = 1.0;
                this.fadingOut = true;
                return true;
            })

        ], false);
    }


    private parseInitialObject() : void {

        this.activeState!.iterate((bottomTileID : number, topTileID : number, x : number, y : number) : void => {

            // Bottom layer objects
            if (BOTTOM_TILE_OBJECTS.includes(bottomTileID)) {

                this.objects.push(new GameObject(bottomTileID as GameObjectType, x, y, this.setEffect));
            }
            // Top layer objects
            if (TOP_TILE_OBJECTS.includes(topTileID)) {

                const o : GameObject = new GameObject(topTileID as GameObjectType, x, y, this.setEffect);
                if (o.type == GameObjectType.Player) {

                    this.playerRef = o;
                }
                this.objects.push(o);
            }
        });
    }


    private checkUnderlyingTiles(event : ProgramEvent) : void {

        let doubleCheck : boolean = false;

        for (let o of this.objects) {

            doubleCheck = o.checkUnderlyingTiles(this.activeState, event) || doubleCheck;
        }

        // This is required in the case there is a vanishing object
        if (doubleCheck) {

            for (let o of this.objects) {

                o.checkUnderlyingTiles(this.activeState, event);
            }
        }
    } 


    private resetState() : void {

        this.isMoving = false;
        this.effectTimer = 0.0;
        this.transformTimer = 0.0;
        this.transformTimer = 0;

        for (let o of this.objects) {

            o.stopMoving();
        }

        const resetIndicesTop : boolean[] = (new Array<boolean> (this.objects.length)).fill(false);
        const resetIndicesBottom : boolean[] = (new Array<boolean> (this.objects.length)).fill(false);

        // Reset objects to the their corresponding locations
        this.activeState!.iterate((bottomTileID : number, topTileID : number, x : number, y : number) : void => {

            // Note: had to do this twice since there might be two objects in the same tile.
            // "Good design" I call it...
            // TODO: Maybe pass bottomTileID and topTileID in a single array?

            // Bottom
            for (let i = 0; i < this.objects.length; ++ i) {

                const o : GameObject = this.objects[i];
                
                if (resetIndicesBottom[i] || (bottomTileID & 31) != o.type) {

                    continue;
                }
                resetIndicesBottom[i] = true;
                o.setPosition(x, y, (bottomTileID >> 5) as Direction);
                break;
            }

            // Top
            for (let i = 0; i < this.objects.length; ++ i) {

                const o : GameObject = this.objects[i];
                
                if (resetIndicesTop[i] || (topTileID & 31) != o.type) {

                    continue;
                }
                resetIndicesTop[i] = true;
                o.setPosition(x, y, (topTileID >> 5) as Direction);
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
        if (this.levelIndex == 13) {

            this.activeState!.turnsLeft = 0;
        }

        this.resetState();

        // Needed for some reason (or not)
        // this.activeState!.turnsLeft = 13;

        this.stateBuffer.push(new PuzzleState(this.activeState));
    }


    private drawBackgroundGrid(canvas : Canvas) : void {

        const GRID_SIZE : number = 32;

        const finalStage : boolean = this.levelIndex == 13;

        canvas.clear(finalStage ? "#b6b6b6" : "#4992db");
        canvas.setColor(finalStage ? "#929292" : "#246db6");

        const loopx : number = (((canvas.width/GRID_SIZE + 1)/2) | 0) + 1;
        const loopy : number = (((canvas.height/GRID_SIZE + 1)/2) | 0) + 1;

        for (let y = -loopy - 1; y <= loopy; ++ y) {

            for (let x = -loopx - 1; x <= loopx; ++ x) {

                if ((y + loopy*2) % 2 == (x + loopx*2) % 2)
                    continue;

                canvas.fillRect(
                    canvas.width/2 - x*GRID_SIZE - this.gridTimer, 
                    canvas.height/2 - y*GRID_SIZE + this.gridTimer, 
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


    private drawBottomLayer(canvas : Canvas) : void {

        canvas.fillRect(8, 8, (this.width - 1)*16, (this.height - 1)*16, "#000000");

        for (let y = 1; y < this.height - 1; ++ y) {

            for (let x = 1; x < this.width - 1; ++ x) {

                const tileID : number = this.activeState!.getTile(0, x, y);

                const dx : number = x*16;
                const dy : number = y*16;

                canvas.fillRect(x*16, y*16, 16, 16, x % 2 == y % 2 ? "#ffdb92" : "#dbb66d");

                if (this.effectTimer > 0 &&
                    x == this.effectPos.x && y == this.effectPos.y) {

                    continue;
                }

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

                // Pink button
                case 9:
                case 10:
                    canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, dx, dy, (tileID - 9)*16, 80, 16, 16);
                    break;

                // Pink block
                case 11:
                case 12:

                    canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, dx, dy, 32 + (tileID - 11)*16, 80, 16, 16);
                    break;

                // Arrows
                case 13:
                case 14:
                case 15:
                case 16: {

                        const odd : number = tileID % 2;
                        const angle : number = (tileID - 10)*Math.PI/2;
                        const frame : number = ((this.arrowTimer/0.5) | 0) % 2;

                        for (let i = 0; i < 2; ++ i) {

                            canvas.drawBitmap(BitmapAsset.GameArt, 
                                (Number(tileID == 15)*2 + Number(tileID == 16)) as Flip, 
                                dx + odd*(i*8 - 4), 
                                dy + (1 - odd)*i*8 + odd*4, 
                                0, 96 + ((i + frame) % 2)*8, 16, 8, 8, 4, angle);
                        }
                    }
                    break;

                // Blue button
                case 17:
                case 18:
                    canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, dx, dy, 16 + (tileID - 17)*16, 96, 16, 16);
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

            // this.drawFloorTile(canvas, this.effectPos.x, this.effectPos.y);
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

            // this.drawFloorTile(canvas, this.effectPos.x, this.effectPos.y);

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

        const DISAPPEAR_MOVE_DISTANCE : number = 8;

        // Stage number
        canvas.drawText(BitmapAsset.FontOutlines, 
            this.levelIndex == 13 ? "NIGHTMARE" : "STAGE " + String(this.levelIndex), 
            canvas.width/2, canvas.height - 19, -8, 0, Align.Center);

        if (((this.transformTimer/4) | 0) % 2 != 0) {

            return;
        }

        const dx : number = canvas.width/2 + 4;
        const dy : number = 2;

        if (this.activeState!.turnsLeft <= 0) {

            canvas.drawText(BitmapAsset.FontOutlines, "SPOOKY!",
                dx, dy, -8, 0, Align.Center);
            return;
        }

        canvas.drawText(BitmapAsset.FontOutlines, "#", dx - 22, dy);
            
        if (this.animationTimer <= 0.0 || 
            !this.playerRef!.moving ||
            this.playerRef!.automaticallyMoving) {

            canvas.drawText(BitmapAsset.FontOutlines, String(this.activeState!.turnsLeft),
                dx, dy, -8, 0, Align.Center);
            return;
        }

        const t : number = 1.0 - this.animationTimer;

        // Old time
        canvas.setAlpha(this.animationTimer);
        canvas.drawText(BitmapAsset.FontOutlines, String(this.activeState!.turnsLeft),
            dx, dy + t*DISAPPEAR_MOVE_DISTANCE, -8, 0, Align.Center);

        canvas.setAlpha(t);

        // New time
        canvas.drawText(BitmapAsset.FontOutlines, String(this.activeState!.turnsLeft - 1),
            dx, dy - this.animationTimer*DISAPPEAR_MOVE_DISTANCE, -8, 0, Align.Center);

        canvas.setAlpha();
    }


    private drawTransformationEffect(canvas : Canvas) : void {

        const STAR_COUNT : number = 6;
        const MAX_STAR_DISTANCE : number = 32;

        if (this.transformTimer <= 0) {

            return;
        }

        const t : number = 1.0 - this.transformTimer/GHOST_TRANSFORM_TIMER;
        const distance : number = MAX_STAR_DISTANCE*t;
        const frame : number = (((this.transformTimer/2) | 0)) % 3;

        const cx : number = this.playerRef!.renderPos.x + 8;
        const cy : number = this.playerRef!.renderPos.y + 8;

        const angleStep : number = Math.PI*2/STAR_COUNT;
        for (let i = 0; i < STAR_COUNT; ++ i) {

            const angle : number = angleStep*(i + 0.5);

            const dx : number = cx + Math.cos(angle)*distance;
            const dy : number = cy + Math.sin(angle)*distance;

            canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, dx - 4, dy - 4,
                24 + frame*8, 64, 8, 8);
        }
    }


    private drawStageClear(canvas : Canvas) : void {

        canvas.fillRect(0, 0, canvas.width, canvas.height, "rgba(0,0,0,0.50)");

        const bmp : Bitmap = canvas.getBitmap(BitmapAsset.StageClear)!;

        const dx : number = canvas.width/2 - bmp.width/2;
        const dy : number = canvas.height/2 - bmp.height/2;

        if (this.clearTimer >= CLEAR_TEXT_APPEAR_TIME) {
        
            canvas.drawBitmap(BitmapAsset.StageClear, Flip.None, dx, dy);
            return;
        }
        
        const t : number = 1.0 - this.clearTimer/CLEAR_TEXT_APPEAR_TIME;
        canvas.drawFunnilyAppearingBitmap(BitmapAsset.StageClear, dx, dy, t, 32, 4, 4);
    }


    public onChange(param : number | undefined, event : ProgramEvent) : void {

        const FINAL_LEVEL_SHAKE : number = 30;

        this.levelIndex = param ?? 1;

        this.baseMap = new Tilemap(LEVEL_DATA[this.levelIndex - 1]);
        [this.wallMap, this.shadowMap] = generateWallMap(this.baseMap);

        this.width = this.baseMap.width;
        this.height = this.baseMap.height;

        this.stateBuffer.length = 0;
        this.objects.length = 0;

        this.stateBuffer.push(new PuzzleState(undefined, this.baseMap));
        if (this.levelIndex == 13) {

            this.stateBuffer[0].turnsLeft = 0;
        }
        this.activeState = new PuzzleState(this.stateBuffer[0]);

        this.objects.length = 0;
        this.parseInitialObject();

        this.isMoving = false;
        this.transformTimer = 0;
        this.effectTimer = 0;
        this.animationTimer = 0;
        this.gridTimer = 0;

        this.shakeTimer = 0;
        if (param === 13) {

            this.shakeTimer = FINAL_LEVEL_SHAKE;
        }

        this.transitionTimer = 1.0;
        this.fadingOut = false;

        this.stageCleared = false;
        this.clearTimer = 0;
    }


    public update(event : ProgramEvent) : void {

        const MAX_BUFFER_SIZE : number = 64;
        const MOVE_SPEED : number = 1.0/16.0;
        const ARROW_FLICKER_SPEED : number = 1.0/60.0;
        const TRANSITION_SPEED : number = 1.0/20.0;

        if (this.transitionTimer > 0) {

            if ((this.transitionTimer -= TRANSITION_SPEED* event.tick) < 0) {

                if (this.fadingOut) {

                    event.changeScene(this.levelIndex == 13 && this.stageCleared ? "e" : "ls", event);
                }
                this.transitionTimer = 0.0;
            }
            return;
        }

        // Stage cleared screen
        if (this.stageCleared) {

            // Update objects to finish coin animations
            for (let o of this.objects) {

                o.update(this.activeState, MOVE_SPEED, event);
            }

            this.clearTimer += event.tick;
            if (this.clearTimer >= CLEAR_LEAVE_STAGE_TIME) {

                // Check if all the stages are cleared
                if (this.levelIndex != 13 && levelsBeaten(this.completedLevels)) {

                    event.playSample(SoundEffect.FinalStageTransition);
                    this.onChange(13, event);
                    return;
                }

                this.fadingOut = true;
                this.transitionTimer = 1.0;
            }
            return;
        }

        if (this.pauseMenu.active) {

            this.pauseMenu.update(event, true);
            return;
        }

        if (event.getAction(Action.Pause) == InputState.Pressed) {

            event.playSample(SoundEffect.Pause);

            this.pauseMenu.changeMenuText(3, event.getAudioString());
            this.pauseMenu.activate(0); 
            return;
        }

        if (event.getAction(Action.Undo) == InputState.Pressed) {
/*
            if (this.isMoving) {

                event.playSample(SoundEffect.Reject);
            }
            else {
*/
                event.playSample(SoundEffect.Undo);
                this.undo(event);
                return;
            // }
        }
        if (event.getAction(Action.Restart) == InputState.Pressed) {

            event.playSample(SoundEffect.Restart);
            this.reset(event);
        }

        let anyMoved : boolean = false;
        let nonPlayerMoved : boolean = false;
        let startTurn : boolean = false;
        const wasPlayerMoving : boolean = this.playerRef!.moving;

        if (this.transformTimer <= 0 && 
            (this.effectTimer <= 0.0 || !this.blockingEffect)) {

            do {

                anyMoved = false;
                for (let o of this.objects) {

                    const thisMoved : boolean = o.control(this.activeState, event);
                    anyMoved = thisMoved || anyMoved;
                    startTurn = startTurn || thisMoved;
                    if (thisMoved && o.type != GameObjectType.Player) {

                        nonPlayerMoved = true;
                    }
                }
                if (anyMoved) {

                    this.animationTimer = 1.0;
                }
            }
            while (anyMoved);
        }

        // Only play walk sound when nothing else moves
        if (!wasPlayerMoving && 
            this.playerRef!.moving && 
            !this.playerRef!.jumping &&
            !nonPlayerMoved &&
            this.activeState!.turnsLeft > 0) {

            event.playSample(SoundEffect.Walk);
        }

        const wasMoving : boolean = this.isMoving;
 
        this.isMoving = false;
        for (let o of this.objects) {

            o.update(this.activeState, MOVE_SPEED, event);
            this.isMoving = o.moving || this.isMoving;
        }

        // End turn
        if (wasMoving && !this.isMoving) {

            this.animationTimer = 0.0;
            this.checkUnderlyingTiles(event);

            const oldMoveCount : number = this.activeState!.turnsLeft;

            if (wasPlayerMoving &&
                !this.playerRef!.automaticallyMoving) {

                this.activeState!.turnsLeft = Math.max(0, this.activeState!.turnsLeft - 1);
            }

            // Turn into a ghost
            if (oldMoveCount == 1 && this.activeState!.turnsLeft == 0) {

                this.transformTimer = GHOST_TRANSFORM_TIMER;
                event.playSample(SoundEffect.Transform);
            }
            
            if (oldMoveCount > 0 && this.activeState!.turnsLeft == 0) {

                // Do additional check in the case that the player is standing
                // in the same tile as a collectable item
                this.checkUnderlyingTiles(event);
            }

            if (!this.playerRef!.automaticallyMoving) {

                this.stateBuffer.push(new PuzzleState(this.activeState));
                if (this.stateBuffer.length >= MAX_BUFFER_SIZE) {

                    this.stateBuffer.shift();
                }
            }

            // Transforming back to human
            if (this.activeState!.turnsLeft == 13) {

                this.transformTimer = GHOST_TRANSFORM_TIMER;
                event.playSample(SoundEffect.Transform);
            }

            // Note: "=" is intentional here, do NOT change it to "=="!
            if (this.stageCleared = this.activeState!.isStageClear()) {

                event.playSample(SoundEffect.StageClear);
                this.completedLevels[this.levelIndex - 1] = true;
                storeProgress(this.completedLevels);
            }
        }

        // Update timers
        if (this.effectTimer > 0) {

            this.effectTimer -= MOVE_SPEED*event.tick;
        }
        if (this.transformTimer > 0) {

            this.transformTimer -= event.tick;
        }
        if (this.animationTimer > 0) {

            this.animationTimer -= MOVE_SPEED*event.tick;
        }
        this.arrowTimer = (this.arrowTimer + ARROW_FLICKER_SPEED*event.tick) % 1.0;
        if (this.levelIndex == 13) {

            this.gridTimer = (this.gridTimer + 0.5*event.tick) % 32;
        }
        this.shakeTimer = Math.max(0, this.shakeTimer - event.tick);
    }


    public redraw(canvas : Canvas) : void {
        
       // const TRANSITION_SHIFT : number = 16;

       // This was a bad idea
       /*
        if (this.transitionTimer > 0) {

            const t : number = this.fadingOut ? 1.0 - this.transitionTimer : this.transitionTimer;
            canvas.moveTo(0, (t*TRANSITION_SHIFT) | 0);
        }
        */

        this.drawBackgroundGrid(canvas);

        canvas.moveTo(canvas.width/2 - this.baseMap!.width*8, canvas.height/2 - this.baseMap!.height*8);
        if (this.shakeTimer > 0) {

            const shakex : number = -2 + ((Math.random()*5) | 0);
            const shakey : number = -2 + ((Math.random()*5) | 0);

            canvas.move(shakex, shakey);
        }

        this.drawFrame(canvas);
        this.drawBottomLayer(canvas);
        drawWallMap(canvas, this.wallMap, this.shadowMap, this.baseMap.width, this.baseMap.height);
        this.drawEffect(canvas);
        
        this.objects.sort((a : GameObject, b : GameObject) => a.renderPos.y - b.renderPos.y);

        // Shadows
        canvas.setAlpha(0.25);
        for (let o of this.objects) {

            o.drawShadow(canvas);
        }
        canvas.setAlpha();

        this.playerRef?.drawDust(canvas, this.activeState);

        // Objects itself
        for (let o of this.objects) {

            o.draw(canvas, this.activeState);
        }

        this.drawTransformationEffect(canvas);

        canvas.moveTo();
        this.drawHUD(canvas);

        this.pauseMenu.draw(canvas, 0, 0, true);

        if (this.stageCleared) {

            this.drawStageClear(canvas);
        }

        drawTransition(canvas, this.transitionTimer, this.fadingOut);
    }


    public dispose() : number | undefined {
        
        return Number(this.stageCleared);
    }

}