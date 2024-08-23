import { Vector } from "./vector.js";
import { clamp } from "./math.js";


export type Bitmap = HTMLImageElement | HTMLCanvasElement | undefined;


export const enum Align {

    Left = 0,
    Center = 1,
    Right = 2
}


export const enum Flip {

    None = 0,
    Horizontal = 1,
    Vertical = 2,
    Both = 3 // == 1 | 2
}


export class Canvas {


    private canvas : HTMLCanvasElement;
    private ctx : CanvasRenderingContext2D;

    private translation : Vector = new Vector();

    private minWidth : number;
    private maxWidth : number;
    private minHeight : number;
    private maxHeight : number;

    public get width() : number {

        return this.canvas.width;
    }
    public get height() : number {

        return this.canvas.height;
    }

    public readonly getBitmap : ((index : number) => Bitmap) = () => undefined;


    constructor(canvasElement : HTMLCanvasElement | null,
        minWidth : number = canvasElement?.width ?? 0, 
        minHeight : number = canvasElement?.height ?? 0, 
        maxWidth : number = minWidth, 
        maxHeight : number = minHeight,
        getBitmap : ((index : number) => Bitmap) = () => undefined,
        embed : boolean = false) {

        this.minWidth = minWidth;
        this.maxWidth = maxWidth;
        this.minHeight = minHeight;
        this.maxHeight = maxHeight;

        this.getBitmap = getBitmap;

        if (canvasElement !== null) {

            this.canvas = canvasElement;
            this.ctx = canvasElement.getContext("2d")!;
        }
        else {

            this.createCanvas(minWidth, minHeight, embed);
            if (embed) {

                this.resizeEvent(window.innerWidth, window.innerHeight);
                window.addEventListener("resize", () : void => this.resizeEvent(window.innerWidth, window.innerHeight));
            }
        }

        // Hide cursor
        // document.body.style.cursor = "none";
    }


    private createCanvas(width : number, height : number, embed : boolean = true) : void {

        let div : HTMLDivElement | undefined = undefined;
        if (embed) {

            div = document.createElement("div");
            div.id = "d";
            div.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;");
        }
        
        this.canvas = document.createElement("canvas");
        this.canvas.setAttribute("style", 
            "position: absolute;" +
            "z-index: -1;" +
            "image-rendering: optimizeSpeed;" + 
            "image-rendering: pixelated;" +
            "image-rendering: -moz-crisp-edges;");

        this.canvas.width = width;
        this.canvas.height = height;

        if (embed && div !== undefined) { 

            div.appendChild(this.canvas);
            document.body.appendChild(div);
        }

        this.ctx = this.canvas.getContext("2d")!;
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.globalAlpha = 1.0;
    }


    private resizeEvent(width : number, height : number) : void {

        const targetRatio : number = this.minWidth/this.minHeight;
        const windowRatio : number = width/height;

        let newWidth : number = 0;
        let newHeight : number = 0;

        let multiplier : number = 1.0;

        if (windowRatio >= targetRatio) {

            newWidth = Math.round(windowRatio*this.minHeight);
            newHeight = this.minHeight;

            multiplier = height/this.minHeight;
        }
        else {

            newWidth = this.minWidth;
            newHeight = Math.round(this.minWidth/windowRatio);

            multiplier = width/this.minWidth;
        }

        newWidth = Math.min(newWidth, this.maxWidth) | 0;
        newHeight = Math.min(newHeight, this.maxHeight) | 0;

        this.canvas.width = newWidth;
        this.canvas.height = newHeight;

        const cornerx : number = (width/2 - multiplier*newWidth/2) | 0;
        const cornery : number  = (height/2 - multiplier*newHeight/2) | 0;

        this.canvas.style.width  = String((newWidth*multiplier) | 0) + "px";
        this.canvas.style.height = String((newHeight*multiplier) | 0) + "px";
    
        this.canvas.style.left = String(cornerx) + "px";
        this.canvas.style.top  = String(cornery) + "px";
    }


