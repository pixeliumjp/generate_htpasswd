const gulp = require("gulp");
const sass = require("gulp-sass");
const gcmq = require('gulp-group-css-media-queries');
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const cssnano = require('gulp-cssnano');

const paths = {
    root: '.',
    styles: {
        style: {
            src: 'scss/style.scss',
            dest: '.',
            map: '.',
        }
    }
};

function sassCompress_style() {
    const file = paths.styles.style;
    return gulp
        .src(file.src, { sourcemaps: true })
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
        .pipe(postcss([
            autoprefixer({})
        ]))
        .pipe(gcmq())
        .pipe(cssnano())
        .pipe(notify({
            title: 'Gulp',
            message: file.src + ' sass file compiled.',
            sound: 'Tink',
        }))
        .pipe(gulp.dest(file.dest, { sourcemaps: file.map }))
}

function watchFiles(done) {
    gulp.watch('scss/*').on('change', gulp.parallel(sassCompress_style));
}

gulp.task('default', gulp.series(gulp.parallel(sassCompress_style), watchFiles));