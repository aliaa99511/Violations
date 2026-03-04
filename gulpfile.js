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
const fs = require("fs");

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
    root: "V:/Style Library/MiningViolations",
    css: "V:/Style Library/MiningViolations/CSS",
    js: "V:/Style Library/MiningViolations/JS",
    images: "V:/Style Library/MiningViolations/images",
    fonts: "V:/Style Library/MiningViolations/fonts",
    webfonts: "V:/Style Library/MiningViolations/webfonts",
    html: "V:/Style Library/MiningViolations/Solutions",
  },
};

/* ===================== SHAREPOINT CHECK ===================== */

function isSharePointAvailable() {
  try {
    return fs.existsSync(paths.sharepoint.root);
  } catch (err) {
    return false;
  }
}

function writeConnectionStatus() {
  const status = isSharePointAvailable()
    ? "window.SP_CONNECTION = true;"
    : "window.SP_CONNECTION = false;";

  if (!fs.existsSync("./dist/js")) {
    fs.mkdirSync("./dist/js", { recursive: true });
  }

  fs.writeFileSync("./dist/js/connection-status.js", status);
}

function safeSharePoint(stream, sharepointPath) {
  if (isSharePointAvailable()) {
    return stream.pipe(dest(sharepointPath));
  } else {
    console.log("⚠ SharePoint V: drive is not connected!");
    return stream;
  }
}

/* ===================== DEV TASKS ===================== */

function htmlDev() {
  const stream = src(paths.html)
    .pipe(plumber())
    .pipe(dest(paths.dist.html));

  return safeSharePoint(stream, paths.sharepoint.html);
}

function cssDev() {
  const stream = src("./src/scss/*.scss")
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(concatCss("style.css"))
    .pipe(sourcemaps.write("./"))
    .pipe(dest(paths.dist.css));

  return safeSharePoint(stream, paths.sharepoint.css);
}

function jsDev() {
  const stream = src(paths.js)
    .pipe(plumber())
    .pipe(
      browserify({
        debug: true,
        transform: [
          babelify.configure({
            presets: ["@babel/preset-env"],
            ignore: [/node_modules/],
          }),
        ],
      })
    )
    .pipe(rename("bundle.js"))
    .pipe(dest(paths.dist.js));

  return safeSharePoint(stream, paths.sharepoint.js);
}

function imagesDev() {
  const stream = src(paths.images)
    .pipe(plumber())
    .pipe(dest(paths.dist.images));

  return safeSharePoint(stream, paths.sharepoint.images);
}

function fontsDev() {
  const stream = src(paths.fonts)
    .pipe(plumber())
    .pipe(dest(paths.dist.fonts));

  return safeSharePoint(stream, paths.sharepoint.fonts);
}

function fontAwesomeDev() {
  const stream = src("./node_modules/@fortawesome/fontawesome-free/webfonts/*")
    .pipe(plumber())
    .pipe(dest(paths.dist.webfonts));

  return safeSharePoint(stream, paths.sharepoint.webfonts);
}

/* ===================== WATCH ===================== */

function watcher() {
  writeConnectionStatus();

  watch(paths.html, htmlDev);
  watch(paths.scss, cssDev);
  watch("./src/js/**/*.js", jsDev);
  watch(paths.images, imagesDev);
  watch(paths.fonts, fontsDev);

  fontAwesomeDev();
}

/* ===================== BUILD ===================== */

function build(cb) {
  writeConnectionStatus();
  cb();
}

exports.default = watcher;
exports.build = build;




// // dev with dist in sharepoint

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

// /* ===================== DEV TASKS (FAST + SharePoint) ===================== */

// function htmlDev() {
//   return src(paths.html)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.html))
//     .pipe(dest(paths.sharepoint.html));
// }

// function cssDev() {
//   return src("./src/scss/*.scss")
//     .pipe(plumber())
//     .pipe(sourcemaps.init())
//     .pipe(sass())
//     .pipe(concatCss("style.css"))
//     .pipe(sourcemaps.write("./"))
//     .pipe(dest(paths.dist.css))
//     .pipe(dest(paths.sharepoint.css));
// }

// function jsDev() {
//   return src(paths.js)
//     .pipe(plumber())
//     .pipe(
//       browserify({
//         debug: true,
//         transform: [
//           babelify.configure({
//             presets: ["@babel/preset-env"],
//             ignore: [/node_modules/],
//           }),
//         ],
//       })
//     )
//     .pipe(rename("bundle.js"))
//     .pipe(dest(paths.dist.js))
//     .pipe(dest(paths.sharepoint.js));
// }

