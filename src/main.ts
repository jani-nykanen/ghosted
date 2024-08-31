import { generateAssets } from "./assetgenerator.js";
import { Align, Canvas } from "./canvas.js";
import { ProgramEvent } from "./event.js";
import { Game } from "./game.js";
import { Action, BitmapAsset } from "./mnemonics.js";
import { Program } from "./program.js";
import { LevelMenu } from "./levelmenu.js";


const initialEvent = (event : ProgramEvent) : void => {

    event.loadBitmap(BitmapAsset.RawFont, "f.png");
    event.loadBitmap(BitmapAsset.RawGameArt, "g.png");

    event.addScene("ls", new LevelMenu(), true);
    event.addScene("g", new Game());
}


const initialScreen = (canvas : Canvas) : void => {

    canvas.clear("#000000");
    canvas.drawText(BitmapAsset.RawFont, "PRESS ANY KEY", canvas.width/2, canvas.height/2 - 4, -1, 0, Align.Center);
}


const onloadEvent = (event : ProgramEvent) : void => {

    event.addAction(Action.Left, ["ArrowLeft", "KeyA"]);
    event.addAction(Action.Right, ["ArrowRight", "KeyD"]);
    event.addAction(Action.Up, ["ArrowUp", "KeyW"]);
    event.addAction(Action.Down, ["ArrowDown", "KeyS"]);
    event.addAction(Action.Choose, ["Space", "Enter"]);
    event.addAction(Action.Pause, ["Escape", "Enter"]);
    event.addAction(Action.Restart, ["KeyR"]);
    event.addAction(Action.Undo, ["Backspace", "KeyZ"]);
    event.addAction(Action.Back, ["Escape"]);

    generateAssets(event);
}


window.onload = () : void => (new Program(192, 576, 192, 576, 0.60)).run(initialEvent, initialScreen, onloadEvent);

