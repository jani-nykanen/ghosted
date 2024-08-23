import { applyPalette, createBigText, cropBitmap } from "./bitmapgenerator.js";
import { Bitmap, Canvas } from "./canvas.js";
// import { AudioPlayer } from "../audio/audioplayer.js";
import { Ramp } from "./sample.js";
import { ProgramEvent } from "./event.js";
import { BITMAP_FONT_WHITE, BITMAP_GAME_ART, BITMAP_RAW_FONT, BITMAP_RAW_GAME_ART } from "./mnemonics.js";



type PaletteLookup = [number, number, number, number][];


const TRANSPARENT_COLOR : number = 0b100;


const PALETTE_TABLE : number[] = [

    0b100, // 0 Transparent

    0, // 1 Black
    511, // 2 White
    0b011011011, // 3 Dark gray
    0b101101101, // 4 Light gray

];


const GAME_ART_PALETTE_TABLE : string[] = [

];



const generatePaletteLookup = () : PaletteLookup => {

    const MULTIPLIER : number = 255/7;

    const out : number[][] = new Array<number[]> ();

    for (let i = 0; i < 512; ++ i) {

        const r : number = (i << 6) & (0b111000000);
        const g : number = (i << 3) & (0b111000);
        const b : number = i & (0b111);

        out[i] = [
            (r*MULTIPLIER) | 0, 
            (g*MULTIPLIER) | 0, 
            (b*MULTIPLIER) | 0,
            i == TRANSPARENT_COLOR ? 0 : 255];
    }
    return out as PaletteLookup;
}



const generateGameArt = (rgb333 : PaletteLookup, event : ProgramEvent) : void => {

    event.addBitmap(BITMAP_GAME_ART, 
        applyPalette(event.getBitmap(BITMAP_RAW_GAME_ART), 
            GAME_ART_PALETTE_TABLE, PALETTE_TABLE, rgb333)
        );
}



const generateFonts = (rgb333 : PaletteLookup, event : ProgramEvent) : void => {

    const bmpFontRaw : Bitmap = event.getBitmap(BITMAP_RAW_FONT);
    const fontWhite : Bitmap = applyPalette(bmpFontRaw, 
        (new Array<string>(16*4)).fill("0002"), 
        PALETTE_TABLE, rgb333);

    event.addBitmap(BITMAP_FONT_WHITE, fontWhite);
}


// Hmm, generating assets from event...
export const generateAssets = (event : ProgramEvent) : void => {

    const rgb333 : PaletteLookup = generatePaletteLookup();

    // Bitmaps
    generateGameArt(rgb333, event);
    generateFonts(rgb333, event);
}
