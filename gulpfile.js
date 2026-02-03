// const { src, dest, watch } = require("gulp");

// // CSS
// const sass = require("gulp-sass")(require("sass"));
// const concatCss = require("gulp-concat-css");
// const cleanCss = require("gulp-clean-css");
// const sourcemaps = require("gulp-sourcemaps");

// // JS
// const browserify = require("gulp-browserify");
// const babelify = require("babelify");
// const rename = require("gulp-rename");
// const uglify = require("gulp-uglify");

// // Utils
// const plumber = require("gulp-plumber");

// /* ===================== PATHS ===================== */

// const paths = {
//   html: "./src/html/**/*.html",
//   scss: "./src/scss/**/*.scss",
//   js: "./src/js/app.js",
//   images: "./src/images/**/*",
//   fonts: "./src/fonts/**/*",

//   dist: {
//     html: "./dist/html",
//     css: "./dist/css",
//     js: "./dist/js",
//     images: "./dist/images",
//     fonts: "./dist/fonts",
//     webfonts: "./dist/webfonts",
//   },

//   sharepoint: {
//     css: "V:/Style Library/MiningViolations/CSS",
//     js: "V:/Style Library/MiningViolations/JS",
//     images: "V:/Style Library/MiningViolations/images",
//     fonts: "V:/Style Library/MiningViolations/fonts",
//     webfonts: "V:/Style Library/MiningViolations/webfonts",
//     html: "V:/Style Library/MiningViolations/Solutions",
//   },
// };

// /* ===================== DEV TASKS (FAST) ===================== */

// function htmlDev() {
//   return src(paths.html)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.html));
// }

// function cssDev() {
//   return src("./src/scss/*.scss")
//     .pipe(plumber())
//     .pipe(sourcemaps.init())
//     .pipe(sass())
//     .pipe(concatCss("style.css"))
//     .pipe(sourcemaps.write("./"))
//     .pipe(dest(paths.dist.css));
// }

// function jsDev() {
//   return src(paths.js)
//     .pipe(plumber())
//     .pipe(
//       browserify({
//         debug: true, // fast rebuild
//         transform: [babelify.configure({ presets: ["@babel/preset-env"] })],
//       })
//     )
//     .pipe(rename("bundle.js"))
//     .pipe(dest(paths.dist.js));
// }

// function imagesDev() {
//   return src(paths.images)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.images));
// }

// function fontsDev() {
//   return src(paths.fonts)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.fonts));
// }

// function fontAwesomeDev() {
//   return src("./node_modules/@fortawesome/fontawesome-free/webfonts/*")
//     .pipe(plumber())
//     .pipe(dest(paths.dist.webfonts));
// }

// /* ===================== WATCH (DEV) ===================== */

// function watcher() {
//   watch(paths.html, htmlDev);
//   watch(paths.scss, cssDev);
//   watch("./src/js/**/*.js", jsDev);
//   watch(paths.images, imagesDev);
//   watch(paths.fonts, fontsDev);

//   // copy once
//   fontAwesomeDev();
// }

// /* ===================== BUILD TASKS (PROD) ===================== */

// function cssBuild() {
//   return src("./src/scss/*.scss")
//     .pipe(plumber())
//     .pipe(sass())
//     .pipe(concatCss("style.css"))
//     .pipe(cleanCss())
//     .pipe(dest(paths.dist.css))
//     .pipe(dest(paths.sharepoint.css));
// }

// function jsBuild() {
//   return src(paths.js)
//     .pipe(plumber())
//     .pipe(
//       browserify({
//         transform: [babelify.configure({ presets: ["@babel/preset-env"] })],
//       })
//     )
//     .pipe(rename("bundle.js"))
//     .pipe(uglify())
//     .pipe(dest(paths.dist.js))
//     .pipe(dest(paths.sharepoint.js));
// }

// function htmlBuild() {
//   return src(paths.html)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.html))
//     .pipe(dest(paths.sharepoint.html));
// }

// function imagesBuild() {
//   return src(paths.images)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.images))
//     .pipe(dest(paths.sharepoint.images));
// }

// function fontsBuild() {
//   return src(paths.fonts)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.fonts))
//     .pipe(dest(paths.sharepoint.fonts));
// }

// function fontAwesomeBuild() {
//   return src("./node_modules/@fortawesome/fontawesome-free/webfonts/*")
//     .pipe(plumber())
//     .pipe(dest(paths.dist.webfonts))
//     .pipe(dest(paths.sharepoint.webfonts));
// }

// /* ===================== EXPORTS ===================== */

// exports.default = watcher;

// exports.build = function build(cb) {
//   htmlBuild();
//   cssBuild();
//   jsBuild();
//   imagesBuild();
//   fontsBuild();
//   fontAwesomeBuild();
//   cb();
// };






// dev with dist in sharepoint

const { src, dest, watch } = require("gulp");

