'use strict';

var fs = require('fs'),
	path = require('path'),
	gulp = require('gulp'),
	del = require('del'),
	cleanCSS = require('gulp-clean-css'),
	connect = require('gulp-connect'),
	plumber = require('gulp-plumber'),
	sourcemaps = require('gulp-sourcemaps'),
	sass = require('gulp-sass'),
	gulpsync = require('gulp-sync')(gulp),
	gutil = require('gulp-util'),
	spritesmith = require('gulp.spritesmith'),
	webpack = require('gulp-webpack'),
	fileInclude = require('gulp-file-include'),
	browserify = require('gulp-browserify'),
	rename = require('gulp-rename');

var REGEXP = {
	separDoubledashRegex: /(.*)--+(.*)/g,
	separAtsignRegex: /(.*)@+(.*)/g
};

var setDelayAfterTask = function (callback, timer, ret) {
	if (timer === undefined) timer = 2500;
	setTimeout(function () {
		callback();
		if (ret !== undefined) return ret;
	}, timer);
};

var fileExistsChecker = function (callback, array, timer, ret) {
	if (timer === undefined) timer = 500;
	var interval = setInterval(function () {
		console.log('Check if file exists');
		array.forEach(function (_key) {
			fs.stat(_key, function (err) {
				if (err == null) {
					var index = array.indexOf(_key);
					if (index !== -1) {
						array.splice(index, 1);
					}
				}
			});
		});
		if (!array.length) {
			clearInterval(interval);
			console.log('Exists!');
			setDelayAfterTask(callback, 0, ret);
		}
	}, timer);
};

var plumberOptionErrorHandler = function (err) {
	gutil.beep();
	console.log(err);
	this.emit('end');
};

gulp.task('sprite', function (cb) {
	var spriteSrcDir = 'src/sprites/',
		spriteSrcDirWithRoot = __dirname + '/' + spriteSrcDir + '/',
		spriteDistArr = [],
		setSpriteCSSValMap = function (obj, namespace, name, effectArr, responsive, pixelRatio) {
			obj.namespace = namespace;
			obj.name = name;
			obj.responsive = responsive;
			if (typeof pixelRatio === 'number' && pixelRatio > 1) {
				obj.offset_y = obj.offset_y / pixelRatio;
				obj.offset_x = obj.offset_x / pixelRatio;
				obj.width = obj.width / pixelRatio;
				obj.height = obj.height / pixelRatio;
				obj.canvas_width = obj.total_width / pixelRatio;
				obj.canvas_height = obj.total_height / pixelRatio;
			} else {
				obj.canvas_width = obj.total_width;
				obj.canvas_height = obj.total_height;
			}
			for (var _i = 0; _i < effectArr.length; _i++) {
				obj.name += ':' + effectArr[_i];
			}
		};
	fs.readdirSync(spriteSrcDirWithRoot).forEach(function (_key) {
		if (fs.statSync(path.join(spriteSrcDirWithRoot, _key)).isDirectory() === false) return false;
		var ret,
			spriteDistImgDir = 'src/resources/img/',
			spriteDistCSSDir = 'src/sass/settings/sprite/',
			spriteTypeCondition = _key.match(REGEXP.separAtsignRegex),
			spriteNamespace = spriteTypeCondition ? RegExp.$1 : _key,
			spriteSourceName = 'spr-' + spriteNamespace,
			spriteSourcePath = spriteSrcDir + '/' + _key + '/',
			spriteImgPathinCSS = '/resources/img/',
			spriteType = spriteTypeCondition ? RegExp.$2 : '1x',
			spritePixelRatio = ~~spriteType.slice(0, 1) || 1,
			spriteResponsive = false,
			spriteData = {
				imgName: spriteSourceName + '.png',
				imgPath: spriteImgPathinCSS + spriteSourceName + '.png',
				cssName: '_' + spriteSourceName + '.scss',
				cssTemplate: 'lib/spritesmith/sprites.scss.handlebars',
				padding: 2
			};
		spriteDistArr.push(spriteDistImgDir + spriteData.imgName);
		spriteDistArr.push(spriteDistCSSDir + spriteData.cssName);
		if (spriteType == 'responsive') {
			spriteResponsive = true;
			spriteData.retinaSrcFilter = spriteSourcePath + '*@retina.png';
			spriteData.retinaImgName = spriteSourceName + '@retina.png';
			spriteData.retinaImgPath = spriteImgPathinCSS + spriteSourceName + '@retina.png';
			spriteDistArr.push(spriteDistImgDir + spriteData.retinaImgName);
		}
		spriteData.cssVarMap = function (sprite) {
			if (sprite.name.match(REGEXP.separAtsignRegex) !== null) return false;
			var spriteName = sprite.name,
				spriteNameEffectCondition,
				spriteEffectArr = [];
			spriteNameEffectCondition = spriteName.match(REGEXP.separAtsignRegex);
			spriteName = spriteNameEffectCondition ? RegExp.$1 : spriteName;
			spriteNameEffectCondition = spriteName.match(REGEXP.separDoubledashRegex);
			spriteName = spriteNameEffectCondition ? RegExp.$1 : spriteName;
			if (spriteNameEffectCondition !== null) {
				for (var _i = 2; _i <= 8; _i++) {
					var thisRegexp = RegExp['$' + _i];
					if (thisRegexp == '') break;
					else spriteEffectArr.push(thisRegexp);
				}
			}
			setSpriteCSSValMap(sprite, spriteNamespace, spriteName, spriteEffectArr, spriteResponsive, spritePixelRatio);
		};
		ret = gulp.src(spriteSourcePath + '*.png')
			.pipe(spritesmith(spriteData));
		ret.img.pipe(gulp.dest(spriteDistImgDir));
		ret.css.pipe(gulp.dest(spriteDistCSSDir));
	});
	return fileExistsChecker(cb, spriteDistArr);
});
gulp.task('sprite:clean', function () {
	return del(['src/sass/**/_spr-*.scss', 'src/resources/img/**/spr-*.png']);
});
gulp.task('sprite:watch', function () {
	return gulp.watch(['src/sprites/**/*', 'lib/spritesmith/*'], ['sprite']);
});

