

// I guess I could also put the following functions inside Math, but that would maybe make me lose bytes?


export const clamp = (x : number, min : number, max : number) : number => Math.max(min, Math.min(x, max));


export const negMod = (m : number, n : number) : number => {

    m |= 0;
    n |= 0;

    return ((m % n) + n) % n;
}
