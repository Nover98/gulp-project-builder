"use strict";

const gulp = require("gulp");
const autoprefixer = require("autoprefixer");
const browsersync = require("browser-sync").create();
const del = require("del");
const glob = require("glob");
const fileinclude = require("gulp-file-include");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const replace = require("gulp-replace");
const responsive = require("gulp-responsive");
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const webp = require("gulp-webp");
const webpack = require("webpack-stream");
const gulpif = require("gulp-if");
const groupCssMediaQueries = require("node-css-mqpacker");
const postcss = require("gulp-postcss");
const sortCSSmq = require("sort-css-media-queries");
const csso = require("postcss-csso");
const cached = require("gulp-cached");
const dependents = require("gulp-dependents");
// -------------------------------------------------------------------------------------------

const src_folder = "src"; //папка с исходниками для разработки
const dist_folder = "dist"; //папка в которую собирается готовый проект

const path = {
    build: {
        html: dist_folder + "/",
        css: dist_folder + "/css/",
        js: dist_folder + "/js/",
        img: dist_folder + "/img/",
        fonts: dist_folder + "/fonts/",
        video: dist_folder + "/video/",
    },
    src: {
        html: src_folder + "/*.html",
        css: src_folder + "/scss/*.scss",
        js: src_folder + "/js/*.js",
        fonts: src_folder + "/fonts/**/*.*",
        video: src_folder + "/video/**/*.*",
        allImg: src_folder + "/img-big/**/*.*",
        mobiImg: src_folder + "/img-big/mobi/**/*.*",
        webpImg: src_folder + "/img-big/webp/**/*.*",
    },
    watch: {
        html: src_folder + "/**/*.html",
        css: src_folder + "/scss/**/*.scss",
        js: src_folder + "/js/**/*.js",
        fonts: src_folder + "/fonts/**/*.*",
        video: src_folder + "/video/**/*.*",
    },
};

// ---------------------------------------------------------------------------------------------

let mode = "development";
function setProdMode(callback) {
    callback();
    mode = "production";
}

function browserSync() {
    // версия браузерсинка должна стоять 2.24.6, в версиях новее есть баг в настройках по http://localhost:3001
    browsersync.init({
        server: {
            baseDir: "./" + dist_folder,
        },
        notify: false,
        // port: 3000
        //online: true, //browser-sync по умолчанию работает с wi-fi сетью, и без включённого инета работать не будет, чтобы открыть возможность работать без инета, надо поставить online: true,
    });
}

