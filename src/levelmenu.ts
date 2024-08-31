import { Align, Canvas, Flip } from "./canvas.js";
import { InputState, ProgramEvent } from "./event.js";
import { Scene } from "./scene.js";
import { Action, BitmapAsset, SoundEffect } from "./mnemonics.js";
import { Vector } from "./vector.js";
import { negMod } from "./math.js";


const HORIZONTAL_BUTTONS : number = 4;
const VERTICAL_BUTTONS : number = 3;

const BUTTON_COLORS_LIGHT : string[] = ["#000000", "#924900", "#ffb66d", "#db6d00"];
const BUTTON_SIZE_SHIFT : number[] = [0, 0, 1, 2];
const BUTTON_POS_SHIFT : number[] = [0, 0, -1, -1];


export class LevelMenu implements Scene {


    private cursorPos : Vector = new Vector();
    private activeButtonNumber : number = 0;


    private drawButton(canvas : Canvas, num : number,
        x : number, y : number, width : number, height : number) : void {

        const DEPTH : number = 4;

        const active : boolean = this.activeButtonNumber == num;

        for (let i = 0; i < 4; ++ i) {

            const dx : number = x + i + BUTTON_POS_SHIFT[i];
            const w : number = width - i*2 + BUTTON_SIZE_SHIFT[i];

            let dy : number = y + i + BUTTON_POS_SHIFT[i] + DEPTH;
            let h : number = height - i*2 + BUTTON_SIZE_SHIFT[i];
            if (!active) {

                dy -= DEPTH;
                if (i < 2) {

                    h += DEPTH;
                }
            }

            canvas.setColor(BUTTON_COLORS_LIGHT[i]);

            canvas.fillRect(dx, dy, w, h);
        }

        canvas.drawText(BitmapAsset.FontOutlines, String(num), 
            x + width/2 - 1, y + height/2 - 10 + (active ? DEPTH : 0), -9, 0, Align.Center);

        // Player
        if (active) {

            canvas.setAlpha(0.25);
            canvas.drawBitmap(BitmapAsset.GameArt, Flip.None,
                x + width/2 - 8, y + height/2, 
                16, 56, 16, 8);
            canvas.setAlpha();

            canvas.drawBitmap(BitmapAsset.GameArt, Flip.None,
                x + width/2 - 8, y + height/2 - 12, 
                0, 16, 16, 8);
            canvas.drawBitmap(BitmapAsset.GameArt, Flip.None,
                x + width/2 - 8, y + height/2 - 4, 
                32, 16, 16, 8);
        }

    }


    private drawButtons(canvas : Canvas) : void {

        const BUTTON_WIDTH : number = 32;
        const BUTTON_HEIGHT : number = 24;
        const BUTTON_XOFF : number = 12;
        const BUTTON_YOFF : number = 12;

        const left : number = canvas.width/2 - 
            (BUTTON_WIDTH*HORIZONTAL_BUTTONS + BUTTON_XOFF*(HORIZONTAL_BUTTONS - 1))/2;
        const top : number = canvas.height/2 - 
            (BUTTON_HEIGHT*VERTICAL_BUTTONS + BUTTON_YOFF*(VERTICAL_BUTTONS - 1))/2;

        for (let y = 0; y < VERTICAL_BUTTONS; ++ y) {

            for (let x = 0; x < HORIZONTAL_BUTTONS; ++ x) {

                const dx : number = left + x*(BUTTON_WIDTH + BUTTON_XOFF);
                const dy : number = top + y*(BUTTON_HEIGHT + BUTTON_YOFF);

                this.drawButton(canvas, 1 + y*HORIZONTAL_BUTTONS + x, dx, dy, BUTTON_WIDTH, BUTTON_HEIGHT);
            }
        }
    }


    public onChange(param : number | undefined, event : ProgramEvent) : void {
        
    }


    public update(event : ProgramEvent) : void {

        this.activeButtonNumber = 1 + this.cursorPos.y*HORIZONTAL_BUTTONS + this.cursorPos.x;

        if (event.getAction(Action.Choose) == InputState.Pressed) {

            event.playSample(SoundEffect.Select);
            event.changeScene("g", event);
            return;
        }

        let dx : number = 0;
        let dy : number = 0;

        if (event.getAction(Action.Right) == InputState.Pressed) {

            dx = 1;
        }
        else if (event.getAction(Action.Left) == InputState.Pressed) {

            dx = -1;
        }

        if (event.getAction(Action.Down) == InputState.Pressed) {

            dy = 1;
        }
        else if (event.getAction(Action.Up) == InputState.Pressed) {

            dy = -1;
        }

        if (dx != 0 || dy != 0) {

            event.playSample(SoundEffect.Choose);

            this.cursorPos.x = negMod(this.cursorPos.x + dx, HORIZONTAL_BUTTONS);
            this.cursorPos.y = negMod(this.cursorPos.y + dy, VERTICAL_BUTTONS);
        }
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.moveTo();
        canvas.clear("#246db6");

        canvas.drawText(BitmapAsset.FontOutlines, "SELECT LEVEL", canvas.width/2, 2, -8, 0, Align.Center);

        this.drawButtons(canvas);
    }


    public dispose() : number | undefined {
        
        return this.activeButtonNumber;
    }
}