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

    // Walls
    0b010010010, // 3 Darkest gray
    0b100100100, // 4 Just gray
    0b110110110, // 5 Very light gray

    // Player skin
    0b110100000, // 6 Darker beige
    0b111110100, // 7 Light beige
];


const GAME_ART_PALETTE_TABLE : string[] = [

    "1452", "1453", "1452", "1452" ,"1452", "1453", "0000", "0000",
    "1452", "1453", "1452", "1453" ,"1452", "1453", "0000", "0000",
    "1067", "1067", "1067", "1067", "1067", "1067", "1067", "1067",
    "1067", "1067", "1067", "1067", "1067", "1067", "1067", "1067",
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
