let gulp = require('gulp'),
		pug = require('gulp-pug'),
		plumber = require('gulp-plumber'),
		browserSync = require('browser-sync'),
		scss = require('gulp-sass'),
		sourcemaps = require('gulp-sourcemaps'),
		csso = require('gulp-csso'),
		autoprefixer = require('gulp-autoprefixer'),
		rename = require('gulp-rename');
		svgSprite = require('gulp-svg-sprite'),
		svgmin = require('gulp-svgmin'),
		cheerio = require('gulp-cheerio'),
		replace = require('gulp-replace');
		imagemin = require('gulp-imagemin'),
    imageminJpegRecompress = require('imagemin-jpeg-recompress'),
    pngquant = require('imagemin-pngquant'),
    cache = require('gulp-cache'),
    del = require('del'),
    rigger = require('gulp-rigger');
    uglify = require("gulp-uglify-es").default;


//PATH
let svgPATH = {
	"input": "./dev/images/svg/*.svg",
	"output": "./build/images/svg/" 
};

let imgPATH = {
	"input": ["./dev/images/**/*.{png,jpg,gif,svg}",
      '!./dev/images/svg/*'],
	"ouput": "./build/images/"
 };
	

// Local server
gulp.task('serve', function () {
	browserSync.init({
		server: {
			baseDir: "./build"
		}
	});
});

//html pug
gulp.task('pug', function () {
	return gulp.src('./dev/pug/*.pug')
	.pipe(plumber())
	.pipe(pug({
		pretty: true
	}))
	.pipe(plumber.stop())
	.pipe(gulp.dest('./build'))
	.on('end', browserSync.reload);
});

//styles:dev
gulp.task('styles:dev', function () {
	return gulp.src('./dev/styles/main.scss')
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(scss())
    .pipe(autoprefixer({
        browsers: ['last 3 version']
    }))
    .pipe(sourcemaps.write())
    .pipe(rename('main.min.css'))
    .pipe(gulp.dest('build/css'))
    .on('end', browserSync.reload);
});

//styles:build
gulp.task('styles:build', function () {
	return gulp.src('./dev/styles/main.scss')
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(scss())
    .pipe(autoprefixer({
        browsers: ['last 3 version']
    }))
    .pipe(sourcemaps.write())
    .pipe(csso())
    .pipe(rename('main.min.css'))
    .pipe(gulp.dest('build/css'))
});


// js:dev 
gulp.task('js:dev', function () {
	return gulp.src('./dev/js/main.js')
		.pipe(rigger()) //Прогоним через rigger
		.pipe(gulp.dest('./build/js/'))
		.pipe(browserSync.reload({
			stream: true
		}));
});

//js:build
gulp.task('js:build', function () {
	return gulp.src('./dev/js/main.js')
		.pipe(rigger()) //Прогоним через rigger
		.pipe(uglify()) //минификация
		.pipe(gulp.dest('./build/js/'))
});



//svg sprite 
gulp.task('svg', function (){
	return gulp.src(svgPATH.input)
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		.pipe(cheerio({
     	run: function ($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: {xmlMode: true}
    }))
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
      mode: {
        symbol: {
            sprite: "sprite.svg"
        }
      }
     }))
    .pipe(gulp.dest(svgPATH.output));
});

//img dev
gulp.task('img:dev', function() {
	return gulp.src(imgPATH.input)
		.pipe(gulp.dest(imgPATH.ouput));
});


//img build
gulp.task('img:build', function () {
	return gulp.src(imgPATH.input)
		.pipe(cache(imagemin([
			imagemin.gifsicle({ interlaced: true }),
			imagemin.jpegtran({ progressive: true }),
			imageminJpegRecompress({
				loops: 5,
				min: 70,
				max: 75,
				quality: 'medium'
			}),
			imagemin.svgo(),
			imagemin.optipng({ optimizationLevel: 3 }),
			pngquant({ quality: '65-70', speed: 5 })
			], {
					verbose: true
			})))
		.pipe(gulp.dest(imgPATH.ouput));
});

// fonts
gulp.task('fonts', function () {
	return gulp.src('./dev/fonts/**/*.*')
		.pipe(gulp.dest('./build/fonts/'));
});

//clean files
gulp.task('clean', function () {
	return del('./build')
});

// watch files
gulp.task('watch', function () {
	gulp.watch('./dev/pug/**/*.pug', gulp.series('pug'));
	gulp.watch('./dev/styles/**/*.scss', gulp.series('styles:dev'));
	gulp.watch(['./dev/images/general/**/*.{png,jpg,gif}',
		'./dev/images/content/**/*.{png,jpg,gif}'], gulp.series('img:dev'));
	gulp.watch('./dev/images/svg/*.svg', gulp.series('svg'));
	gulp.watch('./dev/js/**/*.js', gulp.series('js:dev'));
});



//dev
gulp.task('dev', gulp.series(
	'clean',
	gulp.parallel(
		'pug',
		'styles:dev',
		'js:dev',
		'img:dev',
		'svg',
		'fonts'
	)
));

//build
gulp.task('build', gulp.series(
	'clean',
	gulp.parallel(
		'pug', 
		'styles:build', 
		'js:build', 
		'img:build', 
		'svg', 
		'fonts'
		)
));

//default
gulp.task('default', gulp.series(
	'dev',
	gulp.parallel(
		'watch',
		'serve'
	)
));