import { applyPalette, createBigText, createCustomBitmap, cropBitmap } from "./bitmapgenerator.js";
import { Bitmap, Canvas } from "./canvas.js";
import { Ramp } from "./sample.js";
import { ProgramEvent } from "./event.js";
import { BitmapAsset } from "./mnemonics.js";



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

    // Hole
    0b011010000, // 8 Dark yellowish brownish thing

    // Frame
    0b011001000, // 9 Darkest brown
    0b100010000, // A Darker brown
    0b101011000, // B Brown
    0b111101010, // C Yellowish

    // Ghost
    0b101101110, // D Purplish thing
    0b110010000, // E Orangish red
];


const GAME_ART_PALETTE_TABLE : string[] = [

    "1042", "1043", "1452", "1452" ,"1452", "1453", "10BC", "10BC",
    "1042", "1043", "1452", "1453" ,"1452", "1453", "10A9", "10A9",
    "1067", "1067", "1067", "1067", "1067", "1067", "1067", "1067",
    "1067", "1067", "1067", "1067", "1067", "1067", "1067", "1067",
    "1000", "1000", "1000", "1000", "10BC", "10B9", "1080", "1080",
    "1000", "1000", "1000", "000A", "10BC", "10B9", "1080", "1080",
    "10D2", "10D2", "10E7", "0000", "0000", "0000", "108A", "108A",
    "10D2", "10D2", "0000", "0000", "0000", "0000", "0000", "0000",
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


// Hmm, generating assets from event...
export const generateAssets = (event : ProgramEvent) : void => {

    const rgb333 : PaletteLookup = generatePaletteLookup();

    // Bitmaps
    generateGameArt(rgb333, event);
    generateFonts(rgb333, event);
}
