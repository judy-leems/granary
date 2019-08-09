'use strict';

const fs = require('fs'),
  path = require('path'),
  upath = require('upath'),
  gulp = require('gulp'),
  gulpIf = require('gulp-if'),
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
  eslint = require('gulp-eslint'),
  imagemin = require('gulp-imagemin'),
  del = require('del'),
  colors = require('ansi-colors'),
  columnify = require('columnify'),
  vinylFTP = require('vinyl-ftp'),
  lodash = require('lodash');

const REGEXP = {
  separDoubledashRegex: /(.*)--+(.*)/g,
  separAtsignRegex: /(.*)@+(.*)/g,
  cleanJspScriptRegex: /.*<%(.*)%>.*\n/g,
  camelCaseRegex: /^([A-Z])|[\s-_](\w)/g
};

const plumberErrorHandler = function (err) {
  console.log(err.message);
  this.emit('end');
};

const createFileExistsChecker = (callback, array, timer = 1000, turn = 5) => {
  let index = 0;
  if (array.length === 0) {
    console.log(colors.red('No such Directory.'));
    return callback();
  }
  console.log('File exists checking.');
  const interval = setInterval(() => {
    array.map((key) => {
      fs.stat(key, (err) => {
        if (err == null) {
          const index = array.indexOf(key);
          if (index !== -1) {
            array.splice(index, 1);
          }
        }
      });
    });
    if (array.length === 0) {
      console.log(colors.green('Exists!.'));
      clearInterval(interval);
      return callback();
    }
    if (index++ >= turn) {
      console.log(colors.red('No file created.'));
      clearInterval(interval);
      return callback();
    }
  }, timer);
};

gulp.task('iconfont', (callback) => {
  const iconFontName = 'Font-Awesome';
  const iconFontOption = {
    prependUnicode: false,
    fontName: iconFontName,
    formats: ['ttf', 'woff', 'woff2'],
    appendCodepoints: true,
    timestamp: Math.round(Date.now() / 1000),
  };
  gulp.src(['src/assets/icons/*.svg'])
    .pipe(plumber({
      errorHandler: plumberErrorHandler
    }))
    .pipe(iconfont(iconFontOption))
    .on('glyphs', (glyphs) => {
      const iconFontCSSOptions = {
        fontName: iconFontName,
        fileName: 'fileNameTest',
        fontPath: '../font/',
        date: new Date().getTime(),
        glyphs: glyphs.map((glyph) => {
          const cssName = glyph.name.replace(REGEXP.camelCaseRegex, function(match, p1, p2, offset) {
            if (p2) return p2.toUpperCase();
            return p1.toLowerCase();
          });
          return {
            name: glyph.name,
            codepoint: glyph.unicode[0].charCodeAt(0),
            cssName: cssName
          }
        })
      };
      gulp.src('lib/icons/icons.scss.handlebars')
        .pipe(consolidate('lodash', iconFontCSSOptions))
        .pipe(rename({ basename: '_icon', extname: '.scss' }))
        .pipe(gulp.dest('src/assets/sass/standard/settings/'))
        .pipe(gulp.dest('src/assets/sass/integrated-account/settings/'));
    })
    .pipe(gulp.dest('src/assets/font/'));
  let iconFontDistArr = [];
  iconFontDistArr.push('src/assets/sass/standard/settings/_icon.scss');
  iconFontDistArr.push('src/assets/sass/integrated-account/settings/_icon.scss');
  iconFontOption.formats.map((key) => {
    iconFontDistArr.push('src/assets/font/' + iconFontName + '.' + key);
  });
  return createFileExistsChecker(callback, iconFontDistArr);
});
gulp.task('iconfont:clean', () => {
  return del(['src/assets/sass/standard/settings/_icon.scss', 'src/assets/sass/integrated-account/settings/_icon.scss']);
});
gulp.task('iconfont:watch', () => {
  return gulp.watch(['src/assets/icons/*.svg', 'lib/icons/*'], ['iconfont']);
});

