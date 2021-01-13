const gulp 			= require('gulp'),
	  sass 			= require('gulp-sass'),
	  less 			= require('gulp-less'),
	  pug 			= require('gulp-pug'),
	  plumber 		= require('gulp-plumber'),
	  argv 			= require('yargs').argv,
	  htmlValidator = require('gulp-w3c-html-validator'),
	  bemValidator 	= require('gulp-html-bem-validator'),
	  autoprefixer 	= require('gulp-autoprefixer'),
	  cleanCSS 		= require('gulp-clean-css'),
	  del 			= require('del'),
	  image 		= require('gulp-image'),
	  browserSync 	= require('browser-sync').create(),
	  fsync 		= require('gulp-files-sync'),
	  webpack 		= require('webpack-stream'),
	  sourcemaps 	= require('gulp-sourcemaps'),
	  gulpif 		= require('gulp-if'),
	  smartgrid 	= require('smart-grid');

const input_css 	= [
	'./src/lisyan.less/**/*.less'
];

const output_css 	= './build/static/css',
	  input_html 	= './src/*.pug',
	  output_html 	= './build/',
	  input_img 	= './src/static/img/**/*',
	  output_img 	= './build/static/img',
	  input_fonts 	= './src/static/fonts/**/*',
	  output_fonts 	= './build/static/fonts',
	  input_js 		= './src/static/js/scripts.js',
	  output_js 	= './build/static/js';

let isDev = true; // Debug - true; Release - false
let isProd = !isDev;

let webpackconfig = {
	output: {
		filename: 'scripts.js'
	},
	module: {
	  rules: [
	    {
	      test: /\.m?js$/,
	      exclude: /(node_modules|bower_components)/,
	      use: {
	        loader: 'babel-loader',
	        options: {
	          presets: ['@babel/preset-env']
	        }
	      }
	    }
	  ]
	},
	mode: isDev ? 'development' : 'production',
	devtool: isDev ? 'eval-source-map' : 'none'
};

var settings = {
    outputStyle: 'less',
    columns: 12,
    offset: '30px',
    mobileFirst: false,
    container: {
        maxWidth: '1140px',
        fields: '30px'
    },
    breakPoints: {
        lg: {
            width: '11520px'
        },
        md: {
            width: '992px'
        },
        sm: {
            width: '768px',
            fields: '15px'
        },
        xs: {
            width: '576px'
        }
    }
};
 
smartgrid('./src/lisyan.less/libs', settings);

function styles () {
	return gulp.src(input_css)
		.pipe(less())
		/* .pipe(sass().on('error', sass.logError)) */ // SASS/SCSS
		.pipe(gulpif(isProd, cleanCSS({
			level: 2,
			compatibility: 'ie8'
		})))
        .pipe(autoprefixer({
        	overrideBrowserslist: ['> 0.1%'],
            cascade: false
        }))		
		.pipe(gulp.dest(output_css));
}

function images () {
  	return gulp.src(input_img)
	    .pipe(gulpif(isProd, image({
	      	pngquant: true,
	      	optipng: false,
	      	zopflipng: true,
	      	jpegRecompress: false,
	      	mozjpeg: true,
	      	gifsicle: true,
	      	svgo: true,
	      	concurrent: 10,
	      	quiet: true
	    })))
    	.pipe(gulp.dest(output_img))
    	.pipe(browserSync.stream());
}

function scripts () {
	return gulp.src(input_js)
		.pipe(webpack(webpackconfig))
		.pipe(gulp.dest(output_js))
		.pipe(browserSync.stream());
}

function html () {
  	return gulp.src(input_html)
  		.pipe(plumber())
  		.pipe(pug({pretty: true})) // Release - false
  		.pipe(plumber.stop())
  		.pipe(gulpif(argv.prod, htmlValidator()))
  		.pipe(bemValidator())
    	.pipe(gulp.dest(output_html));
}

function fonts () {
  	return gulp.src(input_fonts)
    	.pipe(gulp.dest(output_fonts))
    	.pipe(browserSync.stream());
}

function clean () {
	return del(['./build/*']);
}

function favicon () {
	return gulp.src("./src/*.ico")
		.pipe(gulp.dest('./build/'))
		.pipe(browserSync.stream());
}

function watch () {
    browserSync.init({
        server: {
            baseDir: "./build/"
        },
        notify: false,
        tunnel: false
    });
	gulp.watch(input_css, styles);
	gulp.watch(input_js, scripts);
	gulp.watch(input_fonts, fonts);
	gulp.watch(input_img, images);
	gulp.watch(input_html, html);
	gulp.watch("./src/*.ico", favicon);
	
	gulp.watch(output_html).on('change', browserSync.reload);
	gulp.watch(output_css).on('change', browserSync.reload);
}

gulp.task('styles', styles);
gulp.task('scripts', scripts);
gulp.task('images', images);

gulp.task('watch', watch);

gulp.task('build', gulp.series(clean, gulp.parallel(styles, scripts, images, html, fonts, favicon)));
gulp.task('dev', gulp.series('build', 'watch'));