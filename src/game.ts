import { Canvas, Flip } from "./canvas.js";
import { ProgramEvent } from "./event.js";
import { BITMAP_FONT_WHITE, BITMAP_GAME_ART } from "./mnemonics.js";
import { Scene, SceneParameter } from "./scene.js";
import { Tilemap } from "./tilemap.js";
import { LEVEL_DATA } from "./leveldata.js";
import { drawWallMap, generateWallMap } from "./wallmap.js";


export class Game implements Scene {


    private baseMap : Tilemap | undefined = undefined;
    private wallMap : number[] | undefined = undefined;


    constructor() {

    }


    public onChange(param : SceneParameter, event : ProgramEvent) : void {

        // TODO: Get the level index from param?

        this.baseMap = new Tilemap(LEVEL_DATA[0]);
        this.wallMap = generateWallMap(this.baseMap);
    }


    public update(event : ProgramEvent) : void {
        
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.clear("#006db6");
        canvas.drawText(BITMAP_FONT_WHITE, "HELLO WORLD!", 2, 2, -1);
        // canvas.drawBitmap(BITMAP_GAME_ART, Flip.None, 16, 16);

        canvas.moveTo(canvas.width/2 - this.baseMap!.width*8, canvas.height/2 - this.baseMap!.height*8);
        drawWallMap(canvas, this.wallMap, this.baseMap.width, this.baseMap.height);
        canvas.moveTo();
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }

}