/*
gulp.task('sprite', (callback) => {
  const spriteSrcDir = 'src/assets/sprites',
    spriteSrcDirWithRoot = __dirname + '/' + spriteSrcDir,
    setSpriteCSSValMap = (obj, namespace, name, effectArr, responsive, pixelRatio) => {
      obj.namespace = namespace;
      obj.name = name;
      obj.responsive = responsive;
      obj.y = obj.y === 0 ? 0 : -obj.y;
      obj.x = obj.x === 0 ? 0 : -obj.x;
      if (typeof pixelRatio === 'number' && pixelRatio > 1) {
        obj.y = obj.y / pixelRatio;
        obj.x = obj.x / pixelRatio;
        obj.width = obj.width / pixelRatio;
        obj.height = obj.height / pixelRatio;
        obj.canvas_width = obj.total_width / pixelRatio;
        obj.canvas_height = obj.total_height / pixelRatio;
      } else {
        obj.canvas_width = obj.total_width;
        obj.canvas_height = obj.total_height;
      }
      for (let _i = 0; _i < effectArr.length; _i++) {
        obj.name += ':' + effectArr[_i];
      }
    };
  let spriteDistArr = [];
  try {
    fs.readdirSync(spriteSrcDirWithRoot).map((key) => {
      if (fs.statSync(path.join(spriteSrcDirWithRoot, key)).isDirectory() === false) return false;
      const spriteDistImgDir = 'src/assets/image/',
        spriteDistCSSDir = 'src/assets/sass/settings/sprite/',
        spriteTypeCondition = key.match(REGEXP.separAtsignRegex),
        spriteNamespace = spriteTypeCondition ? RegExp.$1 + '-' + RegExp.$2 : key,
        spriteCssName = 'spr-' + key,
        spriteSourceName = 'spr-' + spriteNamespace,
        spriteSourcePath = spriteSrcDir + '/' + key + '/',
        spriteImgPathInCSS = '/assets/image/',
        spriteType = spriteTypeCondition ? RegExp.$2 : '1x',
        spritePixelRatio = ~~spriteType.slice(0, 1) || 1;
      let spriteData,
        spriteDataOption = {
          imgName: spriteSourceName + '.png',
          imgPath: spriteImgPathInCSS + spriteSourceName + '.png',
          cssName: '_' + spriteCssName + '.scss',
          cssTemplate: 'lib/spritesmith/sprites.scss.handlebars',
          padding: 2
        },
        spriteResponsive = false;
      spriteDistArr.push(spriteDistImgDir + spriteDataOption.imgName);
      spriteDistArr.push(spriteDistCSSDir + spriteDataOption.cssName);
      if (spriteType == 'responsive') {
        spriteResponsive = true;
        spriteDataOption.retinaSrcFilter = spriteSourcePath + '*@retina.png';
        spriteDataOption.retinaImgName = spriteSourceName + '@retina.png';
        spriteDataOption.retinaImgPath = spriteImgPathinCSS + spriteSourceName + '@retina.png';
        spriteDistArr.push(spriteDistImgDir + spriteDataOption.retinaImgName);
      }
      spriteDataOption.cssVarMap = (sprite) => {
        if (sprite.name.match(REGEXP.separAtsignRegex) !== null) return false;
        let spriteName = sprite.name,
          spriteNameEffectCondition,
          spriteEffectArr = [];
        spriteNameEffectCondition = spriteName.match(REGEXP.separAtsignRegex);
        spriteName = spriteNameEffectCondition ? RegExp.$1 : spriteName;
        spriteNameEffectCondition = spriteName.match(REGEXP.separDoubledashRegex);
        spriteName = spriteNameEffectCondition ? RegExp.$1 : spriteName;
        if (spriteNameEffectCondition !== null) {
          for (let _i = 2; _i <= 8; _i++) {
            const thisRegexp = RegExp['$' + _i];
            if (thisRegexp == '') break;
            else spriteEffectArr.push(thisRegexp);
          }
        }
        setSpriteCSSValMap(sprite, spriteNamespace, spriteName, spriteEffectArr, spriteResponsive, spritePixelRatio);
      };
      spriteData = gulp.src(spriteSourcePath + '*.png')
        .pipe(plumber({
          errorHandler: plumberErrorHandler
        }))
        .pipe(spritesmith(spriteDataOption));
      spriteData.img.pipe(gulp.dest(spriteDistImgDir));
      spriteData.css.pipe(gulp.dest(spriteDistCSSDir));
    });
    return createFileExistsChecker(callback, spriteDistArr);
  } catch (e) {
    console.log(colors.red('No such ' + spriteSrcDir + ' Directory.'));
    return callback();
  }
});
gulp.task('sprite:clean', () => {
  return del(['src/assets/sass/!**!/sprite/', 'src/assets/image/!**!/spr-*.png']);
});
gulp.task('sprite:watch', () => {
  return gulp.watch(['src/assets/sprites/!**!/!*', 'lib/spritesmith/!*'], ['sprite']);
});
*/

