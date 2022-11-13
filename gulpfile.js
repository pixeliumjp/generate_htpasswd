const { parallel, series, watch, src, dest } = require('gulp');

/* package */
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');

// postcss
const postcss = require('gulp-postcss');
const mqpacker = require('css-mqpacker');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

const plugin = [
	mqpacker(),
	autoprefixer({}),
	cssnano({ autoprefixer: false })
];

const paths = {
	root: '.',
	styles: {
		watch: 'src/scss/*',
		entry: {
			style: {
				src: 'src/scss/style.scss',
				dest: '.',
				map: '.'
			}
		}
	}
};

const sassCompress = (file) => {
	return src(file.src, { sourcemaps: true })
		.pipe(
			plumber({
				errorHandler: notify.onError({
					title: 'Gulp',
					message: file.src + 'Error: <%= error.message %>',
					sound: 'Tink'
				})
			})
		)
		.pipe(
			sass({ outputStyle: 'expanded' })
		)
		.pipe(
			postcss(plugin)
		)
		.pipe(gulp.dest(file.dest, { sourcemaps: file.map }));
}

function sassCompress_style() {
	return sassCompress(paths.styles.entry.style);
}

function watchFiles() {
	return watch(paths.styles.watch, series(sassCompress_style));
};

exports.watch = watch;

exports.default = series(
	sassCompress_style,
	watchFiles
);