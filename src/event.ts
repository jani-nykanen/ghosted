import { Canvas, Bitmap } from "./canvas.js";
import { Ramp, Sample } from "./sample.js";
import { Scene } from "./scene.js";


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
    private preventedKeys : Array<string>;
    private actions : Map<number, string[]>;
    private anyKeyPressed : boolean = false;


    // Asset manager
    private loadCount : number = 0;
    private assetCount : number = 0;
    private bitmaps : Map<number, Bitmap>;
    private samples : Map<number, Sample>;


    // Audio player
    private audioContext : AudioContext | undefined = undefined;
    private globalVolume : number;
    private enabled : boolean;


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
        this.actions = new Map<number, string[]> ();

        window.addEventListener("keydown", (e : KeyboardEvent) => {

            if (this.preventedKeys.includes(e.code)) {

                e.preventDefault();
            }
            this.keyEvent(e.code, InputState.Pressed);
        });

        window.addEventListener("keyup", (e : KeyboardEvent) => {

            if (this.preventedKeys.includes(e.code)) {

                e.preventDefault();
            }
            this.keyEvent(e.code, InputState.Released);
        });

        window.addEventListener("mousedown", () => { window.focus(); });
        window.addEventListener("mousemove", () => { window.focus();});
        window.addEventListener("contextmenu", (e : MouseEvent) => e.preventDefault());

        // Assets
        this.bitmaps = new Map<number, Bitmap> ();
        this.samples = new Map<number, Sample> ();

        // Audio
        this.enabled = true;
        this.globalVolume = globalVolume;

        // Scene manager
        this.scenes = new Map<string, Scene> ();
    }


    //
    // Input
    //


    private keyEvent(key : string, state : InputState) : void {

        if (this.keys.get(key) === state-2)
            return;

        this.keys.set(key, state);
        this.anyKeyPressed ||= Boolean(state & 1);
    }


    public updateInput() : void {

        for (const k of this.keys.keys()) {

            const v : InputState = this.keys.get(k) ?? InputState.Up;
            if (v > 1) {
                
                this.keys.set(k, v-2);
            }
        }
        this.anyKeyPressed = false;
    }


    public addAction(index : number, keys : string[], prevent : boolean = true) : void {

        this.actions.set(index, Array.from(keys));
        if (prevent) {

            this.preventedKeys.push(...keys);
        }
    }


    public getAction(index : number) : InputState {

        const keys : string[] | undefined = this.actions.get(index) ?? [];
        for (const k of keys) {
            
            const state : InputState = this.keys.get(k) ?? InputState.Up;
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
    }


    public createSample(index : number,
        sequence : number[], 
        baseVolume : number = 1.0,
        type : OscillatorType = "square",
        ramp : Ramp = Ramp.Exponential,
        attackTime : number = 0.40) : void {

        this.samples.set(index, new Sample(this.audioContext!, sequence, baseVolume, type, ramp, attackTime))
    }


    public playSample(index : number, volume : number = 0.60) : void {

        if (!this.enabled) {

            return;
        }
        try {

            this.getSample(index)?.play(volume*this.globalVolume);
        }
        catch (e) {}
    }


    public toggleAudio = (state : boolean = !this.enabled) : boolean => (this.enabled = state);


    public setGlobalVolume(vol : number) : void {

        this.globalVolume = vol;
    }


    //
    // Scene manager
    //


    public addScene(name : string, scene : Scene, makeActive : boolean = true) : void {

        this.scenes[name] = scene;
        if (this.activeScene === undefined || makeActive) {

            this.activeScene = scene;
        }
    }


    public changeScene(newScene : string, event : ProgramEvent) : void {

        const scene : Scene | undefined = this.scenes[newScene];

        scene?.onChange?.(this.activeScene?.dispose?.(), event);
        this.activeScene ??= scene;
    }
}
