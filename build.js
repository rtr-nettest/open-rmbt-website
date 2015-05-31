#!/usr/bin/env node

/**
 * Module dependencies.
 */

    //https://github.com/segmentio/metalsmith/blob/master/examples/project-scaffolder/build.js


var debug = require('debug')('nodeNetztest:server');
var http = require('http');
var path = require('path');


var Metalsmith = require('metalsmith');
var templates = require('metalsmith-templates');
var watch = require('metalsmith-watch');
var debug = require('debug');
debug.enable();

var langs = [];
langs.push(require("./lang/en.js"));
langs.push(require("./lang/de.js"));

var target = null, targets = ["qostest","netztest"];
var useWatch = false;

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
    .use(setConfig())
    .use(duplicateFile())
    .use(templates({
       engine: 'nunjucks'
    }))
    .use((useWatch) ? (watch({
        paths: {
            "${source}/**/*": true,
            "templates/**/*": "**/*.html",
        }
    })) : null)
    .build(function(err) {
            if (err) throw err;
        });

//exit since nunjucks does not quit
setTimeout(function() {
    if (!useWatch) {
        process.exit();
    }
}, 5000)


function setConfig() {
    return function (files, metalsmith, done) {
        //netztest or qostest?
        var metadata = metalsmith.metadata();
        metadata['target'] = target;
        metadata['basetemplate'] = (target === "qostest")?"templates/qosPage.html":"templates/netztestPage.html";

        //delete duplicate files from build
        Object.keys(files).forEach(function (file) {
            targets.forEach(function(cTarget) {
                //@TODO: Refine
                console.log(file + " - " + cTarget + " --> " + (file.indexOf("." + cTarget)))
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
            }

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