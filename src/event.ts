import { Canvas, Bitmap } from "./canvas.js";
import { OscType, Ramp, Sample } from "./sample.js";
import { Scene } from "./scene.js";


// Heh, class action
class Action {

    
    public keys : string[];
    public specialKeys : string[];


    constructor(keys : string[], specialKeys : string[]) {

        this.keys = Array.from(keys);
        this.specialKeys = Array.from(specialKeys);
    }
}


export const enum InputState {

    Up = 0,
    Down = 1,
    Released = 2,
    Pressed = 3,

    DownOrPressed = 1
};


export const enum TransitionType {
    None = 0,
    Fade = 1,
    Circle = 2,
};


export class ProgramEvent {


    private readonly canvas : Canvas;
    public readonly tick : number = 1.0;


    // Input
    private keys : Map<string, InputState>;
    private preventedKeys : string[];
    private specialKeys : Map<string, InputState>;
    private preventedSpecialKeys : string[];
    private actions : Map<number, Action>;
    private anyKeyPressed : boolean = false;


    // Asset manager
    private loadCount : number = 0;
    private assetCount : number = 0;
    private bitmaps : Map<number, Bitmap>;
    private samples : Map<number, Sample>;


    // Audio player
    private audioContext : AudioContext | undefined = undefined;
    private globalVolume : number;
    private audioEnabled : boolean;


    // Scene manager
    private scenes : Map<string, Scene>;
    // This is public for "faster" (well, "shorter" (in bytes) ) access
    public activeScene : Scene | undefined = undefined;


    public get screenWidth() : number {

        return this.canvas.width;
    }
    public get screenHeight() : number {

        return this.canvas.height;
    }

    public get anyPressed() : boolean {

        return this.anyKeyPressed; 
    }


    constructor(canvas : Canvas, globalVolume : number) {

        this.canvas = canvas;

        //
        // Input
        //
        this.keys = new Map<string, InputState> ();
        this.preventedKeys = new Array<string> ();

        this.specialKeys = new Map<string, InputState> ();
        this.preventedSpecialKeys = new Array<string> ();

        this.actions = new Map<number, Action> ();

        window.addEventListener("keydown", (e : KeyboardEvent) => {

            if (this.preventedKeys.includes(e.code) ||
                this.preventedSpecialKeys.includes(e.key)) {

                e.preventDefault();
            }
            this.keyEvent(e.code, InputState.Pressed);
            this.specialKeyEvent(e.key, InputState.Pressed);
        });

        window.addEventListener("keyup", (e : KeyboardEvent) => {

            if (this.preventedKeys.includes(e.code) ||
                this.preventedSpecialKeys.includes(e.key)) {

                e.preventDefault();
            }
            this.keyEvent(e.code, InputState.Released);
            this.specialKeyEvent(e.key, InputState.Released);
        });

        window.addEventListener("mousedown", () => { window.focus(); });
        window.addEventListener("mousemove", () => { window.focus();});
        window.addEventListener("contextmenu", (e : MouseEvent) => e.preventDefault());

        // Assets
        this.bitmaps = new Map<number, Bitmap> ();
        this.samples = new Map<number, Sample> ();

        // Audio
        this.audioEnabled = true;
        this.globalVolume = globalVolume;

        // Scene manager
        this.scenes = new Map<string, Scene> ();
    }


    //
    // Input
    //


    private keyEvent(key : string, state : InputState) : void {

        if (this.keys.get(key) === state - 2)
            return;

        this.keys.set(key, state);
        this.anyKeyPressed ||= Boolean(state & 1);
    }


    private specialKeyEvent(key : string, state : InputState) : void {

        if (this.specialKeys.get(key) === state - 2)
            return;

        this.specialKeys.set(key, state);
        this.anyKeyPressed ||= Boolean(state & 1);
    }


    public updateInput() : void {

        for (const k of this.keys.keys()) {

            const v : InputState = this.keys.get(k) ?? InputState.Up;
            if (v > 1) {
                
                this.keys.set(k, v - 2);
            }
        }
        for (const k of this.specialKeys.keys()) {

            const v : InputState = this.specialKeys.get(k) ?? InputState.Up;
            if (v > 1) {
                
                this.specialKeys.set(k, v - 2);
            }
        }
        this.anyKeyPressed = false;
    }


    public addAction(index : number, keys : string[], 
        specialKeys : string[] = [], 
        prevent : boolean = true) : void {

        this.actions.set(index, new Action(keys, specialKeys));
        if (prevent) {

            this.preventedKeys.push(...keys);
            this.preventedSpecialKeys.push(...specialKeys);
        }
    }


    public getAction(index : number) : InputState {

        const a : Action | undefined = this.actions.get(index);
        if (a === undefined) {

            return InputState.Up;
        }

        for (const k of a.keys) {
            
            const state : InputState = this.keys.get(k) ?? InputState.Up;
            if (state != InputState.Up) {

                return state;
            }
        }

        for (const k of a.specialKeys) {
            
            const state : InputState = this.specialKeys.get(k) ?? InputState.Up;
            if (state != InputState.Up) {

                return state;
            }
        }
        
        return InputState.Up;
    }


    //
    // Assets
    //


    public addBitmap(index : number, bmp : Bitmap) : void {

        this.bitmaps.set(index, bmp);
    }


    public getBitmap(index : number) : Bitmap | undefined {

        return this.bitmaps.get(index);
    }


    public getSample(index : number) : Sample | undefined {

        return this.samples.get(index);
    }


    public loadBitmap(index : number, path : string) : void {

        ++ this.assetCount;

        const img : HTMLImageElement = new Image();
        img.onload = (_ : Event) : void => {

            ++ this.loadCount;
            this.bitmaps.set(index, img);
        }
        img.src = path;
    }


    public loaded = () : boolean => this.loadCount >= this.assetCount;
    public loadedRatio = () : number => this.assetCount == 0 ? 1.0 : this.loadCount/this.assetCount;


    //
    // Audio player
    //

    public initialize() : void {

        this.audioContext = new AudioContext();
        // Possibly redundant
        try {

            this.audioContext.resume();
        } catch(e){};
    }


    public createSample(index : number,
        sequence : number[], 
        baseVolume : number = 1.0,
        type : OscType = OscType.Square,
        ramp : Ramp = Ramp.Exponential,
        attackTime : number = 0.40) : void {

        this.samples.set(index, new Sample(this.audioContext!, sequence, baseVolume, type, ramp, attackTime))
    }


    public playSample(index : number, volume : number = 0.60) : void {

        if (!this.audioEnabled) {

            return;
        }
        try {

            this.getSample(index)?.play(volume*this.globalVolume);
        }
        catch (e) {}
    }


    public toggleAudio = (state : boolean = !this.audioEnabled) : boolean => (this.audioEnabled = state);


    public setGlobalVolume(vol : number) : void {

        this.globalVolume = vol;
    }


    public getAudioString = () : string => "AUDIO: " + (this.audioEnabled ? "ON " : "OFF");


    //
    // Scene manager
    //


    public addScene(name : string, scene : Scene, makeActive : boolean = false) : void {

        this.scenes.set(name, scene);
        if (this.activeScene === undefined || makeActive) {

            this.activeScene = scene;
        }
    }


    public changeScene(newScene : string, event : ProgramEvent) : void {

        const scene : Scene | undefined = this.scenes.get(newScene);

        scene?.onChange?.(this.activeScene?.dispose?.(), event);
        this.activeScene = scene ?? this.activeScene;
    }
    
}
