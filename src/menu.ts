import { Canvas } from "./canvas.js";
import { InputState, ProgramEvent } from "./event.js";
import { negMod } from "./math.js";
import { Action, BitmapAsset, SoundEffect } from "./mnemonics.js";
import { drawBox } from "./box.js";


export class MenuButton {


    
    private callback : (event : ProgramEvent, button? : MenuButton) => boolean;

    // Public to save bytes
    public text : string;

    
    constructor(text : string, callback : (event : ProgramEvent, button? : MenuButton) => boolean) {

        this.text = text;
        this.callback = callback;
    }


    public evaluate = (event : ProgramEvent) : boolean => this.callback(event, this);


    public clone() : MenuButton {

        return new MenuButton(this.text, this.callback);
    }
}



export class Menu {


    private buttons : MenuButton[];

    private cursorPos : number = 0;
    
    private height : number;
    private width : number;

    // Public to save bytes
    public active : boolean = false;


    constructor(buttons : MenuButton[], makeActive : boolean = false,
        fixedWidth : number | undefined = undefined, 
        fixedHeight : number | undefined = undefined) {

        this.buttons = buttons.map((_, i : number) : MenuButton  => buttons[i].clone());
        this.active = makeActive;

        this.width = fixedWidth ?? Math.max(...this.buttons.map(b => b.text.length + 2));
        this.height = fixedHeight ?? this.buttons.length;
    }


    public changeMenuText(buttonIndex : number, newText : string) : void {

        this.buttons[buttonIndex].text = newText;
    }


    public activate(cursorPos : number = this.cursorPos) : void {

        this.cursorPos = negMod(cursorPos, this.buttons.length);
        this.active = true;
    }


    public update(event : ProgramEvent, canQuit : boolean = false) : void {

        if (!this.active) {

            return;
        }

        if (canQuit && event.getAction(Action.Back) == InputState.Pressed) {
            
            event.playSample(SoundEffect.Pause);
            this.active = false;
            return;
        }
        

        const oldPos : number = this.cursorPos;

        if (event.getAction(Action.Up) == InputState.Pressed) {

            -- this.cursorPos;
        }
        else if (event.getAction(Action.Down) == InputState.Pressed) {

            ++ this.cursorPos;
        }

        if (oldPos != this.cursorPos) {

            this.cursorPos = negMod(this.cursorPos, this.buttons.length);
            
            event.playSample(SoundEffect.Undo);
        }

        if (event.getAction(Action.Choose) == InputState.Pressed) {

            if (this.buttons[this.cursorPos].evaluate(event)) {

                this.active = false;
            }
            event.playSample(SoundEffect.Select);
        }
    }


    public draw(canvas : Canvas, xoff : number = 0, yoff : number = 0, darken : boolean = false) : void {

        const DARKEN_ALPHA : number = 0.50;
        const FONT_YOFF : number = 12;

        if (!this.active) {

            return;
        }

        if (darken) {

            canvas.setColor("rgba(0,0,0," + String(DARKEN_ALPHA) + ")");
            canvas.fillRect();
        }

        const dx : number = canvas.width/2 - this.width*4 + xoff;
        const dy : number = canvas.height/2 - this.height*FONT_YOFF/2 + yoff;

        // Box
        drawBox(canvas, dx, dy, this.width*8, this.height*FONT_YOFF);
        // Text
        for (let i = 0; i < this.buttons.length; ++ i) {

            const b : MenuButton = this.buttons[i];
            
            const text : string = (i == this.cursorPos ? "$%" : "") + b.text;
            const font : number = BitmapAsset.FontWhite + Number(i == this.cursorPos);

            canvas.drawText(font, text, dx + 2, dy + 2 + i*FONT_YOFF, -1);
        }
    }
}
