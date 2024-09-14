# Ghosted

...is a puzzle game made for js13k 2024 game programming competition.


## Playing

[Click here](https://dev.js13kgames.com/2024/games/ghosted)


## Building

### Prerequisites: 
- **Git LFS**, required to get access to the asset files (not strictly necessary if you clone the repo using the download button on Github).
- **TypeScript**, to compile TypeScript, obviously.
- **make** (optional), to make things (what).
- **Closure Compiler** (optional), needed to compress the code.
- **advzip** (optional), needed to minimize the zip.

### Steps
1. Run `tsc` to compile .ts to .js
2. If you have edited levels, you need to run `make levels`
3. Create a compressed zip by running `make CLOSURE_PATH=<path-to-closure> dist` (note: for some reason you need to run `tsc` or `make js` before this).
4. Be happy.


## License

[MIT License](https://opensource.org/license/mit)


----------------

(c) 2024 Jani Nykänen
