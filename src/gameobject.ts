import { Vector } from "./vector.js";
import { Canvas, Flip } from "./canvas.js";
import { BitmapAsset } from "./mnemonics.js";
import { InputState, ProgramEvent } from "./event.js";
import { PuzzleState } from "./puzzlestate.js";
import { EffectCallback, EffectType } from "./game.js";


export const enum GameObjectType {

    Unknown = 0,
    Player = 2,
    Rock = 3
}


export const enum Direction {

    None = 0,
    Right = 1,
    Up = 2,
    Left = 3,
    Down = 4
}


export const directionToVector = (dir : Direction) : Vector => new Vector(
    [0, 1, 0, -1, 0][dir] ?? 0,
    [0, 0, -1, 0, 1][dir] ?? 0);


export class GameObject {


    private moveTimer : number = 0;
    private moving : boolean = false;
    private target : Vector;

    private direction : Direction = Direction.None;

    private active : boolean = true;

    private animationTimer : number = 0.0;

    private readonly effectCallback : EffectCallback;

    // These are public to save bytes
    public type : GameObjectType;
    public pos : Vector;
    public renderPos : Vector;


    constructor(type : GameObjectType, x : number, y : number, effectCallback : EffectCallback) {

        this.pos = new Vector(x, y);
        this.target = this.pos.clone();
        this.renderPos = new Vector(x*16, y*16);

        this.type = type;

        this.effectCallback = effectCallback;
    }


    // This is called when the player leaves certain tiles
    private precheckUnderlyingTiles(activeState : PuzzleState, event : ProgramEvent) : void {

        if (!this.active || this.type != GameObjectType.Player) {

            return;
        }

        const isGhost : boolean = activeState.turnsLeft <= 0;

        const bottomTile : number = activeState.getTile(0, this.pos.x, this.pos.y);

        // Cross
        if (!isGhost && bottomTile == 5) {

            activeState.setTile(0, this.pos.x, this.pos.y, 4);

            this.effectCallback(EffectType.SpreadingHole, this.pos.x, this.pos.y);

            // TODO: Sound effect!
        }

        // Slime
        if (isGhost && bottomTile == 0) {

            activeState.setTile(0, this.pos.x, this.pos.y, 6);

            this.effectCallback(EffectType.EmergingSlime, this.pos.x, this.pos.y);
            // TODO: Sound effect!
        }
    }



    private moveTo(activeState : PuzzleState, x : number, y : number, event : ProgramEvent) : boolean {

        if (activeState.isSolid(x, y, 
            this.type == GameObjectType.Rock || activeState.turnsLeft <= 0)) {

            return false;
        }

        activeState.setTile(1, this.pos.x, this.pos.y, 0);
        this.precheckUnderlyingTiles(activeState, event);
        // activeState.setTile(1, x, y, this.type);

        this.moveTimer = 0.0;
        this.moving = true;

        this.target = new Vector(x, y);
        
        return true;
    }


    private move(activeState : PuzzleState, moveSpeed : number, event : ProgramEvent) : void {

        if (!this.moving) 
            return;

        if ((this.moveTimer += moveSpeed*event.tick) >= 1.0) {

            this.moveTimer = 0.0;
            this.moving = false;
            this.pos = this.target.clone();

            activeState.setTile(1, this.pos.x, this.pos.y, this.type, this.direction);
        }
        this.renderPos.x = ((1.0 - this.moveTimer)*this.pos.x + this.moveTimer*this.target.x)*16;
        this.renderPos.y = ((1.0 - this.moveTimer)*this.pos.y + this.moveTimer*this.target.y)*16;
    }


    private drawGhost(canvas : Canvas) : void {

        const FACE_OFF_X : number[] = [6, 0, -4, 0];
        const FACE_OFF_Y : number[] = [0, 0, 0, 1];

        const dy : number = this.renderPos.y - 7 + Math.round(Math.sin(this.animationTimer*Math.PI*2)*1);

        // Body
        canvas.drawBitmap(BitmapAsset.GameArt, Flip.None,
            this.renderPos.x, dy,
            0, 48, 16, 16);

        // Face
        if (this.direction != Direction.Up) {

            const sw : number = this.direction == Direction.Down ? 8 : 6;
            const shiftx : number = this.direction == Direction.Left ? 2 : 0; 

            canvas.drawBitmap(BitmapAsset.GameArt, 
                Flip.None,
                this.renderPos.x + 4 + FACE_OFF_X[this.direction - 1], 
                dy + FACE_OFF_Y[this.direction - 1] + 5,
                16 + shiftx, 48, sw, 8);
        }
    }


