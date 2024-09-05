import { Align, Bitmap, Canvas, Flip } from "./canvas.js";
import { InputState, ProgramEvent } from "./event.js";
import { Scene } from "./scene.js";
import { Action, BitmapAsset, SoundEffect } from "./mnemonics.js";
import { drawTransition } from "./transition.js";
import { Menu, MenuButton } from "./menu.js";
import { storeProgress } from "./progress.js";


export class TitleScreen implements Scene {


    private transitionTimer : number = 0;
    private fadingOut : boolean = false;

    private animationTimer : number = 1.0;
    private phase : number = 0;

    private menu : Menu;
    private yesNoMenu : Menu;

    private appearTimer : number = 1.0;

    private readonly completedLevels : boolean[];


    constructor(completedLevels : boolean[]) {

        this.completedLevels = completedLevels;

        this.menu = new Menu(
        [
        new MenuButton("START GAME", (event : ProgramEvent) : boolean => {

            this.fadingOut = true;
            this.transitionTimer = 1.0;
            return false;
        }),
        new MenuButton("AUDIO: ON ", (event : ProgramEvent, button : MenuButton) : boolean => {

            event.toggleAudio();
            button.text = event.getAudioString();

            return false;
        }),
        new MenuButton("DELETE DATA", (event : ProgramEvent) : boolean => {

            this.yesNoMenu.activate(1);
            return false;
        })
        ], true);


        this.yesNoMenu = new Menu(
        [
        new MenuButton("YES", (event : ProgramEvent) : boolean => {

            this.completedLevels.fill(false);
            storeProgress(this.completedLevels);
            return true;
        }),
        new MenuButton("NO", (event : ProgramEvent) : boolean => {

            return true;
        })
        ]);
    }


    private drawIntro(canvas : Canvas) : void {

        canvas.drawText(BitmapAsset.FontWhite, 
            this.phase == 0 ? "A GAME BY" : "MADE FOR",
            canvas.width/2, canvas.height/2 - 10, -1, 0, Align.Center);
        canvas.drawText(BitmapAsset.FontWhite, 
            this.phase == 0 ? "JANI NYK@NEN" : "JS13K 2024",
            canvas.width/2, canvas.height/2 + 2, -1, 0, Align.Center);

        drawTransition(canvas, this.transitionTimer, this.fadingOut);
        
    }


    private drawLogo(canvas : Canvas) : void {

        const LOGO_Y_OFFSET : number = 14;
        const VERTICAL_MOVEMENT : number = 1024;
        const HORIZONTAL_MOVEMENT : number = 1024;

        const bmpLogo : Bitmap = canvas.getBitmap(BitmapAsset.Title)!;
        const dx : number = canvas.width/2 - bmpLogo.width/2;
        for (let y = 0; y < bmpLogo.height; ++ y) {

            const factor : number = ((y - LOGO_Y_OFFSET) - bmpLogo.height/2)/(bmpLogo.height/2);
            const mult : number = factor*factor*Math.sign(factor);

            const offset : number = this.appearTimer*VERTICAL_MOVEMENT*mult

            const amplitude = 2 + HORIZONTAL_MOVEMENT*this.appearTimer*mult;

            canvas.drawBitmap(BitmapAsset.Title, Flip.None,
                dx + Math.sin((y/24 + this.animationTimer)*Math.PI*2)*amplitude, 
                16 + y + offset, 0, y, bmpLogo.width, 1);
        }
    }


    public onChange(param : number | undefined, event : ProgramEvent) : void {

        this.transitionTimer = 1.0;
        this.fadingOut = false;

        this.menu.changeMenuText(1, event.getAudioString());
    }


    public update(event : ProgramEvent) : void {

        const ANIMATIONS_SPEED : number = 1.0/60.0;
        const TRANSITION_SPEED : number = 1.0/30.0;
        const APPEAR_FADE_SPEED : number = 1.0/60.0;
        const APPEAR_SPEED : number = 1.0/90.0;
        const INTRO_TEXT_TIME : number = 45;

        if (this.phase > 1) {

            this.animationTimer = (this.animationTimer + ANIMATIONS_SPEED*event.tick) % 1.0;

            if (this.appearTimer > 0) {

                this.transitionTimer = Math.max(0, this.transitionTimer - APPEAR_FADE_SPEED*event.tick);
                this.appearTimer -= APPEAR_SPEED*event.tick;
                return;
            }
        }

        if (this.transitionTimer > 0) {

            if ((this.transitionTimer -= TRANSITION_SPEED* event.tick) < 0) {

                if (this.fadingOut) {

                    if (this.phase < 2) {

                        if ((++ this.phase) == 2) {

                            event.playSample(SoundEffect.IntroMusic);
                        }
                        this.fadingOut = false;
                        this.transitionTimer = 1.0;
                        return;
                    }
                    else {

                        event.changeScene("c", event);
                    }
                }
                this.transitionTimer = 0.0;
            }
            return;
        }

        if (this.phase < 2 && (this.animationTimer += event.tick) >= INTRO_TEXT_TIME) {

            this.animationTimer = 0;
            this.transitionTimer = 1.0;
            this.fadingOut = true;
        }
        else if (this.phase == 2 &&
            event.getAction(Action.Choose) == InputState.Pressed) {

            this.phase = 3;
            event.playSample(SoundEffect.Pause);
        }
        else if (this.phase == 3) {

            if (this.yesNoMenu.active) {
                
                this.yesNoMenu.update(event);
            }
            else {

                this.menu.update(event, false);
            }
        }
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.moveTo();
        canvas.clear("#000000");

        if (this.phase < 2) {

            this.drawIntro(canvas);
            return;
        }

        this.drawLogo(canvas);
        if (this.appearTimer > 0.0) {

            drawTransition(canvas, this.transitionTimer, this.fadingOut);
            return; 
        }

        if (this.phase == 3) {

            if (this.yesNoMenu.active) {

                canvas.drawText(BitmapAsset.FontWhite, "CLEAR PROGRESS?", 
                    canvas.width/2, canvas.height/2 + 8, -1, 0, Align.Center);
                this.yesNoMenu.draw(canvas, 0, 40);
            }
            else {

                this.menu.draw(canvas, 0, 32, false);
            }
        }
        else if (this.animationTimer < 0.5) {

            canvas.drawText(BitmapAsset.FontYellow, 
                "PRESS ENTER OR SPACE", 
                canvas.width/2, canvas.height/2 + 32, 
                -1, 0, Align.Center);
        }

        canvas.drawText(BitmapAsset.FontWhite, "*2024 JANI NYK@NEN", 
            canvas.width/2, canvas.height - 12, -1, 0, Align.Center);

        drawTransition(canvas, this.transitionTimer, this.fadingOut);
    }


    public dispose() : number | undefined {
        
        return undefined;
    }
}