gulp.task('sass', () => {
  return gulp.src(['src/assets/sass/standard/**/*.scss', 'src/assets/sass/integrated-account/**/*.scss'])
    .pipe(plumber({
      errorHandler: plumberErrorHandler
    }))
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded'
    }))
    .pipe(postCSS([autoprefixer({
      remove: false,
      browsers: ['last 1 version']
    })]))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('src/assets/css/'));
});
gulp.task('sass:clean', () => {
  return del(['src/assets/css/style.css', 'src/assets/css/integrated-account-style.css', 'src/assets/css/*.map']);
});
gulp.task('sass:watch', () => {
  return gulp.watch(['src/assets/sass/**/*.scss'], ['sass']);
});

gulp.task('eslint', () => {
  return gulp.src(['src/assets/js/*.js'])
    .pipe(plumber({
      errorHandler: plumberErrorHandler
    }))
    .pipe(eslint())
    .pipe(eslint.format());
});
gulp.task('eslint:watch', () => {
  return gulp.watch(['src/assets/js/*.js'], ['eslint']);
});

const htmllintReporter = (path, issues) => {
  if (issues.length > 0) {
    console.log(colors.underline(path));
    let issueArr = [];
    issues.map((issue) => {
      issueArr.push({
        indent: '',
        number: issue.line + ':' + issue.column,
        error: colors.red('error'),
        msg: issue.msg,
        rule: issue.rule
      });
    });
    const issueColumn = columnify(issueArr, {
      showHeaders: false,
      columnSplitter: '  '
    });
    console.log(issueColumn);
    process.exitCode = 1;
  }
};

gulp.task('htmllint', () => {
  return gulp.src(['src/html/**/*.html', '!src/html/index.html'])
    .pipe(plumber({
      errorHandler: plumberErrorHandler
    }))
    .pipe(htmllint({}, htmllintReporter));
});
gulp.task('htmllint:watch', () => {
  return gulp.watch(['src/html/**/*.html'], ['htmllint']);
});

let htmlWatchSrcDir = null;

function htmlWatchSrcDirChange(file) {
  const path = upath.normalize(file.path).replace(upath.normalize(__dirname) + '/', '').replace('template/', 'template/**/');
  const exclude = '@include';
  htmlWatchSrcDir = path.indexOf(exclude) > -1 ? null : path;
}

gulp.task('html', () => {
  const htmlSrcDir = htmlWatchSrcDir || ['src/template/**/*.html', '!src/template/@include/**/*'];
  htmlWatchSrcDir = null;
  return gulp.src(htmlSrcDir)
    .pipe(plumber({
      errorHandler: plumberErrorHandler
    }))
    .pipe(fileInclude({
      basepath: 'src/',
      indent: true,
      context: {
        webview: 'false',
      },
    }))
    .pipe(replace(REGEXP.cleanJspScriptRegex, ''))
    .pipe(gulp.dest('src/html/'));
});
gulp.task('html:clean', () => {
  return del(['src/html/']);
});
gulp.task('html:watch', () => {
  return gulp.watch(['src/template/**/*.html'], ['html'])
    .on('add', (file) => htmlWatchSrcDirChange(file))
    .on('change', (file) => htmlWatchSrcDirChange(file));
});