// function imagesDev() {
//   return src(paths.images)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.images))
//     .pipe(dest(paths.sharepoint.images));
// }

// function fontsDev() {
//   return src(paths.fonts)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.fonts))
//     .pipe(dest(paths.sharepoint.fonts));
// }

// function fontAwesomeDev() {
//   return src("./node_modules/@fortawesome/fontawesome-free/webfonts/*")
//     .pipe(plumber())
//     .pipe(dest(paths.dist.webfonts))
//     .pipe(dest(paths.sharepoint.webfonts));
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

// /* ===================== BUILD TASKS (DIST ONLY) ===================== */

// function cssBuild() {
//   return src("./src/scss/*.scss")
//     .pipe(plumber())
//     .pipe(sass())
//     .pipe(concatCss("style.css"))
//     .pipe(cleanCss())
//     .pipe(dest(paths.dist.css));
// }

// function jsBuild() {
//   return src(paths.js)
//     .pipe(plumber())
//     .pipe(
//       browserify({
//         debug: true,
//         transform: [
//           babelify.configure({
//             presets: ["@babel/preset-env"],
//             ignore: [/node_modules/],
//           }),
//         ],
//       })
//     )
//     .pipe(rename("bundle.js"))
//     .pipe(uglify())
//     .pipe(dest(paths.dist.js));
// }

// function htmlBuild() {
//   return src(paths.html)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.html));
// }

// function imagesBuild() {
//   return src(paths.images)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.images));
// }

// function fontsBuild() {
//   return src(paths.fonts)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.fonts));
// }

// function fontAwesomeBuild() {
//   return src("./node_modules/@fortawesome/fontawesome-free/webfonts/*")
//     .pipe(plumber())
//     .pipe(dest(paths.dist.webfonts));
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
















// // fix gulp network problem by copying to dist first, then to sharepoint:

// const { src, dest, watch, series } = require("gulp");

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
//   jsEntry: "./src/js/app.js",
//   jsWatch: "./src/js/**/*.js",
//   images: "./src/images/**/*",
//   fonts: "./src/fonts/**/*",

//   dist: {
//     root: "./dist",
//     html: "./dist/html",
//     css: "./dist/css",
//     js: "./dist/js",
//     images: "./dist/images",
//     fonts: "./dist/fonts",
//     webfonts: "./dist/webfonts",
//   },

//   sharepoint: {
//     root: "V:/Style Library/MiningViolations",
//     html: "V:/Style Library/MiningViolations/Solutions",
//     css: "V:/Style Library/MiningViolations/CSS",
//     js: "V:/Style Library/MiningViolations/JS",
//     images: "V:/Style Library/MiningViolations/images",
//     fonts: "V:/Style Library/MiningViolations/fonts",
//     webfonts: "V:/Style Library/MiningViolations/webfonts",
//   },
// };

// /* ===================== DEV BUILD (LOCAL ONLY) ===================== */

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
//   return src(paths.jsEntry)
//     .pipe(plumber())
//     .pipe(
//       browserify({
//         debug: true,
//         transform: [
//           babelify.configure({
//             presets: ["@babel/preset-env"],
//             ignore: [/node_modules/],
//           }),
//         ],
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

// /* ===================== COPY TO SHAREPOINT ===================== */

// function copyHtml() {
//   return src(`${paths.dist.html}/**/*.html`)
//     .pipe(plumber())
//     .pipe(dest(paths.sharepoint.html));
// }

// function copyCss() {
//   return src(`${paths.dist.css}/**/*`)
//     .pipe(plumber())
//     .pipe(dest(paths.sharepoint.css));
// }

// function copyJs() {
//   return src(`${paths.dist.js}/**/*`)
//     .pipe(plumber())
//     .pipe(dest(paths.sharepoint.js));
// }

// function copyImages() {
//   return src(`${paths.dist.images}/**/*`)
//     .pipe(plumber())
//     .pipe(dest(paths.sharepoint.images));
// }

// function copyFonts() {
//   return src(`${paths.dist.fonts}/**/*`)
//     .pipe(plumber())
//     .pipe(dest(paths.sharepoint.fonts));
// }

// function copyWebfonts() {
//   return src(`${paths.dist.webfonts}/**/*`)
//     .pipe(plumber())
//     .pipe(dest(paths.sharepoint.webfonts));
// }

// /* ===================== WATCH (SAFE FOR SHAREPOINT) ===================== */