    public clear(colorStr : string) : void {

        const ctx : CanvasRenderingContext2D = this.ctx;

        ctx.fillStyle = colorStr;
        ctx.fillRect(0, 0, this.width, this.height);
    }


    public setColor(colorStr : string = "#ffffff") : void {

        this.ctx.fillStyle = colorStr;
    }


    public setAlpha(alpha : number = 1.0) : void {

        this.ctx.globalAlpha = clamp(alpha, 0.0, 1.0);
    }


    public drawPixelatedLine(x1 : number, y1 : number, x2 : number, y2 : number) : void {

        // const MAX_ITERATIONS : number = 1000;

        // It's Bresenham all the way down

        x1 = (x1 + this.translation.x) | 0;
        y1 = (y1 + this.translation.y) | 0;
        x2 = (x2 + this.translation.x) | 0;
        y2 = (y2 + this.translation.y) | 0;

        const dx : number = Math.abs(x2 - x1);
        const sx : number = x1 < x2 ? 1 : -1;
        const dy : number = -Math.abs(y2 - y1);
        const sy : number = y1 < y2 ? 1 : -1; 
        let error : number = dx + dy;

        // let i : number = 0;
        while ((x1 != x2 || y1 != y2)) {

            this.ctx.fillRect(x1, y1, 1, 1);

            const oldError : number = error*2;
            if (oldError >= dy) { 

                error += dy; 
                x1 += sx; 
            }
            if (oldError <= dx) { 

                error += dx; 
                y1 += sy; 
            }
/*
            if ((i ++) >= MAX_ITERATIONS) {
                break;
            }
                */
        }
    }


    public fillRect(x : number = 0, y : number = 0, 
        w : number = this.width, h : number = this.height,
        color? : string) : void {

        if (color !== undefined) {

            this.setColor(color);
        }

        x = (x + this.translation.x) | 0;
        y = (y + this.translation.y) | 0;

        this.ctx.fillRect(x, y, w | 0, h | 0);
    }


    public fillEllipse(cx : number, cy : number, hradius : number, vradius : number = hradius) : void {

        cx = (cx + this.translation.x) | 0;
        cy = (cy + this.translation.y) | 0;

        hradius |= 0;
        vradius |= 0;

        for (let y = -vradius; y <= vradius; ++ y) {

            const ny : number = y/vradius;
            const r : number = Math.round(Math.sqrt(1 - ny*ny)*hradius);

            if (r <= 0) {

                continue;
            }
            this.ctx.fillRect(cx - r, cy + y, r*2, 1);
        }
    }


    public fillCircleOutside(r : number, cx : number = this.width/2, cy : number = this.height/2) : void {

        cx = (cx + this.translation.x) | 0;
        cy = (cy + this.translation.y) | 0;

        const start : number = Math.max(0, cy - r) | 0;
        const end : number = Math.min(this.height, cy + r) | 0;

        if (start > 0) {

            this.fillRect(0, 0, this.width, start);
        }
        if (end < this.height) {

            this.fillRect(0, end, this.width, this.height - end);
        }

        for (let y = start; y < end; ++ y) {

            const dy : number = y - cy;
            if (Math.abs(dy) >= r) {

                this.ctx.fillRect(0, y, this.width, 1);
                continue;
            }

            const px1 : number = Math.round(cx - Math.sqrt(r*r - dy*dy));
            const px2 : number = Math.round(cx + Math.sqrt(r*r - dy*dy));

            if (px1 > 0) {

                this.ctx.fillRect(0, y, px1, 1);
            }
            if (px2 < this.width) {

                this.ctx.fillRect(px2, y, this.width - px1, 1);
            }
        }
    }


