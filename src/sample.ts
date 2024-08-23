import { clamp } from "./math.js";


export const enum Ramp {

    Instant = 0,
    Linear = 1,
    Exponential = 2
};


export class Sample {


    private readonly ctx : AudioContext;

    private baseSequence : number[];
    private baseVolume : number;
    private type : OscillatorType;
    private ramp : Ramp;
    private attack : number = 0.0;

    private oscillator : OscillatorNode | undefined = undefined;


    constructor(ctx : AudioContext, sequence : number[], 
        baseVolume : number, type : OscillatorType,
        ramp : Ramp, attack : number = 1.0) {

        this.ctx = ctx;

        this.baseSequence = Array.from(sequence);

        this.baseVolume = baseVolume;
        this.type = type;
        this.ramp = ramp;
        this.attack = attack;
    }


    public play(volume : number) : void {
        
        const functions : string[] = ["setValueAtTime", "linearRampToValueAtTime", "exponentialRampToValueAtTime"]; 

        const time : number = this.ctx.currentTime;
        const osc : OscillatorNode = this.ctx.createOscillator();
        const gain : GainNode = this.ctx.createGain();
        const func : string = functions[this.ramp];
        
        osc.type = this.type;

        volume *= this.baseVolume;

        let latestVolume : number = this.baseSequence[2]*volume;

        osc.frequency.setValueAtTime(this.baseSequence[0], time);
        gain.gain.setValueAtTime(this.attack*latestVolume, time);

        // TODO: It feels weird to start from index 0 since
        // the first "note" is assigned double. However, it does
        // not seem to play anything otherwise

        let timer : number = 0.0;
        for (let i = 0; i < this.baseSequence.length; i += 3) {

            const freq : number = this.baseSequence[i];
            const len : number = this.baseSequence[i + 1];

            latestVolume = clamp(this.baseSequence[i + 2]*volume, 0.0001, 1.0);

            osc.frequency[func](freq, time + timer);
            gain.gain[func](latestVolume, time + timer);

            timer += 1.0/60.0*len;
        }
        gain.gain.exponentialRampToValueAtTime(latestVolume*0.50, time + timer);
        
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(time);

        osc.stop(time + timer);
        osc.onended = () : void => osc.disconnect();
        
        this.oscillator?.disconnect();
        this.oscillator = osc;
    }
}
