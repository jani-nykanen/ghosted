import { Align, Bitmap, Canvas, Flip } from "./canvas.js";
import { InputState, ProgramEvent } from "./event.js";
import { Scene } from "./scene.js";
import { Action, BitmapAsset, SoundEffect } from "./mnemonics.js";
import { drawTransition } from "./transition.js";
import { Menu, MenuButton } from "./menu.js";
import { storeProgress } from "./progress.js";
import { drawBox } from "./box.js";



const GUIDE : string = 
`    CONTROLS:

ARROWS/WASD:  MOVE
ESC/ENTER:    PAUSE
R:            RESTART
BACKSPACE/Z:  UNDO`;


export class ControlGuide implements Scene {


    private guideShown : boolean = false;

    private width : number;
    private height : number;

    private entranceTimer : number = 1.0;


    constructor() {

        const lines : string[] = GUIDE.split("\n");

        this.width = Math.max(...lines.map((s : string) => s.length));
        this.height = lines.length;
    }


    public onChange(param : number | undefined, event : ProgramEvent): void {

        if (this.guideShown) {

            this.entranceTimer = 0.0;
        }
    }


    public update(event : ProgramEvent) : void {
        
        const ENTRANCE_SPEED : number = 1.0/30.0;

        if (this.guideShown && this.entranceTimer <= 0.0) {

            event.changeScene("ls", event);
            return;
        }

        if (this.entranceTimer > 0) {

            if ((this.entranceTimer -= ENTRANCE_SPEED*event.tick) <= 0) {

                if (this.guideShown) {

                    event.changeScene("ls", event);
                    return;
                }
                this.entranceTimer = 0.0;
            }
            return;
        }

        if (event.anyPressed) {

            event.playSample(SoundEffect.Select);

            this.guideShown = true;
            this.entranceTimer = 1.0;
        }
    }


    public redraw(canvas : Canvas) : void {

        canvas.clear("#000000");
        canvas.moveTo();

        if (this.guideShown && this.entranceTimer <= 0.0) {

            return;
        }

        let shiftx : number = 0;
        let shifty : number = 0;

        const w : number = this.width*7 + 8;
        const h : number = this.height*12 + 8;

        if (this.entranceTimer > 0.0) {

            const t : number = this.guideShown ? -(1.0 - this.entranceTimer) : this.entranceTimer;
            if (canvas.width >= canvas.height) {

                shifty = canvas.height*t;
            }
            else {

                shiftx = canvas.width*t;
            }
        }

        const dx : number = canvas.width/2 - w/2 + shiftx;
        const dy : number = canvas.height/2 - h/2 + shifty;

        drawBox(canvas, dx, dy, w, h);
        canvas.drawText(BitmapAsset.FontWhite, GUIDE, 
            dx + 4, dy + 4, -1, 4);
    }
}
