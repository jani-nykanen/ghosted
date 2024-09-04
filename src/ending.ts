import { Align, Bitmap, Canvas, Flip } from "./canvas.js";
import { InputState, ProgramEvent } from "./event.js";
import { Scene } from "./scene.js";
import { Action, BitmapAsset, SoundEffect } from "./mnemonics.js";
import { Vector } from "./vector.js";
import { negMod } from "./math.js";
import { drawTransition } from "./transition.js";
import { Menu, MenuButton } from "./menu.js";
import { storeProgress } from "./progress.js";


export class Ending implements Scene {


    private transitionTimer : number = 0.0;
    private fadingOut : boolean = false;


    public onChange(param : number | undefined, event : ProgramEvent) : void {

        this.fadingOut = false;
        this.transitionTimer = 1.0;
    }


    public update(event : ProgramEvent) : void {
        
        const TRANSITION_SPEED : number = 1.0/20.0;

        if (this.transitionTimer > 0) {

            if ((this.transitionTimer -= TRANSITION_SPEED* event.tick) < 0) {

                if (this.fadingOut) {

                    event.changeScene("t", event);
                }
                this.transitionTimer = 0.0;
            }
            return;
        }

        if (event.anyPressed) {

            this.transitionTimer = 1.0;
            this.fadingOut = true;

            event.playSample(SoundEffect.Select);
        }
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.clear("#000000");

        canvas.drawText(BitmapAsset.FontWhite, "THANK YOU FOR PLAYING!", 
            canvas.width/2, canvas.height/2 - 4, -1, 0, Align.Center);

        drawTransition(canvas, this.transitionTimer, this.fadingOut);
    }

}
