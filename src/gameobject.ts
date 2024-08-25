import { Vector } from "./vector.js";
import { Canvas, Flip } from "./canvas.js";
import { BitmapAsset } from "./mnemonics.js";
import { InputState, ProgramEvent } from "./event.js";
import { PuzzleState } from "./puzzlestate.js";


export const enum GameObjectType {

    Unknown = 0,
    Player = 1,
    Rock = 2
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

    private type : GameObjectType;

    private pos : Vector;
    private target : Vector;
    private renderPos : Vector;
    private direction : Direction = Direction.None;

    private active : boolean = true;


    constructor(type : GameObjectType, x : number, y : number) {

        this.pos = new Vector(x, y);
        this.target = this.pos.clone();
        this.renderPos = new Vector(x*16, y*16);

        this.type = type;
    }


    private moveTo(activeState : PuzzleState, x : number, y : number) : boolean {

        if (activeState.isSolid(x, y)) {

            return false;
        }

        this.moveTimer = 0.0;
        this.moving = true;

        this.target = new Vector(x, y);
        return true;
    }


    private control(activeState : PuzzleState, event : ProgramEvent) : void {

        if (this.moving) {

            return;
        }

        let direction : Direction = Direction.None;
        for (let i = 0; i < 4; ++ i) {

            if ((event.getAction(i) & InputState.DownOrPressed) != 0) {

                direction = (i + 1) as Direction;
                break;
            }
        }

        if (direction != Direction.None) {

            // Change the direction even if cannot move
            this.direction = direction;

            const dir : Vector = directionToVector(direction);
            this.moveTo(activeState, this.pos.x + dir.x, this.pos.y + dir.y);
        }
    }


    private move(moveSpeed : number, event : ProgramEvent) : void {

        if (!this.moving) 
            return;

        if ((this.moveTimer += moveSpeed*event.tick) >= 1.0) {

            this.moveTimer = 0.0;
            this.moving = false;
            this.pos = this.target.clone();
        }
        this.renderPos.x = ((1.0 - this.moveTimer)*this.pos.x + this.moveTimer*this.target.x)*16;
        this.renderPos.y = ((1.0 - this.moveTimer)*this.pos.y + this.moveTimer*this.target.y)*16;
    }


    private drawPlayer(canvas : Canvas) : void {

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


    public update(activeState : PuzzleState, moveSpeed : number, event : ProgramEvent) : void {

        if (this.type == GameObjectType.Player) {

            this.control(activeState, event);
        }

        this.move(moveSpeed, event);
    }


    public draw(canvas : Canvas) : void {

        if (!this.active) {

            return;
        }

        switch (this.type) {

        case GameObjectType.Player:
            this.drawPlayer(canvas);
            break;

        default:
            break;
        }
    }
}
