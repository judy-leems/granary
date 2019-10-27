'use strict';

var fs = require('fs'),
  path = require('path'),
  upath = require('upath'),
  gulp = require('gulp/default/gulpfile'),
  es = require('event-stream'),
  sequence = require('gulp-sequence'),
  connect = require('gulp-connect'),
  plumber = require('gulp-plumber'),
  fileInclude = require('gulp-file-include'),
  replace = require('gulp-replace'),
  rename = require('gulp-rename'),
  htmllint = require('gulp-htmllint'),
  iconfont = require('gulp-iconfont'),
  consolidate = require('gulp-consolidate'),
  spritesmith = require('gulp.spritesmith'),
  sourcemaps = require('gulp-sourcemaps'),
  sass = require('gulp-sass'),
  postCSS = require('gulp-postcss'),
  autoprefixer = require('autoprefixer'),
  purifyCSS = require('gulp-purifycss'),
  cleanCSS = require('gulp-clean-css'),
  imagemin = require('gulp-imagemin'),
  gulpsync = require('gulp-sync')(gulp),
  del = require('del'),
  colors = require('ansi-colors'),
  columnify = require('columnify'),
  vinylFTP = require('vinyl-ftp'),
  lodash = require('lodash');

var REGEXP = {
  separDoubledashRegex: /(.*)--+(.*)/g,
  separAtsignRegex: /(.*)@+(.*)/g,
  cleanJspScriptRegex: /.*<%(.*)%>.*\n/g,
  camelCaseRegex: /^([A-Z])|[\s-_](\w)/g
};

var directoryTypeArr = [
  'src/'
];


var plumberErrorHandler = function (err) {
  console.log(err.message);
  this.emit('end');
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
      setDelayAfterTask(callback, 0, ret);
      console.log('Exists!');
    }
  }, timer);
};

var plumberOptionErrorHandler = function (err) {
  console.log(err);
  this.emit('end');
};

gulp.task('sass', function() {
  var tasks = directoryTypeArr.map(function(dir) {
    return gulp.src([dir + '/assets/sass/**/*.scss'])
      .pipe(plumber({
        errorHandler: plumberOptionErrorHandler
      }))
      .pipe(sourcemaps.init())
      .pipe(sass({
        outputStyle: 'expanded'
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(dir + '/assets/css/'));
  });
  return es.merge.apply(null, tasks);
});
gulp.task('sass:clean', function() {
  var cleanDirArr = [];
  directoryTypeArr.map(function(dir) {
    cleanDirArr.push(dir + '/assets/css/');
  });
  return del(cleanDirArr);
});
gulp.task('sass:watch', function() {
  var watchDirArr = [];
  directoryTypeArr.map(function(dir) {
    watchDirArr.push(dir + '/assets/sass/**/*.scss');
  });
  return gulp.watch(watchDirArr, ['sass']);
});

gulp.task('html', function() {
  var tasks = directoryTypeArr.map(function(dir) {
    return gulp.src([dir + '/template/**/**/*.html', '!' + dir + '/template/**/include/**/*'])
      .pipe(plumber({
        errorHandler: plumberOptionErrorHandler
      }))
      .pipe(fileInclude({
        prefix: '@@',
        basepath: ''
      }))
      .pipe(replace(REGEXP.cleanJspScriptRegex, ''))
      .pipe(gulp.dest(dir + '/html/'));
  });
  return es.merge.apply(null, tasks);
});

gulp.task('html:clean', function () {
  return del(['src/**/html/']);
});
gulp.task('html:watch', function() {
  var watchDirArr = [];
  directoryTypeArr.map(function(dir) {
    watchDirArr.push(dir + '/template/**/*.html');
  });
  return gulp.watch(watchDirArr, ['html']);
});

gulp.task('clean', gulpsync.sync(['sass:clean', 'html:clean']), function () {
  return del(['dist/']);
});

gulp.task('watch', ['sass:watch', 'html:watch']);


gulp.task('connect', function () {
  connect.server({
    root: 'src/',
    port: 8000
  });
});


gulp.task('build', gulpsync.sync(['clean', 'sass', 'html']));

gulp.task('serve', gulpsync.sync(['build', ['connect', 'watch']]));

gulp.task('dist', gulpsync.sync(['build']), function () {
  var tasks = directoryTypeArr.map(function(dir) {
    return gulp.src([dir + '/assets/css/**/*.css'], {
      base: 'src/'
    })
      .pipe(gulp.dest('dist/'));
  });
  tasks.push(
    gulp.src(['src/**/html/**/*'], {
      base: 'src/'
    })
      .pipe(gulp.dest('dist/'))
  );
  tasks.push(
    gulp.src(['src/**/assets/image/**/**/*'], {
      basic: 'src/'
    })
      .pipe(imagemin())
      .pipe(gulp.dest('dist/'))
  );
  tasks.push(
    gulp.src(['src/**/assets/js/**/*', 'src/**/assets/font/**/*'], {
      basic: 'src/'
    })
      .pipe(gulp.dest('dist/'))
  );
  return es.merge.apply(null, tasks);
});



gulp.task('deploy', () => {
  var deployJson = JSON.parse(fs.readFileSync('deploy.json'));
  var ftpConnect = vinylFTP.create({
    host: deployJson.host,
    user: deployJson.user,
    password: deployJson.password
  });
  gulp.src('dist/**/*')
    .pipe(plumber({
      errorHandler: plumberErrorHandler
    }))
    .pipe(ftpConnect.dest(deployJson.path));
});


gulp.task('default', ['serve']);