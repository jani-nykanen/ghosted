import { ProgramEvent } from "./event.js";
import { Canvas } from "./canvas.js";


// To avoid "any"
export type SceneParameter = number | string | undefined;


export interface Scene {

    onChange?(param : SceneParameter, event : ProgramEvent) : void;
    update(event : ProgramEvent) : void;
    redraw(canvas : Canvas) : void;
    dispose?() : SceneParameter;
}