// /<img(.*?)src=(.*?img\/)(.*?.)(png|jpg|jpeg|svg)(.*?")(.*?)>/gis
function replaceImg(all, start, srcStart, srcMiddle, type, srcEnd, end) {
    // если у картинки в атрибутах есть слово noSource, то добавлено ничего не будет, а noSource удалится
    if (start.includes("noSource")) {
        return all.replace("noSource", "");
    }

    //если картинка в свг, ничего не заменять
    if (type == "svg") return all;

    //если путь не начинается с img, ничего не заменять
    if (!srcStart.startsWith(`"img`)) {
        //регулярка так построена, что в этом случае берёт лишнее,а в конце лишнего картинка, которую функция не заменит, поэтому её приходится заменять вручную
        const pos = all.lastIndexOf("<img");
        const img = all.slice(pos);
        const newImg = img.replace(
            /<img(.*?)src=(.*?img\/)(.*?.)(png|jpg|jpeg|svg)(.*?")(.*?)>/gis,
            replaceImg
        );
        return all.replace(img, newImg);
    }

    let sourceStart = "";

    //если есть атрибут sourceClass, то его значение будет классом для source
    if (start.includes("sourceClass")) {
        const sourceClass = start.match(/sourceClass="(.+?)"/s)[1];
        sourceStart = `class="${sourceClass}" `;
        start = start.replace(/sourceClass="(.+?)"/s, "");
    }

    //если есть ленивая загрузка, то проставляю её для сорсов
    if (start.includes("data-")) sourceStart += "data-";

    //если картинка начинается с nr_ (non-resize), то урезанные версии не добавляются
    if (srcMiddle.includes("nr_")) {
        return `
        <picture>
        <source ${sourceStart}srcset=${srcStart}webp/${srcMiddle}webp${srcEnd} type="image/webp">
        <img ${start}src=${srcStart}${srcMiddle}${type}${srcEnd}${end}>
        </picture>`;
    } else
        return `
        <picture>
        <source ${sourceStart}srcset=${srcStart}mobi/webp/${srcMiddle}webp${srcEnd} type="image/webp" media="(max-width: 1023px)">
        <source ${sourceStart}srcset=${srcStart}mobi/${srcMiddle}${type}${srcEnd} type="image/${type}" media="(max-width: 1023px)">
        <source ${sourceStart}srcset=${srcStart}webp/${srcMiddle}webp${srcEnd} type="image/webp">
        <img ${start}src=${srcStart}${srcMiddle}${type}${srcEnd}${end}>
        </picture>`;
}

function html() {
    return gulp.src(path.src.html)
        .pipe(fileinclude())
        .pipe(
            replace(
                /<img(.*?)src=(.*?img\/)(.*?.)(png|jpg|jpeg|svg)(.*?")(.*?)>/gis,
                replaceImg
            )
        )
        .pipe(
            gulpif(mode == "production",
                replace(/<div class="page-nav" id="page-nav">(.*?)<\/div>/gis, ""))
        )
        .pipe(gulp.dest(path.build.html))
        .pipe(gulpif(mode == "development", browsersync.stream()));
}

function css() {
    const plugins = [
        autoprefixer({
            grid: true,
            overrideBrowserslist: ["last 5 versions"],
            cascade: true,
        }),
        groupCssMediaQueries({
            sort: sortCSSmq,
        }),
        csso({
            restructure: true,
            sourceMap: false,
            debug: false,
        }),
    ];
    return (
        gulp.src(path.src.css)
            // .pipe(gulpif(mode == "development", cached("scss")))
            // .pipe(gulpif(mode == "development", dependents()))
            .pipe(gulpif(mode == "development", sourcemaps.init()))
            .pipe(sass().on("error", sass.logError))
            .pipe(gulpif(mode == "production", postcss(plugins)))

            .pipe(
                gulpif(mode == "development", sourcemaps.write("/sourcemaps"))
            )
            .pipe(gulp.dest(path.build.css))
            .pipe(gulpif(mode == "development", browsersync.stream()))
    );
}

function fonts() {
    //собирает файлы стилей из папки fonts и кидает их в папку fonts на билде, с этими файлами я не работаю, они нужны только для подключения, поэтому никак модифицировать я их не буду
    return gulp.src(path.src.fonts).pipe(gulp.dest(path.build.fonts));
}

function video() {
    //собирает файлы видео из папки video и кидает их в папку video на билде, с этими файлами я не работаю, они нужны только для подключения, поэтому никак модифицировать я их не буду
    return gulp.src(path.src.video).pipe(gulp.dest(path.build.video));
}

function getEntries() {
    // собираю названия всех файлов js из корневой папки и пути к ним, чтобы потом передать это в вебпак

    const entryArray = glob.sync(path.src.js);
    let entries = {};
    entryArray.forEach(function (path) {
        //разбиваю по слешу путь к файлу на части
        let pathParts = path.split("/");

        //здесь у последней части пути (это и есть название файла и его расшиерение) убираю расширение и точку (.js), поэтому стоит "-3"
        let fileName = pathParts[pathParts.length - 1].slice(0, -3);

        //по ключу fileName кладу путь к файлу
        entries[fileName] = "./" + path;
    });

    //Возвращаю объект с названием по ключу и путём по значению для вебпака
    return entries;
}

function js() {
    let webpackConfig = {
        entry: getEntries(),
        output: {
            filename: "[name].js",
        },
        mode: mode,
    };
    if (mode == "development") webpackConfig.devtool = "eval-cheap-source-map";
    return gulp.src(path.src.js)
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest(path.build.js))
        .pipe(gulpif(mode == "development", browsersync.stream()));
}

function imgToWebp() {
    return gulp.src([
        path.src.allImg,
        "!" + path.src.mobiImg,
        "!" + path.src.webpImg,
        "!" + src_folder + "/img-big/**/*.{svg,ico,gif}",
    ])
        .pipe(newer(src_folder + "/img-big/webp/"))
        .pipe(webp())
        .pipe(gulp.dest(src_folder + "/img-big/webp/"));
}

function webpSupport() {
    return gulp.src(src_folder + "/check_webp_supporting.webp").pipe(
        gulp.dest(dist_folder + "/")
    );
}

function resizeImg() {
    const imagesArray = glob.sync(
        src_folder + "/img-big/**/*.{png,jpg,jpeg,webp}"
    );
    const isImages = !!imagesArray.length;

    return gulp
        .src([
            path.src.allImg,
            "!" + src_folder + "/img-big/**/*.{svg,ico,gif}",
            "!" + src_folder + "/img-big/**/nr_*.*",
            "!" + src_folder + "/img-big/mobi/**/*.*",
        ])
        .pipe(newer(src_folder + "/img-big/mobi"))
        .pipe(
            gulpif(
                isImages, //это нужно потому, что если в сборке нет картинок, а этот таск не закоменчен, то выплёвывается ошибка на работе респонсива
                responsive({
                    "**/*": {
                        width: "50%",
                    },
                })
            )
        )
        .pipe(gulp.dest(src_folder + "/img-big/mobi"));
}

function imgToBuild() {
    return gulp
        .src(path.src.allImg)
        .pipe(newer(path.build.img))
        .pipe(
            imagemin([
                //я прописал здесь массив с методами (взятый из документации модуля), чтобы переопределить дефолтный и убрать оптимизацию svg, которая ломала мне анимацию и тд
                imagemin.gifsicle(),
                imagemin.mozjpeg(),
                imagemin.optipng(),
            ])
        )
        .pipe(gulp.dest(path.build.img))
        .pipe(gulpif(mode == "development", browsersync.stream()));
}

function watchFiles() {
    //следит за изменениями в файлах
    const imgPath = [path.src.allImg, "!" + path.src.mobiImg, "!" + path.src.webpImg];

    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.video], video);
    gulp.watch([path.watch.fonts], fonts);
    gulp.watch(imgPath, workWithImg);
}

//удаляет папку dist_folder (в которую собирается проект) и генерируемые новые папки с картинками в папке src_folder
function clean() {
    return del([dist_folder, `${src_folder}/img-big/webp`, `${src_folder}/img-big/mobi`]);
}

const workWithImg = gulp.series(imgToWebp, resizeImg, imgToBuild);

const dev = gulp.series(
    gulp.parallel(
        html,
        css,
        js,
        fonts,
        video,
        webpSupport, //это часто можно убрать вообще
        workWithImg
    ),
    gulp.parallel(browserSync, watchFiles)
);

const build = gulp.series(
    setProdMode,
    gulp.parallel(
        html,
        css,
        js,
        fonts,
        video,
        webpSupport, //это часто можно убрать вообще
        workWithImg
    )
);

exports.img = workWithImg;
exports.clean = clean;

exports.dev = gulp.series(clean, dev);
exports.build = gulp.series(clean, build);
