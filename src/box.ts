import { Canvas } from "./canvas.js";


export const drawBox = (canvas : Canvas, dx : number, dy : number, dw : number, dh : number) : void => {

    for (let i = 2; i >= 0 ; -- i) {

        canvas.fillRect(dx - i, dy - i, 
            dw + i*2, dh + i*2, 
            ["#000000", "#929292", "#ffffff"][i]);
    }
}
