/*******************************************************************************
 * Copyright 2013-2020 Rundfunk und Telekom Regulierungs-GmbH (RTR-GmbH)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

"use strict";

var repetitions = 5;
var waitingTime = 15*60;
var maxRetries = 3;
var retryTimeoutSeconds = 10;
var lastKnownGeoPosition = null;

var LoopTestVisualization = (function () {
    var _rmbtTest;

    var _serverName = null;
    var _remoteIp = null;
    var _providerName = null;
    var _testUUID = '';

    var _redraw_loop = null;
    var _successCallback = null;
    var _errorCallback = null;

    function LoopTestVisualization(successCallback, errorCallback) {
        if (typeof successCallback !== 'undefined') {
            _successCallback = successCallback;
            _errorCallback = errorCallback;
        }

        //reset
        $("#infogeo").html('-');
        $("#infoserver").html('-');
        $("#infoip").html('-');
        $("#infoprovider").html('-');
        $("#infoping span").text("-");
        $("#infodown span").text("-");
        $("#infoup span").text("-");
    }

    function progress_segment(status, progress) {
        var ProgressSegmentsTotal = 96;
        var ProgressSegmentsInit = 1;
        var ProgressSegmentsInitDown = 13;
        var ProgressSegmentsPing = 15;
        var ProgressSegmentsDown = 34;
        var ProgressSegmentsInitUp = 4;
        var ProgressSegmentsUp = 29;
        var progressValue = 0;
        var progressSegments = 0;
        switch (status) {
            case "INIT":
                progressSegments = + Math.round(ProgressSegmentsInit * progress);
                break;
            case "INIT_DOWN":
                progressSegments = ProgressSegmentsInit + Math.round(ProgressSegmentsInitDown * progress);
                break;
            case "PING":
                progressSegments = ProgressSegmentsInit + ProgressSegmentsInitDown + Math.round(ProgressSegmentsPing * progress);
                break;
            case "DOWN":
                progressSegments = ProgressSegmentsInit + ProgressSegmentsInitDown + ProgressSegmentsPing + Math.round(ProgressSegmentsDown * progress);
                break;
            case "INIT_UP":
                progressSegments = ProgressSegmentsInit + ProgressSegmentsInitDown + ProgressSegmentsPing + ProgressSegmentsDown + Math.round(ProgressSegmentsInitUp * progress);
                break;
            case "UP":
                progressSegments = ProgressSegmentsInit + ProgressSegmentsInitDown + ProgressSegmentsPing + ProgressSegmentsDown + ProgressSegmentsInitUp + Math.round(ProgressSegmentsUp * progress);
                progressSegments = Math.min(95, progressSegments);
                break;
            case "END":
                progressSegments = ProgressSegmentsTotal;
                break;
            case "QOS_TEST_RUNNING":
                progressSegments = 95;
                break;
            case TestState.SPEEDTEST_END:
            case TestState.QOS_END:
                progressSegments = 95;
                break;
            case "ERROR":
            case "ABORTED":
                progressSegments = 0;
                break;
        }
        progressValue = progressSegments / ProgressSegmentsTotal;
        return progressValue;
    }

    /**
     * Sets the RMBT Test object
     * @param {Object} rmbtTest has to support {RMBTIntermediateResult}.getIntermediateResult
     */
    LoopTestVisualization.prototype.setRMBTTest = function (rmbtTest) {
        _rmbtTest = rmbtTest;
    };

    LoopTestVisualization.prototype.updateInfo = function (serverName, remoteIp, providerName, testUUID) {
        _serverName = serverName;
        _remoteIp = remoteIp;
        _providerName = providerName;
        _testUUID = testUUID;
        currentTestUUID = testUUID;
    };

    /**
     * function to show current status
     * @param {string} curStatus status that will be displayed
     */
    function set_status(curStatus) {
        var text;
        var elem = null;

        switch (curStatus) {
            case TestState.LOCATE:
                text = Lang.getString('Locating');
                break;
            case TestState.INIT:
            case TestState.INIT_DOWN:
                text = Lang.getString('Initializing');
                break;
            case TestState.WAIT:
                text = Lang.getString('WaitForSlot');
                break;
            case TestState.INIT_UP:
                text = Lang.getString('Init_Upload');
                elem = "infoup";
                break;
            case TestState.PING:
                text = Lang.getString("Ping");
                elem = "infoping";
                break;
            case TestState.DOWN:
                text = Lang.getString("Download");
                elem = "infodown";
                break;
            case TestState.UP:
                text = Lang.getString("Upload");
                elem = "infoup";
                break;
            case TestState.END:
                text = Lang.getString('Finished');
                break;
            case TestState.ERROR:
                text = Lang.getString('Error');
                elem = "not-here";
                break;
            case TestState.ABORTED:
                text = Lang.getString('Aborted');
                break;
            default:
                console.log("Unknown test state: " + curStatus);
        }
        if (elem !== null) {
            $("#infocurrent").find("div.uk-grid").not(":has(#" + elem + ")").find(".loader").hide();
            $("#infocurrent").find("div.uk-grid #" + elem + " .loader").show();
        }
        else {
            $("#infocurrent").find("div.uk-grid  .loader").hide();
        }
        $("#infostatus").text(text);
    }

    LoopTestVisualization.prototype.setStatus = function (status) {
        set_status(status);
    };

    LoopTestVisualization.prototype.setLocation = function (latitude, longitude) {
        //from Opentest.js
        var formatCoordinate = function (decimal, label_positive, label_negative) {
            var label = (decimal < 0) ? label_negative : label_positive;
            var deg = Math.floor(Math.abs(decimal));
            var tmp = Math.abs(decimal) - deg;
            var min = tmp * 60;
            return label + " " + deg + "&deg; " + min.toFixed(3) + "'";
        };

        var text = "";
        latitude = formatCoordinate(latitude, Lang.getString('North'), Lang.getString('South'));
        longitude = '&emsp;' + formatCoordinate(longitude, Lang.getString('East'), Lang.getString('West'));
        text = latitude + " " + longitude;

        //set
        $("#infogeo").html(text);
    };

    var lastProgress = -1;
    var lastStatus = -1;

    function draw() {


        var result = _rmbtTest.getIntermediateResult();
        var status, ping, down, up, up_log, down_log;
        var progress, showup = "-", showdown = "-", showping = "-";
        var result = _rmbtTest.getIntermediateResult();
        if (result === null || (result.progress === lastProgress && lastProgress !== 1 && lastStatus === result.status.toString())
            && lastStatus !== TestState.QOS_TEST_RUNNING && lastStatus !== TestState.QOS_END && lastStatus !== TestState.SPEEDTEST_END) {
            _redraw_loop = setTimeout(draw, 250);
            return;
        }
        lastProgress = result.progress;
        lastStatus = result.status.toString();

        if (result !== null) {
            down = result.downBitPerSec;
            up = result.upBitPerSec;
            down_log = result.downBitPerSecLog;
            up_log = result.upBitPerSecLog;
            ping = result.pingNano;
            status = result.status.toString();
            progress = result.progress;
            //console.log("down:"+down+" up:"+up+" ping:"+ping+" progress:"+progress+" status:"+status);
        }

        if (_serverName !== undefined && _serverName !== null && _serverName !== '') {
            $("#infoserver").html(_serverName);
        }

        if (_remoteIp !== undefined && _remoteIp !== null && _remoteIp !== '') {
            $("#infoip").html(_remoteIp);
        }

        if (_providerName !== undefined && _providerName !== null && _providerName !== '') {
            $("#infoprovider").html(_providerName);
        }

        //show-Strings
        if (ping > 0) {
            showping = (ping / 1000000);
            showping = showping.formatNumber(getSignificantDigits(showping)) + " " + Lang.getString('ms');
            $("#infoping span").text(showping);
        }

        if (down > 0) {
            showdown = (down / 1000000);
            showdown = showdown.formatNumber(getSignificantDigits(showdown)) + " " + Lang.getString("Mbps");
            $("#infodown span").text(showdown);
        }

        if (up > 0) {
            showup = (up / 1000000);
            showup = showup.formatNumber(getSignificantDigits(showup)) + " " + Lang.getString("Mbps");
            $("#infoup span").text(showup);
        }

        function drawLoop() {
            var fullProgress = Math.round(progress_segment(status, progress) * 100);
            $("#testprogress").css("width", fullProgress + "%");
            $("#testprogress").text(fullProgress + " %");
        };

        drawLoop();

        set_status(status);

        if (status !== "END" && status !== "ERROR" && status !== "ABORTED") {
            _redraw_loop = setTimeout(draw, 250);
            //Draw a new chart
        } else if (status === "ERROR" || status === "ABORTED") {
            if (_successCallback !== null) {
                var t = _errorCallback;
                _errorCallback = null;
                t(result);
            }
        } else if (status === "END") {
            // call callback that the test is finished
            if (_successCallback !== null) {
                var t = _successCallback;
                _successCallback = null;
                result["testUUID"] = _testUUID;
                t(result);
            }
        }
    }

    /**
     * Starts the gauge/progress bar
     * and relies on .getIntermediateResult() therefore
     *  (function previously known as draw())
     */
    LoopTestVisualization.prototype.startTest = function () {
        //first draw, then the timeout should kick in
        draw();
    };

    return LoopTestVisualization;
})();

