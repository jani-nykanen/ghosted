import { applyPalette, createBigText, createCustomBitmap, cropBitmap } from "./bitmapgenerator.js";
import { Bitmap, Canvas } from "./canvas.js";
import { OscType, Ramp } from "./sample.js";
import { ProgramEvent } from "./event.js";
import { BitmapAsset, SoundEffect } from "./mnemonics.js";
import { Note } from "./notes.js";


type PaletteLookup = [number, number, number, number][];


const TRANSPARENT_COLOR : number = 0b100;


const PALETTE_TABLE : number[] = [

    0b100, // 0 Transparent

    0, // 1 Black
    511, // 2 White

    // Walls
    0b010010010, // 3 Darkest gray
    0b100100100, // 4 Just gray
    0b110110110, // 5 Very light gray

    // Player
    0b011101000, // 6 Darker green
    0b101111000, // 7 Light green

    // Hole
    0b011010000, // 8 Dark yellowish brownish thing

    // Frame
    0b011001000, // 9 Darkest brown
    0b100010000, // A Darker brown
    0b101011000, // B Brown
    0b111101010, // C Yellowish

    // Ghost (& ectoplasm)
    0b101101110, // D Purplish thing
    0b110010000, // E Orangish red
    0b011011101, // F Darker purplish thing

    // Coin
    0b111111011, // G Yellow
    0b111100000, // H Orange

    // Misc
    0b011101111, // I Blue

    // Button
    0b101010011, // J Darker pink
    0b111100101, // K Pink
    0b111110110, // L Bright pink

    // Arrows
    0b001011101, // M Dark blue
    0b101111111, // N Bright blue
];


const GAME_ART_PALETTE_TABLE : string[] = [

    "1042", "1043", "1452", "1452" ,"1452", "1453", "10BC", "10BC",
    "1042", "1043", "1452", "1453" ,"1452", "1453", "10A9", "10A9",
    "1067", "1067", "1067", "1067", "1067", "1067", "1067", "1067",
    "1067", "1067", "1067", "1067", "1067", "1067", "1067", "1067",
    "1000", "1000", "1000", "1000", "10BC", "10B9", "1080", "1080",
    "1000", "1000", "10EG", "000A", "10BC", "10B9", "1080", "1080",
    "10D2", "10D2", "100B", "1067", "10D2", "10DF", "108A", "108A",
    "10D2", "10D2", "1000", "1000", "10DF", "10DF", "10DF", "10DF",
    "10HG", "10HG", "10HG", "0007", "000H", "000I", "10EH", "10EH",
    "10HG", "10HG", "10HG", "4052", "4052", "4052", "10EH", "10EH",
    "10LK", "10LK", "10KJ", "10KJ", "10KL", "10KJ", "J000", "J000",
    "10JK", "10JK", "100J", "100J", "10KL", "10KJ", "J000", "J000",
    "10IN", "10IN", "10IN", "10MN", "100M", "100M", "0000", "0000",
    "10MI", "10MI", "10IN", "10MN", "100M", "100M", "0000", "0000",

];



const generatePaletteLookup = () : PaletteLookup => {

    const MULTIPLIER : number = 255.0/7.0;

    const out : number[][] = new Array<number[]> ();

    for (let i = 0; i < 512; ++ i) {

        let r : number = (i >> 6) & 7;
        let g : number = (i >> 3) & 7;
        let b : number = i & 7;

        out[i] = [
            (r*MULTIPLIER) | 0, 
            (g*MULTIPLIER) | 0, 
            (b*MULTIPLIER) | 0,
            i == TRANSPARENT_COLOR ? 0 : 255];
    }
    
    return out as PaletteLookup;
}


const generateGameArt = (rgb333 : PaletteLookup, event : ProgramEvent) : void => {

    const bmpGameArtBase : Bitmap = applyPalette(event.getBitmap(BitmapAsset.RawGameArt), 
        GAME_ART_PALETTE_TABLE, PALETTE_TABLE, rgb333);

    event.addBitmap(BitmapAsset.GameArt, 
        createCustomBitmap(bmpGameArtBase!.width, bmpGameArtBase!.height,
            (ctx : CanvasRenderingContext2D) : void => {

                // Fill wall
                ctx.fillStyle = "#dbdbdb";
                ctx.fillRect(2, 2, 12, 12);

                // Fill rock
                ctx.fillStyle = "#924900";
                ctx.fillRect(37, 38, 6, 9);

                // Fill pink block
                ctx.fillStyle = "#ffb6db";
                ctx.fillRect(35, 83, 11, 11);

                // Base
                ctx.drawImage(bmpGameArtBase, 0, 0);
            }));
}


