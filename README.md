# gulp-project-builder

This assembly can help with multipage site

1) npm ci

2) npm run dev (dev mode with watcher and sourcemap for scss and js)

3) npm run build (prod mode)

4) npm run clean (clean build files)

5) npm run img (build images)

*There are problems with sharp module on different Node.js versions.*

*This assembly works at least on* ***14.15.0, 18.12.0.***

It would be cool to move to ESM but some devDependencies still don't support it.
Some packages can't be updated because of the moving to ESM: del, gulp-imagemin

I don't know what happens with browser-sync right now, but last well-working version I experimented with is 2.23.6.

As far as I understood [gulp-sass 5.1.0](https://github.com/dlmanning/gulp-sass/releases/tag/v5.1.0) works with node.js 16+ and npm7+.
One of the commits: 
> Update devDependencies and switch to Node.js 16/npm 7+



## To do

1. translate all the comments in gulpfile into English

2. look at this 
```js
	let mode = "development";
	function setProdMode(callback) {
		callback();
		mode = "production";
	}
```

if i can simplify this

3. Make new scss structure with @use and @forward instead of @import

4. Move non-resize logic from names to attributes

5. Replace common js modules with ESM ones when all the dependencies will be ready for it