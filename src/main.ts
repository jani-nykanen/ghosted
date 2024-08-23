import { generateAssets } from "./assetgenerator.js";
import { Align, Canvas } from "./canvas.js";
import { ProgramEvent } from "./event.js";
import { Game } from "./game.js";
import { ACTION_CHOOSE, ACTION_MOVE_DOWN, ACTION_MOVE_LEFT, ACTION_MOVE_RIGHT, ACTION_MOVE_UP, ACTION_PAUSE, ACTION_RESTART, ACTION_UNDO, BITMAP_RAW_FONT, BITMAP_RAW_GAME_ART } from "./mnemonics.js";
import { Program } from "./program.js";


const initialEvent = (event : ProgramEvent) : void => {

    event.loadBitmap(BITMAP_RAW_FONT, "f.png");
    event.loadBitmap(BITMAP_RAW_GAME_ART, "g.png");

    event.addScene("g", new Game(), true);
}


const initialScreen = (canvas : Canvas) : void => {

    canvas.clear("#000000");
    canvas.drawText(BITMAP_RAW_FONT, "PRESS ANY KEY", canvas.width/2, canvas.height/2 - 4, -1, 0, Align.Center);
}


const onloadEvent = (event : ProgramEvent) : void => {

    event.addAction(ACTION_MOVE_LEFT, ["ArrowLeft", "KeyA"]);
    event.addAction(ACTION_MOVE_RIGHT, ["ArrowRight", "KeyD"]);
    event.addAction(ACTION_MOVE_UP, ["ArrowUp", "KeyW"]);
    event.addAction(ACTION_MOVE_DOWN, ["ArrowDown", "KeyS"]);
    event.addAction(ACTION_CHOOSE, ["Space", "Enter"]);
    event.addAction(ACTION_PAUSE, ["Escape", "Enter"]);
    event.addAction(ACTION_RESTART, ["KeyR"]);
    event.addAction(ACTION_UNDO, ["Backspace, KeyZ"]);

    generateAssets(event);
}


window.onload = () : void => (new Program(256, 576, 192, 192, 0.60)).run(initialEvent, initialScreen, onloadEvent);

