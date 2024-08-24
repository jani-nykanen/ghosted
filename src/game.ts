import { Canvas, Flip } from "./canvas.js";
import { ProgramEvent } from "./event.js";
import { BITMAP_FONT_WHITE, BITMAP_GAME_ART } from "./mnemonics.js";
import { Scene, SceneParameter } from "./scene.js";


export class Game implements Scene {


    public onChange(param : SceneParameter, event : ProgramEvent) : void {

        // Nah
    }


    public update(event : ProgramEvent) : void {
        
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.clear("#006db6");
        canvas.drawText(BITMAP_FONT_WHITE, "HELLO WORLD!", 2, 2, -1);

        canvas.drawBitmap(BITMAP_GAME_ART, Flip.None, 16, 16);
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }

}