function getSignificantDigits (number) {
    if (number >= 10) {
        return 0;
    }
    else if (number >= 1) {
        return 1;
    }
    else if (number >= 0.1) {
        return 2;
    }
    else {
        return 3;
    }
};


$(document).ready(function () {
    if (typeof certTest === 'undefined' && typeof iframeTest === 'undefined') {
        //1. check TOC
        //this will callback to RMBTLoopTest
        //via popupform ->
        show_agbform(false, 'RMBTsettings', 'loop');
    } else if (typeof iframeTest === 'undefined') {
        show_agbform(false, 'RMBTsettings', 'certTest');
    }
});

var clientUUID;
var loopUUID;
var currentTestUUID;
function RMBTLoopTest(uuid){
    var onError = function() {
        window.location = "/" + selectedLanguage;
    };
    clientUUID = uuid;

    //override userServiceSelection if server was selected to just affect the test itself
    if (UserConf.preferredServer !== "default") {
        userServerSelection = true;
    }

    //2. show loop mode info 1
    show_agb_popup(function () {
            //3. show loop mode info 2
            show_agb_popup(function () {
                //looking forward to using Promises in the future :-))
                $("#loading-placeholder").remove();
                $("#loop-mode-form-container").show();

                //4. bind to form submit -> then start test
                $("#loop-mode-form").submit(function (event) {
                    event.preventDefault();

                    repetitions = $("#loop-mode-repetitions").val();
                    waitingTime = $("#loop-mode-waiting-time").val() * 60;

                    //animations
                    $("#loop-mode-form-container").slideUp();
                    $("#loop-mode").slideDown();

                    conductTests();
                })


            }, onError, {
                tocFile: "loop_mode_info2.html",
                title: Lang.getString("LoopMode"),
                cookieIdentifier: "loopMode2",
                cookieExpiresSeconds: 24 * 60 * 60, //one day
                cookieExpiresSecondsWithCheckbox: 24 * 60 * 60 * 183, //half a year
                showCheckbox: true
            })

        }, onError, {
            tocFile: "loop_mode_info.html",
            title: Lang.getString("LoopMode"),
            cookieIdentifier: "loopMode1",
            cookieExpiresSeconds: 24 * 60 * 60, //one day
            cookieExpiresSecondsWithCheckbox: 24 * 60 * 60 * 183, //half a year
            showCheckbox: true
        }
    )
}
function RMBTCertTest(uuid) {
    clientUUID = uuid;
}

