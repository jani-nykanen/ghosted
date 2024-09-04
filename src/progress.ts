

const KEY : string = "jn2024_2";


export const loadProgress = () : boolean[] => {

    const progress : boolean[] = (new Array<boolean> (12)).fill(false);

    try {

        const loadedProgress : boolean[] = (window["localStorage"]["getItem"](KEY) ?? "")
            .split("").map((i : string) : boolean => Number(i) == 1);
        for (let i = 0; i < loadedProgress.length; ++ i) {

            progress[i] = loadedProgress[i];
        }
    }
    catch(e){}
    return progress;
}


export const storeProgress = (progress : boolean[]) : void => {

    try {

        const targetStr : string = progress.map((b : boolean) => String(Number(b))).join("");
        window["localStorage"]["setItem"](KEY, targetStr);

    } catch(e){};
}