// CSS
const sass = require("gulp-sass")(require("sass"));
const concatCss = require("gulp-concat-css");
const cleanCss = require("gulp-clean-css");
const sourcemaps = require("gulp-sourcemaps");

// JS
const browserify = require("gulp-browserify");
const babelify = require("babelify");
const rename = require("gulp-rename");
const uglify = require("gulp-uglify");

// Utils
const plumber = require("gulp-plumber");

/* ===================== PATHS ===================== */

const paths = {
  html: "./src/html/**/*.html",
  scss: "./src/scss/**/*.scss",
  js: "./src/js/app.js",
  images: "./src/images/**/*",
  fonts: "./src/fonts/**/*",

  dist: {
    html: "./dist/html",
    css: "./dist/css",
    js: "./dist/js",
    images: "./dist/images",
    fonts: "./dist/fonts",
    webfonts: "./dist/webfonts",
  },

  sharepoint: {
    css: "V:/Style Library/MiningViolations/CSS",
    js: "V:/Style Library/MiningViolations/JS",
    images: "V:/Style Library/MiningViolations/images",
    fonts: "V:/Style Library/MiningViolations/fonts",
    webfonts: "V:/Style Library/MiningViolations/webfonts",
    html: "V:/Style Library/MiningViolations/Solutions",
  },
};

/* ===================== DEV TASKS (FAST + SharePoint) ===================== */

function htmlDev() {
  return src(paths.html)
    .pipe(plumber())
    .pipe(dest(paths.dist.html))
    .pipe(dest(paths.sharepoint.html));
}

function cssDev() {
  return src("./src/scss/*.scss")
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(concatCss("style.css"))
    .pipe(sourcemaps.write("./"))
    .pipe(dest(paths.dist.css))
    .pipe(dest(paths.sharepoint.css));
}

function jsDev() {
  return src(paths.js)
    .pipe(plumber())
    .pipe(
      browserify({
        debug: true,
        transform: [babelify.configure({ presets: ["@babel/preset-env"] })],
      })
    )
    .pipe(rename("bundle.js"))
    .pipe(dest(paths.dist.js))
    .pipe(dest(paths.sharepoint.js));
}

function imagesDev() {
  return src(paths.images)
    .pipe(plumber())
    .pipe(dest(paths.dist.images))
    .pipe(dest(paths.sharepoint.images));
}

function fontsDev() {
  return src(paths.fonts)
    .pipe(plumber())
    .pipe(dest(paths.dist.fonts))
    .pipe(dest(paths.sharepoint.fonts));
}

function fontAwesomeDev() {
  return src("./node_modules/@fortawesome/fontawesome-free/webfonts/*")
    .pipe(plumber())
    .pipe(dest(paths.dist.webfonts))
    .pipe(dest(paths.sharepoint.webfonts));
}

/* ===================== WATCH (DEV) ===================== */

function watcher() {
  watch(paths.html, htmlDev);
  watch(paths.scss, cssDev);
  watch("./src/js/**/*.js", jsDev);
  watch(paths.images, imagesDev);
  watch(paths.fonts, fontsDev);

  // copy once
  fontAwesomeDev();
}

/* ===================== BUILD TASKS (DIST ONLY) ===================== */

function cssBuild() {
  return src("./src/scss/*.scss")
    .pipe(plumber())
    .pipe(sass())
    .pipe(concatCss("style.css"))
    .pipe(cleanCss())
    .pipe(dest(paths.dist.css));
}

function jsBuild() {
  return src(paths.js)
    .pipe(plumber())
    .pipe(
      browserify({
        transform: [babelify.configure({ presets: ["@babel/preset-env"] })],
      })
    )
    .pipe(rename("bundle.js"))
    .pipe(uglify())
    .pipe(dest(paths.dist.js));
}

function htmlBuild() {
  return src(paths.html)
    .pipe(plumber())
    .pipe(dest(paths.dist.html));
}

function imagesBuild() {
  return src(paths.images)
    .pipe(plumber())
    .pipe(dest(paths.dist.images));
}

function fontsBuild() {
  return src(paths.fonts)
    .pipe(plumber())
    .pipe(dest(paths.dist.fonts));
}

function fontAwesomeBuild() {
  return src("./node_modules/@fortawesome/fontawesome-free/webfonts/*")
    .pipe(plumber())
    .pipe(dest(paths.dist.webfonts));
}

/* ===================== EXPORTS ===================== */

exports.default = watcher;

exports.build = function build(cb) {
  htmlBuild();
  cssBuild();
  jsBuild();
  imagesBuild();
  fontsBuild();
  fontAwesomeBuild();
  cb();
};











/////////////////////////////////////////////////////////////////
// explain
////////////////////////////////////////////////////////
// • DEV mode (gulp):
//   - Used during development
//   - Fast watch tasks
//   - No minification
//   - Outputs to /dist only

// • BUILD mode (gulp build):
//   - Used for production
//   - Runs once (no watch)
//   - Minified & optimized files
//   - Uploads final files to SharePoint