const generateFonts = (rgb333 : PaletteLookup, event : ProgramEvent) : void => {

    const bmpFontRaw : Bitmap = event.getBitmap(BitmapAsset.RawFont);

    const bmpFontWhite : Bitmap = applyPalette(bmpFontRaw, 
        (new Array<string>(16*4)).fill("0002"), 
        PALETTE_TABLE, rgb333);
    const bmpFontBlack : Bitmap = applyPalette(bmpFontRaw, 
        (new Array<string>(16*4)).fill("0001"), 
        PALETTE_TABLE, rgb333);

    event.addBitmap(BitmapAsset.FontWhite, bmpFontWhite);
    event.addBitmap(BitmapAsset.FontYellow, applyPalette(bmpFontRaw, 
        (new Array<string>(16*4)).fill("000G"), 
        PALETTE_TABLE, rgb333));
    event.addBitmap(BitmapAsset.FontBlack, bmpFontBlack);

    event.addBitmap(BitmapAsset.FontOutlines, 
        createCustomBitmap(256, 64,
            (ctx : CanvasRenderingContext2D) : void => {

                for (let y = 0; y < 4; ++ y) {

                    for (let x = 0; x < 16; ++ x) {
            
                        const dx : number = x*16 + 4;
                        const dy : number = y*16 + 6
            
                        // Outlines
                        for (let i = -1; i <= 1; ++ i) {
            
                            for (let j = -1; j <= 1; ++ j) {
            
                                // if (i == j) continue;
                                ctx.drawImage(bmpFontBlack, x*8, y*8, 8, 8, dx + i, dy + j, 8, 8);
                            }
                        }
            
                        // Base characters
                        ctx.drawImage(bmpFontWhite, x*8, y*8, 8, 8, dx, dy, 8, 8);
                    }
                }
            }));
}


const generateBigText = (event : ProgramEvent) : void => {

    event.addBitmap(BitmapAsset.StageClear,
        createBigText("STAGE\nCLEAR!", "bold 22px Arial", 96, 48, 20, 3, [
            [182, 255, 0],
            [73, 182, 0]
        ]));
}


const generateSamples = (event : ProgramEvent) : void => {

    event.createSample(SoundEffect.PushBoulder,
        [96, 6, 1.0,
         80, 4, 0.20], 
        0.80,
        OscType.Sawtooth, 
        Ramp.Exponential);

    event.createSample(SoundEffect.FallingBoulder,
        [256, 4, 1.0,
        192, 6, 0.70,
        160, 12, 0.20], 
        1.25,
        OscType.Triangle, 
        Ramp.Exponential);

    event.createSample(SoundEffect.Splash,
        [96, 3, 0.60,
         128, 5, 1.0,
         160, 12, 0.20], 
        0.50,
        OscType.Square, 
        Ramp.Exponential);

    event.createSample(SoundEffect.SpreadingHole,
        [160, 12, 1.0,
        192, 6, 0.70,
        256, 4, 0.20], 
        1.25,
        OscType.Triangle, 
        Ramp.Exponential);

    event.createSample(SoundEffect.EmergingSlime,
        [224, 2, 0.70,
         160, 3, 1.0,
         144, 6, 0.20], 
        1.40,
        OscType.Triangle, 
        Ramp.Exponential);
        
    event.createSample(SoundEffect.Coin,
        [160, 4, 0.60,
         100, 2, 0.80,
         256, 8, 1.00],
        0.40,
        OscType.Square, 
        Ramp.Instant);

    event.createSample(SoundEffect.Jump,
        [64,  4, 0.20,
        160, 3, 0.80,
        256, 2, 0.50], 
        0.80,
        OscType.Sawtooth, 
        Ramp.Exponential);

    event.createSample(SoundEffect.Transform,
        [96, 3, 0.50,
         128, 4, 0.75,
         192, 6, 1.00,
         256, 8, 0.60,],
        0.40,
        OscType.Square, 
        Ramp.Exponential);

    event.createSample(SoundEffect.Undo,
        [128, 5, 1.0,
         96, 3, 0.50], 
        0.50,
        OscType.Sawtooth, 
        Ramp.Instant);

    event.createSample(SoundEffect.Restart,
        [160, 8, 1.0,
         128, 6, 0.30], 
        0.40,
        OscType.Square, 
        Ramp.Instant);

    event.createSample(SoundEffect.Walk,
        [160, 2, 1.0,
         96, 1, 0.50   
        ], 
        0.60,
        OscType.Sawtooth, 
        Ramp.Exponential);

    for (let i = 0; i < 2; ++ i) {

        event.createSample(SoundEffect.Select + i,
            [128 - i*8, 8 + i*2, 1.0,
            96 - i*8, 4, 0.20], 
            0.30,
            OscType.Square, 
            Ramp.Instant);
    }
}


const generateMusic = (event : ProgramEvent) : void => {

    event.createSample(SoundEffect.StageClear,
        [
        Note.C3, 15, 0.50,
        Note.E3, 7.5, 0.70,
        Note.D3, 7.5, 1.0,
        Note.F3, 7.5, 1.0,
        Note.E3, 7.5, 1.0,
        Note.G3, 15, 1.0,
        Note.A3, 30, 1.0,
        Note.A3, 15, 0.50,
        ], 
        0.40,
        OscType.Square, 
        Ramp.Instant);
}


// Hmm, generating assets from event...
export const generateAssets = (event : ProgramEvent) : void => {

    const rgb333 : PaletteLookup = generatePaletteLookup();

    // Bitmaps
    generateGameArt(rgb333, event);
    generateFonts(rgb333, event);
    generateBigText(event);
    
    // Samples
    generateSamples(event);
    generateMusic(event);
}