gulp.task('docHtml', () => {
  return gulp.src(['src/doc/template/**/*.html', '!src/doc/template/@include/**/*'])
    .pipe(plumber({
      errorHandler: plumberErrorHandler
    }))
    .pipe(fileInclude({
      basepath: 'src/doc/',
      indent: true
    }))
    .pipe(gulp.dest('src/doc/html/'));
});
gulp.task('docHtml:clean', () => {
  return del(['src/doc/html/']);
});
gulp.task('docHtml:watch', () => {
  return gulp.watch(['src/doc/template/**/*.html'], ['docHtml']);
});

gulp.task('connect', () => {
  connect.server({
    root: 'src/',
    port: 3000
  });
});

gulp.task('clean', (callback) => {
  sequence('iconfont:clean', 'sass:clean', 'html:clean', 'docHtml:clean', () => {
    del(['dist/']);
    callback();
  });
});

gulp.task('watch', (callback) => {
  sequence('iconfont:watch', 'sass:watch', 'eslint:watch', 'html:watch', 'htmllint:watch', 'docHtml:watch', callback);
});

gulp.task('build', (callback) => {
  sequence('clean', 'iconfont', 'sass', 'eslint', 'html', 'docHtml', 'htmllint', callback);
});

gulp.task('serve', (callback) => {
  sequence('build', 'watch', 'connect', callback);
});

gulp.task('dist:image', () => {
  return gulp.src(['src/assets/image/**/*'], {
    base: 'src/'
  })
    .pipe(imagemin())
    .pipe(gulp.dest('dist/'));
});
gulp.task('dist:html', () => {
  var  htmlSrcDir = process.env.NODE_ENV === 'production' ? ['src/html/**/*', '!src/html/cstmr_support/policy/indinfo*.html'] : ['src/html/**/*'];
  if (process.env.NODE_ENV === 'production') {
    console.log(colors.red('/html/cstmr_support/policy/indinfo*.html 파일을 제외합니다.'));
  }
  return gulp.src(htmlSrcDir, {
      base: 'src/'
    })
    .pipe(gulpIf(process.env.NODE_ENV === 'production', replace(/\"\/assets\//g, '"/svn/design/trunk/DesignMob/assets/')))
    .pipe(gulp.dest('dist/'));
});
gulp.task('dist:css', () => {
  return gulp.src(['src/assets/css/**/*.css', '!src/assets/css/terms.css'], {
      base: 'src/'
    })
    .pipe(purifyCSS(['src/assets/js/**/*.js', 'src/html/**/*.html']))
    .pipe(cleanCSS())
    .pipe(gulp.dest('dist/'));
});
// gulp.task('dist:js', () => {
//   return gulp.src(['src/assets/js/**/*'], {
//       base: 'src/'
//     })
//     .pipe(gulpIf(process.env.NODE_ENV === 'production', replace(/\'\/html\//g, '\'/svn/design/trunk/DesignMob/html/')))
//     .pipe(gulp.dest('dist/'));
// });
gulp.task('dist', (callback) => {
  sequence('build', 'dist:image', 'dist:html', 'dist:css', () => {
    gulp.src(['src/assets/font/**/*', 'src/assets/icons/**/*', 'src/assets/js/**/*', 'src/doc/html/*', 'src/doc/assets/**/*'], {
        base: 'src/'
      })
      .pipe(gulp.dest('dist/'))
      .on('end', callback);
  });
});

gulp.task('deploy', () => {
  const deployJson = JSON.parse(fs.readFileSync('deploy.json'));
  const ftpConnect = vinylFTP.create({
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

gulp.task('default', (callback) => {
  sequence('serve', callback);
});