// • Workflow:
//   src → gulp → dist → SharePoint
////////////////////////////////////////////////
// 🟢 DEV Mode(During Development)

// Command:
// gulp

// Purpose: Fast development workflow

// Behavior:
// Very fast execution
// Watch mode is enabled
// Rebuilds files automatically on changes
// No heavy processing to keep things quick

// What is NOT applied:
// ❌ No uglify(no JS minification)
// ❌ No cleanCss(no CSS minification)
// ❌ No SharePoint upload

// Output:
// Generates files in the dist folder only
// 🔵 BUILD Mode(After Finishing Development)

// Command:
// gulp build

// Purpose: Production - ready build

// Behavior:
// Runs once(no watch)
// Slower than DEV(expected)
// Full optimization pipeline

// What is applied:
// ✔️ JavaScript minification(uglify)
// ✔️ CSS minification(cleanCss)
// ✔️ Copies final files to SharePoint

// Output:
// Optimized files in dist
// Final assets uploaded to SharePoint





















////////////////////////////////////////////////////////////////////
// old code
////////////////////////////////////////////////////////////

// const { src, dest, watch } = require("gulp");

// // CSS
// const sass = require("gulp-sass")(require("sass"));
// const concatCss = require("gulp-concat-css");
// const cleanCss = require("gulp-clean-css");
// const sourcemaps = require("gulp-sourcemaps");

// // JS
// const browserify = require("gulp-browserify");
// const babelify = require("babelify");
// const rename = require("gulp-rename");
// const uglify = require("gulp-uglify");

// // Utils
// const plumber = require("gulp-plumber");

// /* ===================== PATHS ===================== */

// const paths = {
//   html: "./src/html/**/*.html",
//   scss: "./src/scss/**/*.scss",
//   js: "./src/js/app.js",
//   images: "./src/images/**/*",
//   fonts: "./src/fonts/**/*",
//   webfonts: "./src/webfonts/*",

//   dist: {
//     html: "./dist/html",
//     css: "./dist/css",
//     js: "./dist/js",
//     images: "./dist/images",
//     fonts: "./dist/fonts",
//     webfonts: "./dist/webfonts",
//   },

//   sharepoint: {
//     base: "V:/Style Library/MiningViolations",
//     css: "V:/Style Library/MiningViolations/CSS",
//     js: "V:/Style Library/MiningViolations/JS",
//     images: "V:/Style Library/MiningViolations/images",
//     fonts: "V:/Style Library/MiningViolations/fonts",
//     webfonts: "V:/Style Library/MiningViolations/webfonts",
//     html: "V:/Style Library/MiningViolations/Solutions",
//   },
// };

// /* ===================== TASKS ===================== */

// function htmlFiles() {
//   return src(paths.html)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.html))
//     .pipe(dest(paths.sharepoint.html));
// }

// function cssFiles() {
//   return src("./src/scss/*.scss")
//     .pipe(plumber())
//     .pipe(sourcemaps.init())
//     .pipe(sass())
//     .pipe(concatCss("style.css"))
//     .pipe(cleanCss())
//     .pipe(sourcemaps.write("./"))
//     .pipe(dest(paths.dist.css))
//     .pipe(dest(paths.sharepoint.css));
// }

// function jsFiles() {
//   return src(paths.js)
//     .pipe(plumber())
//     .pipe(sourcemaps.init())
//     .pipe(
//       browserify({
//         transform: [
//           babelify.configure({
//             presets: ["@babel/preset-env"],
//             compact: false,
//           }),
//         ],
//       })
//     )
//     .pipe(rename("bundle.js"))
//     .pipe(uglify())
//     .pipe(sourcemaps.write("./"))
//     .pipe(dest(paths.dist.js))
//     .pipe(dest(paths.sharepoint.js));
// }

// function imagesFiles() {
//   return src(paths.images)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.images))
//     .pipe(dest(paths.sharepoint.images));
// }

// function fontsFiles() {
//   return src(paths.fonts)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.fonts))
//     .pipe(dest(paths.sharepoint.fonts));
// }

// function fontAwesomeFiles() {
//   return src("./node_modules/@fortawesome/fontawesome-free/webfonts/*")
//     .pipe(plumber())
//     .pipe(dest(paths.dist.webfonts))
//     .pipe(dest(paths.sharepoint.webfonts));
// }

// /* ===================== WATCHER ===================== */

// function watcher() {
//   watch(paths.html, htmlFiles);
//   watch(paths.scss, cssFiles);
//   watch("./src/js/**/*.js", jsFiles);
//   watch(paths.images, imagesFiles);
//   watch(paths.fonts, fontsFiles);

//   // Copy once only
//   fontAwesomeFiles();
// }

// /* ===================== EXPORTS ===================== */

// exports.default = watcher;

// exports.build = function build(cb) {
//   htmlFiles();
//   cssFiles();
//   jsFiles();
//   imagesFiles();
//   fontsFiles();
//   fontAwesomeFiles();
//   cb();
// };