gulp.task('sass', function() {
	return gulp.src(['src/sass/**/*.css', 'src/sass/**/*.scss'])
		.pipe(plumber({
			errorHandler: plumberOptionErrorHandler
		}))
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: 'expanded'
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('src/resources/css/'));
});
gulp.task('sass:clean', function() {
	return del(['src/resources/css/']);
});
gulp.task('sass:watch', function() {
	return gulp.watch(['src/sass/**/*.css', 'src/sass/**/*.scss'], ['sass']);
});

gulp.task('clean', gulpsync.sync([
	'sprite:clean', 'sass:clean', 'js:clean', 'html:clean'
]), function () {
	return del(['dist/']);
});

gulp.task('html', function() {
	return gulp.src(['src/template/**/*.html', '!src/template/inc/**/*'])
		.pipe(plumber({
			errorHandler: plumberOptionErrorHandler
		}))
		.pipe(fileInclude({
			prefix: '@@',
			basepath: ''
		}))
		.pipe(gulp.dest('src/html/'));
});
gulp.task('html:clean', function() {
	return del(['src/html/']);
});
gulp.task('html:watch', function() {
	return gulp.watch(['src/template/**/*.html'], ['html']);
});

gulp.task('js', function() {
	return gulp.src('src/resources/js/entry.js')
		.pipe(plumber({
			errorHandler: plumberOptionErrorHandler
		}))
		.pipe(browserify())
		.pipe(rename('entry.js'))
		.pipe(gulp.dest('src/resources/js/'));
});
gulp.task('js:clean', function() {
	return del(['src/resources/js/entry.js']);
});
gulp.task('js:watch', function() {
	return gulp.watch(['src/resources/js/**/*.js'], ['js']);
});

gulp.task('watch', ['sprite:watch', 'sass:watch', 'js:watch', 'html:watch']);

gulp.task('connect', function () {
	connect.server({
		root: 'src/',
		port: 8000
	});
});

gulp.task('connect-dist', function () {
	connect.server({
		root: 'dist/',
		port: 8000
	});
});

gulp.task('build', gulpsync.sync([
	'clean', 'sprite', 'sass', 'js', 'html'
]));

gulp.task('serve', gulpsync.sync([
	'build', ['connect', 'watch']
]));

gulp.task('dist', gulpsync.sync([
	'build'
]), function () {
	gulp.src(['src/resources/css/**/*.css'], {
		base: 'src/'
	})
		.pipe(cleanCSS({
			// compatibility: 'ie7',
			keepBreaks: true,
			advanced: false
		}))
		.pipe(gulp.dest('dist/'));
	gulp.src(['src/html/**/*'], {
		base: 'src/'
	})
		.pipe(gulp.dest('dist/'));
	gulp.src(['src/resources/font/**/*'], {
		base: 'src/'
	})
		.pipe(gulp.dest('dist/'));
	return gulp.src(['src/resources/img/**/*', 'src/resources/js/**/*'], {
		base: 'src/'
	})
		.pipe(gulp.dest('dist/'));
});

gulp.task('default', ['serve']);