var results=[];

function conductTests() {
    var retryCount = 0;

    var resultTemplate = Handlebars.compile($("#resultTemplate").html());
    var titleText = "# " + document.title;

    var tests = 0;
    var newTests = 0;
    var currentTestStart = moment();
    var previousTestStart = null;
    var firstTestStart = moment().startOf('second');
    $("#testcount").text(tests);
    $("#teststotal").text(repetitions);

    var testSuccessCallback = function (result) {
        result.down = result.downBitPerSec / 1e6;
        result.up = result.upBitPerSec / 1e6;
        result.ping = result.pingNano / 1e6;
        result.time = currentTestStart.toDate();

        //if on first test, or if date has changed,
        //also print full datetime
        if (previousTestStart === null ||
            previousTestStart.date() !== currentTestStart.date()) {
            result.fullDate = true;
        }

        results.push(result);

        //add result to table
        $("#verlauf_tbody").prepend(resultTemplate(result));

        //calculate median
        var calculateAndFormatMedian = function(field) {
            var tArr = [];
            $.each(results, function(i, result) {
                tArr.push(result[field]);
            });
            var median = Math.median(tArr);
            return median.formatNumber(getSignificantDigits(median));
        };
        $("#mediandown").text(calculateAndFormatMedian("down"));
        $("#medianup").text(calculateAndFormatMedian("up"));
        $("#medianping").text(calculateAndFormatMedian("ping"));

        testFinished();
    };
    var testErrorCallback = function (result) {
        var result = {
            time: currentTestStart.toDate(),
            error: true
        };

        if (previousTestStart === null ||
            previousTestStart.date() !== currentTestStart.date()) {
            result.fullDate = true;
        }

        //if the test failed, retry it
        if (retryCount < maxRetries) {
            retryCount++;
            window.setTimeout(function () {
                startSingleTest(tests, testSuccessCallback, testErrorCallback);
            }, retryTimeoutSeconds * 1e3 * (1 + retryCount));
            return;
        }

        //add error to table
        $("#verlauf_tbody").prepend(resultTemplate(result));

        testFinished();
    };

    var lastTimeslotCounter = 0;

    var testFinished = function (result) {
        tests++;
        previousTestStart = currentTestStart;

        //once again, check boundaries
        waitingTime = Math.min(waitingTime, 60*60*48);
        waitingTime = Math.max(waitingTime, 60*5);
        repetitions = Math.min(repetitions, 500);
        repetitions = Math.max(repetitions, 1);

        //check for hard cutoff after two days
        var cutoffReached = (moment().diff(firstTestStart,'days') >= 2);

        $("#infostatus").text(Lang.getString("WaitingForStart"));
        $("#testcount").text(tests);
        $("#teststotal").text(repetitions);
        $(".progress-bar").addClass("inactive");

        //update title text if in background (= notify the user - new test)
        if (document.hidden) {
            newTests++;
            document.title = titleText.replace("#", "(" + newTests + ")");
        }

        if (tests < repetitions && !cutoffReached) {
            //calculate the next possible timeslot for a test based on the set interval
            var timeslotCounter = Math.floor(moment().diff(firstTestStart, 'seconds') / waitingTime);

            lastTimeslotCounter = timeslotCounter;
            var nextTestStart = firstTestStart.add((timeslotCounter + 1) * waitingTime, 'seconds');
            waitForNextTest(tests, nextTestStart, function () {
                currentTestStart = moment();
                startSingleTest(tests, testSuccessCallback, testErrorCallback);
                $(".progress-bar").removeClass("inactive");
            });


            //was the client in standby, skipping tests?
            while (nextTestStart.diff(moment()) < 0) {
                nextTestStart = nextTestStart.add(waitingTime, 'seconds');
            }


        }
        else {
            allTestsFinished();
        }
    };

    //reset title text if tab becomes visible again
    document.addEventListener("visibilitychange", function() {
        if (!document.hidden) {
            newTests = 0;
            document.title = titleText.replace("# ","");
        }
    });

    startSingleTest(tests, testSuccessCallback, testErrorCallback);
}

