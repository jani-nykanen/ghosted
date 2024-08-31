import { ProgramEvent } from "./event.js";
import { Canvas } from "./canvas.js";


export interface Scene {

    onChange?(param : number | undefined, event : ProgramEvent) : void;
    update(event : ProgramEvent) : void;
    redraw(canvas : Canvas) : void;
    dispose?() : number | undefined;
}

