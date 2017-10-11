#!/usr/bin/env node

/**
 * Module dependencies.
 */

    //https://github.com/segmentio/metalsmith/blob/master/examples/project-scaffolder/build.js
var RTR_FILES_BASEURL = "https://www.rtr.at/fileadmin/template/main/grep/temp/result_temp";
var RTR_LINKS_BASEURL = "https://www.rtr.at";



var debug = require('debug')('nodeNetztest:server');
var request = require('request');
var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');
var randomstring = require('randomstring');
var gitDescribe = require('git-describe');
var mkdirp = require('mkdirp');

var nunjucks = require('nunjucks');
nunjucks.configure({ autoescape: false });

var Metalsmith = require('metalsmith');
var layouts = require('metalsmith-layouts');
var watch = require('metalsmith-watch');
var fingerprint = require('metalsmith-fingerprint-ignore');
var debug = require('debug');
debug.enable();

var langs = [];
langs.push(require("./lang/en.js"));
langs.push(require("./lang/de.js"));

var remoteFiles = require("./conf/remoteFiles.json");

var target = null, targets = ["qostest","netztest"];
var useWatch = false;
var downloadedOnce = false;

//check command line to find which target should be built
process.argv.forEach(function(val, index, array) {
    //node build netztest/qostest
    if (index === 2) {
        if (targets.indexOf(val) >= 0) {
            target = val;
        }
    }
    if (index === 3 && val === "watch") {
        useWatch = true;
    }
});

if (target === null ){
    console.log("invalid target, try 'node build netztest' or 'node build qostest");
    process.exit();
}


//execute
var metalsmith = Metalsmith(__dirname)
    //.use(generateRandomJSTestFilesIfMissing())
    .use(fetchRemoteFiles(remoteFiles))
    .use(fetchRemoteFiles(function() {
        return transformRemoteNetztestJSONtoFetchableFiles(require('./conf/filelist_nettest.json'))
    }))
    .use(transformRTRUrls([
        "./templates/parts/02_navigation_de.html",
        "./templates/parts/02_navigation_en.html",
//      "./templates/parts/03_navigationToContent_en.html",
//      "./templates/parts/03_navigationToContent_de.html",
        "./templates/parts/04_contentToFooter_de.html",
        "./templates/parts/04_contentToFooter_en.html"
    ]))
    .use(setConfig())
    .use(duplicateFile())
    .use(fingerprint({
        pattern: ['css/*.css', 'js/**/*.js',
                '!template/**/*.', '!js/test/jstest.js'],
        deactivate: useWatch,
        keep: false
    }))
    .use(fingerprint({
        pattern: ['lib/**/*.js', 'lib/**/*.css'],
        deactivate: useWatch,
        keep: true //for loading polyfills in JS
    }))
    .use(layouts({
        engine: 'nunjucks',
        directory: 'templates'
    }))
    .use((useWatch) ? (watch({
        paths: {
            "${source}/**/*": true,
            "templates/**/*": "**/*.html"
        }
    })) : null)
    .build(function(err) {
            if (err) throw err;
        });


/**
 * Check if all files required for the jstest are existing
 * if not, generate them
 */
function generateRandomJSTestFilesIfMissing() {
    return function (files, metalsmith, done) {
        //only if on first run
        if (downloadedOnce) {
            done();
            return;
        }

        var fileArray = Object.keys(files);
        var createdFiles = false;
        for (var i=0;i<=102400;i=Math.max(100,i*2)) {
            //check if file exists
            var filePath = "jstest.netztest%PS%files%PS%".replace(/%PS%/g,path.sep) + ("000000"+i).slice(-6);
            if (fileArray.indexOf(filePath) < 0) {
                //generate
                //var fileStream = fs.openSync(filePath,"w");
                filePath = "src" + path.sep + filePath;
                console.log("generating random file: " + filePath);
                if (i===0) {
                    var fd = fs.openSync(filePath,"w");
                    fs.closeSync(fd);
                }

                for (var j=0;j<i;j=j+100) {
                    var string = randomstring.generate(100*1024);
                    fs.appendFileSync(filePath, string);
                }

                createdFiles = true;
            }
        }
        if (!createdFiles) {
            done();
        }
        else {
            console.log("random files for the jstest have been created, please run the build again!");
        }
    }
}

/**
 * Transform the filelist provided by alladin-it for RTR-dependencies
 * to accomodate the fetchRemoteFiles-Metalsmith-Plugin
 * @param json
 */
function transformRemoteNetztestJSONtoFetchableFiles(json) {
    var filesArray = [];
    json.forEach(function(arg) {
        if (arg.dirAndFile.indexOf("/__nettest") === 0) {
            var file = {
                source : RTR_FILES_BASEURL + arg.dirAndFile,
                target : "./templates/parts/" + arg.file
            };
        }
        else {
            var file = {
                source : RTR_FILES_BASEURL + arg.dirAndFile,
                target : "src/" + arg.dirAndFile.replace("fileadmin","fileadmin.netztest")
            };
        }
        filesArray.push(file);
    });
    return filesArray;
}


/**
 * Download the files given in the list and save them (+ override of they exist)
 * @param fileList [{source, target}]
 */
