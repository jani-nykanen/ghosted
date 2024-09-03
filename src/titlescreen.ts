import { Align, Bitmap, Canvas, Flip } from "./canvas.js";
import { InputState, ProgramEvent } from "./event.js";
import { Scene } from "./scene.js";
import { Action, BitmapAsset, SoundEffect } from "./mnemonics.js";
import { Vector } from "./vector.js";
import { negMod } from "./math.js";
import { drawTransition } from "./transition.js";
import { Menu, MenuButton } from "./menu.js";



export class TitleScreen implements Scene {


    private transitionTimer : number = 0;
    private fadingIn : boolean = false;

    private animationTimer : number = 1.0;
    private enterPressed : boolean = false;

    private menu : Menu;

    private readonly completedLevels : boolean[];

    
    constructor(completedLevels : boolean[]) {

        this.completedLevels = completedLevels;

        this.menu = new Menu(
        [
        new MenuButton("START GAME", (event : ProgramEvent) : boolean => {

            this.fadingIn = true;
            this.transitionTimer = 1.0;
            return false;
        }),
        new MenuButton("AUDIO: ON ", (event : ProgramEvent, button : MenuButton) : boolean => {

            event.toggleAudio();
            button.text = event.getAudioString();

            return false;
        }),
        new MenuButton("DELETE DATA", (event : ProgramEvent) : boolean => {

            // ...
            return false;
        })

        ], true);
    }


    public onChange(param : number | undefined, event : ProgramEvent) : void {

        this.transitionTimer = 1.0;
        this.fadingIn = false;

        this.menu.changeMenuText(1, event.getAudioString());
    }


    public update(event : ProgramEvent) : void {

        const ANIMATIONS_SPEED : number = 1.0/60.0;
        const TRANSITION_SPEED : number = 1.0/20.0;

        if (this.transitionTimer > 0) {

            if ((this.transitionTimer -= TRANSITION_SPEED* event.tick) < 0) {

                if (this.fadingIn) {

                    event.changeScene("ls", event);
                }
                this.transitionTimer = 0.0;
            }
            return;
        }

        if (this.enterPressed) {

            this.menu.update(event, false);
        }
        else if (event.getAction(Action.Choose) == InputState.Pressed) {

            this.enterPressed = true;
            event.playSample(SoundEffect.Pause);
        }

        this.animationTimer = (this.animationTimer + ANIMATIONS_SPEED*event.tick) % 1.0;
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.moveTo();
        canvas.clear("#000000");

        const bmpLogo : Bitmap = canvas.getBitmap(BitmapAsset.Title)!;
        const dx : number = canvas.width/2 - bmpLogo.width/2;
        for (let y = 0; y < bmpLogo.height; ++ y) {

            canvas.drawBitmap(BitmapAsset.Title, Flip.None,
                dx + Math.sin((y/24 + this.animationTimer)*Math.PI*2)*2, 
                16 + y, 0, y, bmpLogo.width, 1);
        }

        if (this.enterPressed) {

            this.menu.draw(canvas, 0, 32, false);
        }
        else if (this.animationTimer < 0.5) {

            canvas.drawText(BitmapAsset.FontYellow, 
                "PRESS ENTER OR SPACE", 
                canvas.width/2, canvas.height/2 + 32, 
                -1, 0, Align.Center);
        }

        canvas.drawText(BitmapAsset.FontWhite, "*2024 JANI NYK@NEN", 
            canvas.width/2, canvas.height - 12, -1, 0, Align.Center);

        drawTransition(canvas, this.transitionTimer, this.fadingIn);
    }


    public dispose() : number | undefined {
        
        return undefined;
    }
}