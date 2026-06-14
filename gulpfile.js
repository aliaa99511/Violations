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


