

// Mnemonics for assets and input actions


export const enum Action {

    Right = 0,
    Up = 1,
    Left = 2,
    Down = 3,

    Choose = 4,
    Pause = 5,
    Restart = 6,
    Undo = 7,

    Back = 8,
};


export const enum BitmapAsset {

    RawFont = 0,
    RawGameArt = 1,
    GameArt = 2,
    FontWhite = 3,
    FontYellow = 4,
    FontBlack = 5,
    FontOutlines = 6,

    StageClear = 7,
    Title = 8,
};


export const enum SoundEffect {

    PushBoulder = 0,
    FallingBoulder = 1,
    Splash = 2,
    SpreadingHole = 3,
    EmergingSlime = 4,
    Coin = 5,
    Jump = 6,
    Transform = 7,
    Undo = 8,
    Choose = 8, // Same as above
    Restart = 9,
    Walk = 10,
    Select = 11,
    Pause = 12,
    StageClear = 13,
    FinalStageTransition = 14,
   //  Reject = 15,
};