// function watcher() {
//   watch(paths.html, { delay: 500 }, series(htmlDev, copyHtml));
//   watch(paths.scss, { delay: 500 }, series(cssDev, copyCss));
//   watch(paths.jsWatch, { delay: 1000 }, series(jsDev, copyJs));
//   watch(paths.images, { delay: 500 }, series(imagesDev, copyImages));
//   watch(paths.fonts, { delay: 500 }, series(fontsDev, copyFonts));

//   // copy once
//   series(fontAwesomeDev, copyWebfonts)();
// }

// /* ===================== PROD BUILD (DIST ONLY) ===================== */

// function cssBuild() {
//   return src("./src/scss/*.scss")
//     .pipe(plumber())
//     .pipe(sass())
//     .pipe(concatCss("style.css"))
//     .pipe(cleanCss())
//     .pipe(dest(paths.dist.css));
// }

// function jsBuild() {
//   return src(paths.jsEntry)
//     .pipe(plumber())
//     .pipe(
//       browserify({
//         transform: [
//           babelify.configure({
//             presets: ["@babel/preset-env"],
//             ignore: [/node_modules/],
//           }),
//         ],
//       })
//     )
//     .pipe(rename("bundle.js"))
//     .pipe(uglify())
//     .pipe(dest(paths.dist.js));
// }

// function htmlBuild() {
//   return src(paths.html)
//     .pipe(plumber())
//     .pipe(dest(paths.dist.html));
// }

// /* ===================== EXPORTS ===================== */

// exports.default = watcher;

// exports.build = series(
//   htmlBuild,
//   cssBuild,
//   jsBuild,
//   imagesDev,
//   fontsDev,
//   fontAwesomeDev
// );

// exports.copy = series(
//   copyHtml,
//   copyCss,
//   copyJs,
//   copyImages,
//   copyFonts,
//   copyWebfonts
// );




// 🇸🇦 الشرح بالعربي
// اللي حصل باختصار:

// المشروع شغال على SharePoint (Style Library).

// Gulp كان بيعمل build + copy للـ SharePoint في نفس الوقت.

// مسار SharePoint (V:) هو Network / Mapped Drive.

// Node.js و Gulp مش مستقرين مع الكتابة المباشرة والمتوازية على Network Drives.

// المشاكل اللي ظهرت:

// أخطاء زي:

// UNKNOWN: unknown error, mkdir

// ECONNRESET

// premature close

// Tasks بتعيد نفسها أكتر من مرة.

// watch بيدخل في loop.

// الـ build بياخد وقت طويل جدًا أو يوقف فجأة.

// السبب الحقيقي:

// الكتابة على SharePoint كانت:

// جوه نفس الـ stream

// ومع تشغيل watch

// وبأكتر من Task في نفس الوقت (HTML / CSS / JS)

// ده عمل ضغط على الشبكة وخلّى الـ streams تتقفل فجأة.

// الحل اللي اتطبق:

// فصلنا الشغل لمرحلتين:

// Build محلي في dist

// Copy منفصل للـ SharePoint بعد ما الـ build يخلص

// منعنا أي watch أو كتابة مباشرة على SharePoint.

// استخدمنا series بدل parallel.

// ضفنا delay للـ watch لتقليل الضغط.

// النتيجة:

// الـ build بقى مستقر.

// مفيش crashes.

// التغييرات بتظهر على SharePoint فورًا.

// الأداء بقى أسرع وأنضف.

// 🇬🇧 Explanation in English
// What happened:

// The project is running on SharePoint (Style Library).

// Gulp was doing build and copy to SharePoint at the same time.

// The SharePoint path (V:) is a network / mapped drive.

// Node.js and Gulp are not stable when writing directly and in parallel to network drives.

// Issues observed:

// Errors such as:

// UNKNOWN: unknown error, mkdir

// ECONNRESET

// premature close

// Tasks running multiple times.

// Watcher entering infinite loops.

// Build process randomly stopping or taking too long.

// Root cause:

// Writing to SharePoint:

// inside the same stream

// while watch is running

// with multiple tasks in parallel (HTML / CSS / JS)

// This caused network pressure and stream interruptions.

// Solution applied:

// Split the process into two clear steps:

// Local build to dist

// Separate copy step to SharePoint after build completes

// Prevented watching or writing directly to SharePoint.

// Used series instead of parallel execution.

// Added watch delays to reduce network stress.

// Result:

// Stable build process.

// No more random crashes.

// Changes appear immediately on SharePoint.

// Faster and cleaner workflow.

















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