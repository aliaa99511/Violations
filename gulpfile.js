const { src, dest, watch, task, gulp } = require("gulp"),
  sass = require("gulp-sass")(require("sass")),
  concatCss = require("gulp-concat-css"),
  rename = require("gulp-rename"),
  cleanCss = require("gulp-clean-css"),
  babelify = require("babelify"),
  browserify = require("gulp-browserify"),
  sourcemaps = require("gulp-sourcemaps"),
  uglify = require("gulp-uglify");

let htmlFiles = () => {
  return src("./src/html/**/*.html")
    .pipe(dest("./dist/html"))
    .pipe(dest("V:/Style Library/MiningViolations/Solutions"));
};

let cssFiles = () => {
  return (
    src("./src/scss/*.scss")
      .pipe(sourcemaps.init())
      .pipe(sass().on("error", sass.logError))
      .pipe(concatCss("style.css"))
      .pipe(cleanCss())
      .pipe(sourcemaps.init({ loadMaps: true }))
      // .pipe(rename('style.css'))
      .pipe(sourcemaps.write())
      .pipe(dest("./dist/css"))
      .pipe(dest("V:/Style Library/MiningViolations/CSS"))
  );
};

let jsFiles = () => {
  return src("./src/js/app.js")
    .pipe(sourcemaps.init())
    .pipe(
      browserify({
        transform: [babelify.configure({ presets: ["@babel/preset-env"] })],
      })
    )
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(rename("bundle.js"))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(dest("./dist/js"))
    .pipe(dest("V:/Style Library/MiningViolations/JS"));
};

let ImagesFiles = () => {
  return src("./src/images/**/*.**")
    .pipe(dest("./dist/images"))
    .pipe(dest("V:/Style Library/MiningViolations/images"));
};

let fontsFiles = () => {
  return src("./src/fonts/**/*.**")
    .pipe(dest("./dist/fonts"))
    .pipe(dest("V:/Style Library/MiningViolations/fonts"));
};

let fontAwesomeFiles = () => {
  return src("./src/webfonts/*")
    .pipe(dest("./dist/webfonts"))
    .pipe(dest("V:/Style Library/MiningViolations/webfonts"));
};

let watcher = () => {
  watch("./src/html/**/*.html", htmlFiles);
  watch("./src/scss/**/*.scss", cssFiles);
  watch("./src/js/**/*.js", jsFiles);
  watch("./src/images/**/*.**", ImagesFiles);
  watch("./src/fonts/**/*.**", fontsFiles);
  fontAwesomeFiles();
  // watch('/node_modules/@fortawesome/fontawesome-free/webfonts/*', fontAwesomeFiles);
};

exports.default = watcher;