function waitForNextTest(i, targetTime, callback) {
    var waitingTimeS = targetTime.diff(moment(),"seconds");
    var timeoutFunction = function () {
        var currentTime = moment();
        var diff = moment(targetTime.diff(currentTime));
        var secondsLeft = diff.unix();
        var display = diff.format("mm:ss");
        if (secondsLeft >= (60*60)) {
            display = display = Math.floor(secondsLeft/60.0/60.0) + ":" + display;
        }
        if (diff <= 0) {
            callback();
        }
        else {
            var percent = secondsLeft / waitingTimeS;
            $("#testprogress").text(display);
            $("#testprogress").css("width", (percent * 100) + "%");
            window.setTimeout(timeoutFunction, 250);
        }
    };
    timeoutFunction();
}

function startSingleTest(i, testSuccessCallback, testErrorCallback) {
    var fallbackTimer = null;
    var beforeUnloadEventListener = function (e) {
        var confirmationMessage = Lang.getString('CancelTest');

        e.returnValue = confirmationMessage;     // Gecko, Trident, Chrome 34+
        return confirmationMessage;              // Gecko, WebKit, Chrome <34
    };
    var unloadEventListener = function () {
        navigator.sendBeacon(controlProxy + "/" + wspath + "/resultUpdate", JSON.stringify({
            uuid: clientUUID,
            test_uuid: currentTestUUID,
            aborted: true
        }));
    };

    var wsTracker = new BackgroundAwareGeoTracker();

    TestEnvironment.init(new LoopTestVisualization(function (result) {
        //window.removeEventListener("beforeunload", beforeUnloadEventListener);
        window.removeEventListener("unload", unloadEventListener,false);

        //only do callback, if fallbackTimer has not fired yet
        if (fallbackTimer !== null) {
            self.clearTimeout(fallbackTimer);
            testSuccessCallback(result);
        }
    }, function (result) {
        //window.removeEventListener("beforeunload", beforeUnloadEventListener);
        window.removeEventListener("unload", unloadEventListener,false);

        if (fallbackTimer !== null) {
            self.clearTimeout(fallbackTimer);
            testErrorCallback(result);
        }
    }), wsTracker);

    var config = new RMBTTestConfig(selectedLanguage, controlProxy, wspath);
    var ctrl = new RMBTControlServerCommunication(config, {
        register: function(registration) {
            //from the registration - get the uuid
            if (registration.response.hasOwnProperty("loop_uuid") &&
                registration.response["loop_uuid"] !== null) {
                loopUUID = registration.response["loop_uuid"];
            }
        }
    });
    config.uuid = clientUUID;
    config.doPingIntervalMilliseconds = ping_interval_milliseconds;
    config.additionalRegistrationParameters["loopmode_info"] = {
        max_delay: (waitingTime/60),
        test_counter: (i+1),
        max_tests: repetitions,
        loop_uuid: loopUUID
    };
    var websocketTest = new RMBTTest(config, ctrl);
    $("#testcount").text((i + 1));

    TestEnvironment.getTestVisualization().setRMBTTest(websocketTest);
    TestEnvironment.getTestVisualization().startTest();

    //start test after obtaining location
    wsTracker.start(function() {
        websocketTest.startTest();
    },  TestEnvironment.getTestVisualization());

    //if a user wants to leave - ask the user if test should really be cancelled
    //no - since all communication is seized by the Browser, if the user is asked
    //window.addEventListener("beforeunload", beforeUnloadEventListener);
    window.addEventListener("unload", unloadEventListener,false);

    //After 3 mins, a test has to be finished. Otherwise, treat it as an error
    fallbackTimer = self.setTimeout(function() {
        fallbackTimer = null;
        testErrorCallback();
    }, 3*60*1000);
}

