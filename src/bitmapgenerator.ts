import { Bitmap } from "./canvas.js";


const createEmptyCanvas = (width : number, height : number) : HTMLCanvasElement => {

    const canvas : HTMLCanvasElement = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    return canvas;
}


const convertTile = (imageData : ImageData, 
    dx : number, dy : number, dw : number, dh : number, offset : number,
    colorTable : number[], paletteIndices : number[], 
    paletteLookUp : [number, number, number, number][]) : void => {

    for (let y = dy; y < dy + dh; ++ y) {

        for (let x = dx; x < dx + dw; ++ x) {

            const i : number = y*offset + x;
            const colorIndex : number = (imageData.data[i*4]/85) | 0;
            const paletteEntry : number[] = paletteLookUp[paletteIndices[colorTable[colorIndex] ?? 0] ?? 0] ?? [];

            for (let j = 0; j < 4; ++ j) {

                imageData.data[i*4 + j] = paletteEntry[j] ?? 255;
            }
        }
    }
}


export const applyPalette = (image : Bitmap,
    colorTables: (string | undefined) [], 
    paletteIndices : number[], 
    paletteLookUp : [number, number, number, number][]) : Bitmap => {

    if (image === undefined) {

        return undefined;
    }

    const canvas : HTMLCanvasElement = createEmptyCanvas(image.width, image.height);
    const ctx : CanvasRenderingContext2D = canvas.getContext("2d")!;

    ctx.drawImage(image, 0, 0);

    const imageData : ImageData = ctx.getImageData(0, 0, image.width, image.height);

    const w : number = (canvas.width/8) | 0;
    const h : number = (canvas.height/8) | 0;

    let j = 0;
    for (let y = 0; y < h; ++ y) {

        for (let x = 0; x < w; ++ x) {

            if (j >= colorTables.length)
                continue;

            const colorTable : number[] = (colorTables[j] ?? "0000").split("").map((s : string) => parseInt(s, 32));
            convertTile(imageData, 
                x*8, y*8, 8, 8, 
                image.width, colorTable, paletteIndices, paletteLookUp);
            ++ j;
        }
    }
    ctx.putImageData(imageData, 0, 0);

    return canvas;
} 


export const cropBitmap = (source : Bitmap, sx : number, sy : number, sw : number, sh : number) : Bitmap => {

    if (source === undefined) {

        return undefined;
    }

    const canvas : HTMLCanvasElement = createEmptyCanvas(sw, sh);
    const ctx : CanvasRenderingContext2D = canvas.getContext("2d")!;

    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);

    return canvas;
}


export const createBigText = (text : string, font : string, 
    width : number, height : number, fontHeight : number, depth : number,
    colors : [[number, number, number], [number, number, number]],
    threshold : number = 127) : Bitmap => {

    const canvas : HTMLCanvasElement = createEmptyCanvas(width, height);
    const ctx : CanvasRenderingContext2D = canvas.getContext("2d")!;

    ctx.font = font;
    ctx.textAlign = "center";

    const lines : string[] = text.split("\n");

    for (let y = depth - 1; y >= 0; -- y) {

        ctx.fillStyle = y == 0 ? "#ffffff" : "#000000";

        let line : number = 0;
        for (let l of lines) {

            ctx.fillText(l, width/2, y + (line + 1)*fontHeight);
            ++ line;
        }
    }

    const imageData : ImageData = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < width*height; ++ i) {
        
        if (imageData.data[i*4 + 3] < threshold) {

            imageData.data[i*4 + 3] = 0;
            continue;
        }

        const colorIndex : number = imageData.data[i*4] > 128 ? 0 : 1;
        for (let j = 0; j < 3; ++ j) {

            imageData.data[i*4 + j] = colors[colorIndex][j];
        }
        imageData.data[i*4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);

    return canvas;
}

