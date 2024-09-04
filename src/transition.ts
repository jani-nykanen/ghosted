import { Canvas } from "./canvas.js";


export const drawTransition = (canvas : Canvas, transitionTimer : number, fadingOut : boolean) : void => {

    const FADE_STEPS : number = 7;

    if (transitionTimer <= 0) {

        return;
    }

    let t : number = fadingOut ? 1.0 - transitionTimer : transitionTimer;
    t = ((t*FADE_STEPS) | 0)/FADE_STEPS;

    canvas.setColor("rgba(0,0,0," + String(t) + ")");
    canvas.fillRect();
    canvas.setColor();
}
