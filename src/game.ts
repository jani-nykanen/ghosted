import { Canvas } from "./canvas.js";
import { ProgramEvent } from "./event.js";
import { BITMAP_FONT_WHITE } from "./mnemonics.js";
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
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }

}