/**
 * Called when all tests are done
 */
function allTestsFinished() {
    $("#infostatus").text(Lang.getString("LoopModeTestsFinished"));
    $("#testprogress").text(Lang.getString("LoopModeFinished"));
    $("#testprogress").css("width", "100%");

    $("#infocurrent").hide();
    $("#infofailed").hide();
    $("#infofinished").show();
    $("#infonotfinished").hide();

    var triggerDownloadForm = function(format) {
        $("#download-link-form input").remove();

        $("#download-link-form").append('<input type="hidden" name="loop_uuid" value="' + loopUUID + '" />');
        if (format === 'pdf') {
            $("#download-link-form").attr("action", statisticProxy + "/" + statisticpath + "/export/pdf/" + selectedLanguage);
        }
        else {
            $("#download-link-form").append("<input type='hidden' name='format' value='" + format + "' />");
            $("#download-link-form").attr("action", statisticProxy + "/" + statisticpath + "/opentests/search");
        }

        $("#download-link-form").submit();
    };

    //bind csv link - http://stackoverflow.com/a/27208677
    $("#csv-link").click(function (e) {
        triggerDownloadForm("csv");
        e.preventDefault();
        return false;
    });

    $("#xlsx-link").click(function (e) {
        triggerDownloadForm("xlsx");
        e.preventDefault();
        return false;
    });

    $("#pdf-link").click(function (e) {
        triggerDownloadForm("pdf");
        e.preventDefault();
        return false;
    });

    if (certTest && typeof certTestFinished === "function") {
        certTestFinished();
    }
}



/* From Karte.js */

//add datetime helper
Handlebars.registerHelper('formatDate', function (timestamp) {
    var d = new Date(timestamp);
    return moment(d).format(Lang.getString('map_index_dateformat'));
});

//add datetime helper
Handlebars.registerHelper('formatFullDate', function (timestamp) {
    var d = new Date(timestamp);
    return moment(d).format(Lang.getString('map_dateformat'));
});

//add formatting helper
Handlebars.registerHelper('formatNumberSignificant', function (number) {
    if (typeof number === 'number') {
        var decimals = getSignificantDigits(number);
        return number.formatNumber(decimals);
    }
});


/**
 * GeoTracker that uses an old GeoPosition in case there is none available
 * @type {BackgroundAwareGeoTracker}
 */
const BackgroundAwareGeoTracker = (function() {
    function BackgroundAwareGeoTracker() {
        GeoTracker.call(this);
    }
    BackgroundAwareGeoTracker.prototype = Object.create(GeoTracker.prototype);

    BackgroundAwareGeoTracker.prototype.getResults = function() {
        var results = GeoTracker.prototype.getResults.call(this);
        if (results.length > 0) {
            lastKnownGeoPosition = results[results.length - 1];
        }
        else {
            //if no geoposition due to background tab - use previous
            if (document.visibilityState === "hidden" && lastKnownGeoPosition !== null) {
                console.log("no geoposition obtained in background tab, use old one");
                results.push(lastKnownGeoPosition);
            }
        }

        return results;
    };

    return BackgroundAwareGeoTracker;
})();