function fetchRemoteFiles(fileList) {
    return function (files, metalsmith, done) {
        if (downloadedOnce) {
            done();
            return;
        }

        var filesArray;
        if (typeof fileList == "function") {
            filesArray = fileList();
        }
        else {
            filesArray = fileList;
        }

        var downloaded = 0;
        filesArray.forEach(function (fileInfo) {
            var folder = path.dirname(fileInfo.target);
            mkdirp.sync(folder);
            var file = fs.createWriteStream(fileInfo.target);
            request(fileInfo.source, {
                pool: {
                    maxSockets: 10
                },
                time: 100000
            }).pipe(file).on('finish', function () {
                downloaded++;
                console.log("Downloaded File: (" + downloaded + "/" + filesArray.length + ")" + fileInfo.source + " -> " + fileInfo.target);
                if (downloaded === filesArray.length) {
                    done();
                }
            });
        });
    }
}

/**
 * Replaces all URLS in the given files with URLS now redirecting
 * to the RTR baseurl
 *
 * @param fileList
 * @returns {Function}
 */
function transformRTRUrls(fileList) {
    //transformation for RTR Nettest 301 URLs
    var specialNetTestUrls = {
        "/tk/netzteststarten": "Test",
        "/tk/netztestkarte": "Karte",
        "/tk/rtrnetzteststatistik": "Statistik",
        "/tk/netztestopendata": "Opendata",
        "/tk/netztestverlauf": "Verlauf",
        "/tk/rtrnetztestoptionen": "Optionen",
        "/tk/netztest" : "/"
    };
    var replaceDirectives = [
        function($, path){
            var language = (path.indexOf("_de")>0)?"de":"en";
            $(".header-logo a").attr("href","/" + language);
        }
    ];
    
    return function(files, metalsmith, done) {
        if (downloadedOnce) {
            done();
            return;
        }
        downloadedOnce = true;

        var count = 0;
        fileList.forEach(function(path) {
            fs.readFile(path, function(err, data) {
                var $ = cheerio.load(data);

                $("a[href]").each(function(t) {
                    var href = $(this).attr("href");

                    //only replace relative URLs (no mailtos, tel, http, etc.)
                    if (href.indexOf(":") === -1 || href.indexOf(":") > 6) {
                        $(this).attr("href", RTR_LINKS_BASEURL + href);
                        
                        //maybe it's even a special nettest url that needs to be relative?
                        if (href.indexOf('netztest') !== -1) {
                            for(var key in specialNetTestUrls) {
                                if (href.endsWith(key) === true) {
                                    $(this).attr("href", specialNetTestUrls[key]);
                                }
                            }
                        }
                    }

                    replaceDirectives.forEach(function(t) {
                        t($, path);
                    });
                });

                var html = $.html();

                fs.writeFile(path, html, function(err) {
                    count++;
                    console.log("replaced relative urls in: "  + path)

                    if (count === fileList.length) {
                        done();
                    }
                });
            })
        });

    }
}

function setConfig() {
    return function (files, metalsmith, done) {
        //netztest or qostest?
        var metadata = metalsmith.metadata();
        metadata['target'] = target;
        metadata['basetemplate'] = (target === "qostest")?"templates/qosPage.html":"templates/netztestPage.html";
        try {
            metadata['gitDescribe'] = gitDescribe({
                match: false
            });
        } catch(e) {
            console.log("not a valid git directory, cannot include build info in /admin page, message: " + e.message);
        }

        //delete duplicate files from build
        Object.keys(files).forEach(function (file) {
            targets.forEach(function(cTarget) {
                //@TODO: Refine
                if (file.indexOf("." + cTarget) > 0) {
                    //rename if target, delete otherwise
                    if (cTarget === target) {
                        var newFilename = file.replace("." + cTarget,"")
                        files[newFilename] = files[file];
                    }

                    delete files[file];
                }
            });
        });

        done();
    }
}

function duplicateFile() {
    return function (files, metalsmith, done) {
        //refine language files based on target build
        langs.forEach(function(lang) {

            var flattenTargetTree = function(array, key) {
                var data = array[key];
                if (data instanceof Object) {
                    //replace based on target if exists
                    if (data[target] !== undefined) {
                        array[key] = array[key][target];
                    }
                    //elsewise, recurse with child nodes
                    else {
                        Object.keys(data).forEach(function(nKey) {
                            flattenTargetTree(data, nKey);
                        });
                    }
                }
            };

            Object.keys(lang.strings).forEach(function(key) {
                flattenTargetTree(lang.strings, key);
                /*var data = lang.strings[key];
                if (data instanceof Object) {

                    //replace based on target
                    lang.strings[key] = lang.strings[key][target];
                }*/
            });

        });

        //for each language
        Object.keys(files).forEach(function (file) {
            if (isRootHTML(file)) {
                langs.forEach(function (lang) {

                    //add for DE and EN
                    var data = files[file];
                    var newFilename = lang.language + path.sep + file;
                    var clone = JSON.parse(JSON.stringify(data));
                    files[newFilename] = clone;
                    files[newFilename].Lang = lang.strings

                });
                delete files[file];
            }
        });

        console.log("done duplicating");
        done();
    }
}



function isRootHTML(file) {
    //@TODO: Refine
    var isHTML = (file.lastIndexOf(".html") > 0);
    var isRoot = (file.indexOf(path.sep) <0);

    return isHTML && isRoot;
}