    private drawPlayer(canvas : Canvas, activeState : PuzzleState) : void {

        if (activeState.turnsLeft <= 0) {

            this.drawGhost(canvas);
            return;
        }

        const HORIZONTAL_BODY_FRAME_LOOKUP : number[] = [0, 1, 0, 2];

        const dy : number = this.renderPos.y - 6;

        const frame : number = ((this.moveTimer*2) | 0) + Number(this.pos.x % 2 == this.pos.y % 2)*2;
        if (this.direction % 2 == 0) {

            const flip : Flip = (Number(frame == 3)) as Flip;
            const odd : number = frame % 2;
            const headY : number = 1 - ((this.direction/3) | 0);

            // Head
            canvas.drawBitmap(BitmapAsset.GameArt, flip,
                this.renderPos.x, dy + odd, 0, 16 + headY*8, 16, 8);
            // Body
            canvas.drawBitmap(BitmapAsset.GameArt, flip,
                this.renderPos.x, dy + 8, 32 + 16*(frame % 2), 16, 16, 8);

            // Chin/neck
            canvas.fillRect(this.renderPos.x + 6, dy + 9 + odd - headY*2, 4, 1, "#000000");

            return;
        }

        const flip : Flip = (Number(this.direction == Direction.Left)) as Flip;
        // Head
        canvas.drawBitmap(BitmapAsset.GameArt, flip,
            this.renderPos.x, dy + (frame % 2), 16, 16, 16, 8);
        // Body
        canvas.drawBitmap(BitmapAsset.GameArt, flip,
            this.renderPos.x, dy + 8, 
            16 + 16*HORIZONTAL_BODY_FRAME_LOOKUP[frame], 
            24, 16, 8);

    }


    public control(activeState : PuzzleState, event : ProgramEvent) : boolean {

        if (!this.active || this.moving) {

            return false;
        }

        const requirePushing : boolean = this.type != GameObjectType.Player;

        let direction : Direction = Direction.None;
        for (let i = 0; i < 4; ++ i) {

            if ((event.getAction(i) & InputState.DownOrPressed) != 0) {

                direction = (i + 1) as Direction;
                break;
            }
        }

        const dir : Vector = directionToVector(direction);
        if (requirePushing && 
            (activeState.turnsLeft <= 0 ||
            activeState.getTile(1, this.pos.x - dir.x, this.pos.y - dir.y) != GameObjectType.Player)) {

            return false;
        }

        if (direction != Direction.None) {

            // Change the direction even if cannot move
            this.direction = direction;
            return this.moveTo(activeState, this.pos.x + dir.x, this.pos.y + dir.y, event);
        }
    }


    public update(activeState : PuzzleState, moveSpeed : number, event : ProgramEvent) : void {

        const ANIMATION_SPEED : number = 1.0/60.0;

        if (!this.active) {

            return;
        }

        this.move(activeState, moveSpeed, event);
        this.animationTimer = (this.animationTimer + ANIMATION_SPEED*event.tick) % 1.0;
    }


    public drawShadow(canvas : Canvas) : void {

        if (this.type != GameObjectType.Player) {

            return;
        }

        canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, this.renderPos.x, this.renderPos.y + 6, 16, 56, 16, 8);
    }


    public draw(canvas : Canvas, activeState : PuzzleState) : void {

        if (!this.active) {

            return;
        }

        switch (this.type) {

        case GameObjectType.Player:

            this.drawPlayer(canvas, activeState);
            break;

        case GameObjectType.Rock:

            canvas.drawBitmap(BitmapAsset.GameArt, Flip.None, 
                this.renderPos.x, this.renderPos.y - 1, 
                32, 32, 16, 16);
            break;

        default:
            break;
        }
    }


    public stopMoving() : void {

        this.moving = false;
        this.moveTimer = 0;

        this.target = this.pos.clone();
        this.renderPos.x = this.pos.x*16;
        this.renderPos.y = this.pos.y*16;

        this.active = false;
    }


    public setPosition(x : number, y : number, direction : Direction = Direction.None) : void {

        this.pos = new Vector(x, y);
        this.target = this.pos.clone();
        this.direction = direction;

        this.renderPos.x = this.pos.x*16;
        this.renderPos.y = this.pos.y*16;

        this.active = true;
    }


    public checkUnderlyingTiles(activeScene : PuzzleState, event : ProgramEvent) : void {

        if (!this.active) {

            return;
        }

        const bottomTile : number = activeScene.getTile(0, this.pos.x, this.pos.y);

        // Hole
        if (this.type == GameObjectType.Rock && bottomTile == 4) {

            this.active = false;
            activeScene.setTile(0, this.pos.x, this.pos.y, 0);
            activeScene.setTile(1, this.pos.x, this.pos.y, 0);

            this.effectCallback(EffectType.ShrinkingHole, this.pos.x, this.pos.y);

            // TODO: Sound effect!
        }

        // Slime
        if (this.type == GameObjectType.Player && activeScene.turnsLeft > 0 && bottomTile == 6) {

            activeScene.setTile(0, this.pos.x, this.pos.y, 0);

            this.effectCallback(EffectType.SplashingSlime, this.pos.x, this.pos.y);

            // TODO: Sound effect!
            
        }
    }


    public isAbove = (other : GameObject) : boolean => this.pos.y > other.pos.y;
    public isMoving = () : boolean => this.moving;
}