    public fillRing(cx : number, cy : number, 
        innerRadius : number, outerRadius : number) : void {
        
        innerRadius |= 0;
        outerRadius |= 0;

        if (innerRadius >= outerRadius) {

           return;
        }

        cx = (cx + this.translation.x) | 0;
        cy = (cy + this.translation.y) | 0;

        for (let y = -outerRadius; y <= outerRadius; ++ y) {

            const ny1 : number = y/outerRadius;
            const r1 : number = Math.round(Math.sqrt(1 - ny1*ny1) * outerRadius);
            if (r1 <= 0)
                continue;

            let r2 : number = 0;
            if (Math.abs(y) < innerRadius) {

                const ny2 : number = y/innerRadius;
                r2 = Math.round(Math.sqrt(1 - ny2*ny2) * innerRadius);
            }

            if (r2 <= 0) {

                this.ctx.fillRect(cx - r1, cy + y, r1*2, 1);
                continue;
            }
           
            this.ctx.fillRect(cx - r1, cy + y, r1 - r2, 1);
            this.ctx.fillRect(cx + r2, cy + y, r1 - r2, 1);
        }    
    }


    public drawBitmap(bmpIndex : number, flip : Flip = Flip.None,
        dx : number = 0, dy : number = 0,
        sx : number = 0, sy : number = 0,
        sw? : number, sh? : number,
        centerx? : number, centery? : number,
        rotation? : number) : void {

        const bmp : Bitmap = this.getBitmap?.(bmpIndex);
        if (bmp === undefined) {

            return;
        }

        sw ??= bmp?.width ?? 0;
        sh ??= bmp?.height ?? 0;

        centerx ??= sw!/2;
        centery ??= sh!/2;

        dx = (dx + this.translation.x) | 0;
        dy = (dy + this.translation.y) | 0;
        
        sx |= 0;
        sy |= 0;
        sw! |= 0;
        sh! |= 0;
        dx |= 0;
        dy |= 0;

        const ctx : CanvasRenderingContext2D = this.ctx;
        const transform : boolean = flip != Flip.None || rotation !== undefined;

        if (transform) {

            ctx.save();
        }

        if ((flip & Flip.Horizontal) != 0) {

            ctx.translate(sw!, 0);
            ctx.scale(-1, 1);
            dx *= -1;
        }
        if ((flip & Flip.Vertical) != 0) {

            ctx.translate(0, sh!);
            ctx.scale(1, -1);
            dy *= -1;
        }
        
        if (rotation !== undefined) {

            ctx.translate((centerx! + dx) | 0, (centery! + dy) | 0);
            ctx.rotate(-rotation);
            
            dx = -centerx;
            dy = -centery;
        }

        ctx.drawImage(bmp, sx, sy, sw!, sh!, dx, dy, sw!, sh!);

        if (transform) {

            ctx.restore();
        }
    }


    public drawText(fontIndex : number, text : string, 
        dx : number, dy : number, xoff : number = 0, yoff : number = 0, 
        align : Align = Align.Left) : void {

        const LINE_SHIFT : number = 2;

        const font : Bitmap = this.getBitmap?.(fontIndex);
        if (font === undefined) {

            return;
        }

        const cw : number = (font.width/16) | 0;
        const ch : number = cw;

        dx = (dx + this.translation.x) | 0;
        dy = (dy + this.translation.y) | 0;

        const len : number = (text.length + 1)*(cw + xoff);
        if (align == Align.Center) {

            dx -= (len/2.0) | 0;
        }
        else if (align == Align.Right) {
            
            dx -= len | 0;
        }
        
        let x : number = dx;
        let y : number = dy;

        for (let i = 0; i < text.length; ++ i) {

            const chr : number = text.charCodeAt(i);
            // Note: we assume that we encounter only Unix-type
            // newlines. Carriage returns (\r) are attempted to draw normally,
            // whatever the result might be.
            if (chr == '\n'.charCodeAt(0)) {

                x = dx;
                y += ch + yoff;
                continue;
            }

            this.ctx.drawImage(font, (chr % 16)*cw, (((chr/16) | 0) - LINE_SHIFT)*ch, cw, ch, x, y, cw, ch);
            x += cw + xoff;
        }
    }


    public move(dx : number, dy : number = 0.0) : void {

        this.translation.x += dx;
        this.translation.y += dy;
    }


    public moveTo(dx : number = 0.0, dy : number = 0.0) : void {

        this.translation.x = dx;
        this.translation.y = dy;
    }
}
