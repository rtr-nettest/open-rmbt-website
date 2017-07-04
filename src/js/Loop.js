"use strict";

var repetitions = 5;
var waitingTime = 600;

var LoopTestVisualization = (function () {
    var _rmbtTest;

    var _infogeo = null;
    var _infoserver = null;
    var _infoip = null;
    var _infostatus = null;
    var _infoprovider = null;
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

        _infogeo = document.getElementById("infogeo");
        _infoserver = document.getElementById("infoserver");
        _infoip = document.getElementById("infoip");
        _infostatus = document.getElementById("infostatus");
        _infoprovider = document.getElementById("infoprovider");

        //reset
        _infogeo.innerHTML = '-';
        _infoserver.innerHTML = '-';
        _infoip.innerHTML = '-';
        _infoprovider.innerHTML = '-';
        $("#infoping span").text("-");
        $("#infodown span").text("-");
        $("#infoup span").text("-");
    }

    function progress_segment(status, progress) {
        var ProgressSegmentsTotal = 96;
        var ProgressSegmentsInit = 14;
        var ProgressSegmentsPing = 15;
        var ProgressSegmentsDown = 34;
        var ProgressSegmentsUp = 33;
        var progressValue = 0;
        var progressSegments = 0;
        switch (status) {
            case "INIT":
                progressSegments = 0;
                break;
            case "INIT_DOWN":
                progressSegments = Math.round(ProgressSegmentsInit * progress);
                break;
            case "PING":
                progressSegments = ProgressSegmentsInit + Math.round(ProgressSegmentsPing * progress);
                break;
            case "DOWN":
                progressSegments = ProgressSegmentsInit + ProgressSegmentsPing + Math.round(ProgressSegmentsDown * progress);
                break;
            case "INIT_UP":
                progressSegments = ProgressSegmentsInit + ProgressSegmentsPing + ProgressSegmentsDown;
                break;
            case "UP":
                progressSegments = ProgressSegmentsInit + ProgressSegmentsPing + ProgressSegmentsDown + Math.round(ProgressSegmentsUp * progress);
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
            $("#infocurrent").find("div.row").not(":has(#" + elem + ")").find(".loader").hide();
            $("#infocurrent").find("div.row #" + elem + " .loader").show();
        }
        else {
            $("#infocurrent").find("div.row  .loader").hide();
        }
        $("#infostatus").text(text);
    }

    LoopTestVisualization.prototype.setStatus = function (status) {
        set_status(status);
    };

    LoopTestVisualization.prototype.setLocation = function (latitude, longitude) {
        //from Opentest.js
        var formatCoordinate = function (decimal, label_positive, label_negative) {
            var label = (deg < 0) ? label_negative : label_positive;
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
            _infoserver.innerHTML = _serverName;
        }

        if (_remoteIp !== undefined && _remoteIp !== null && _remoteIp !== '') {
            _infoip.innerHTML = _remoteIp;
        }

        if (_providerName !== undefined && _providerName !== null && _providerName !== '') {
            _infoprovider.innerHTML = _providerName;
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
    if (number > 100) {
        return -1;
    }
    else if (number >= 10) {
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
    var tests = 0;
    var lastTestStart = moment();
    $("#testcount").text(tests);
    $("#teststotal").text(repetitions);

    var testSuccessCallback = function (result) {
        var down = result.downBitPerSec / 1e6;
        var up = result.upBitPerSec / 1e6;
        var ping = result.pingNano / 1e6;

        //add result to table
        $("#verlauf_tbody").prepend("<tr>" +
            "<td>" + lastTestStart.format("HH:mm:ss") +  "</td>" +
            "<td class=\"align-right\">" + down.formatNumber(getSignificantDigits(down)) + "</td>" +
            "<td class=\"align-right\">" + up.formatNumber(getSignificantDigits(up)) + "</td>" +
            "<td class=\"align-right\">" + ping.formatNumber(getSignificantDigits(ping)) + "</td>" +
            "</tr>");

        testFinished();
    };
    var testErrorCallback = function (result) {
        //add error to table
        $("#verlauf_tbody").prepend("<tr>" +
            "<td>" + lastTestStart.format("HH:mm:ss") +  "</td>" +
            "<td class=\"align-center\" colspan=\"3\">Fehler während des Tests</td>" +
            "</tr>");

        testFinished();
    };

    var testFinished = function (result) {
        tests++;

        $("#infostatus").text("Warte auf Zeitablauf");
        $("#testcount").text(tests);
        $("#teststotal").text(repetitions);
        $(".progress-bar").addClass("inactive");


        if (tests < repetitions) {
            //wait
            waitForNextTest(tests, waitingTime, function () {
                startSingleTest(tests, testSuccessCallback, testErrorCallback);
                lastTestStart = moment();
                $("progress-bar").removeClass("inactive");
            });
        }
        else {
            $("#infostatus").text("Alle Tests durchgeführt");
            $("#testprogress").text("Serie beendet");
            $("#testprogress").css("width", "100%");
        }
    };
    startSingleTest(tests, testSuccessCallback, testErrorCallback);
    //testFinishedCallback();

});

function waitForNextTest(i, waitingTimeS, callback) {
    var targetTime = moment().add(waitingTimeS, 'seconds');
    var timeoutFunction = function () {
        var currentTime = moment();
        var diff = moment(targetTime.diff(currentTime));
        var secondsLeft = diff.get().unix();
        var display = diff.format("mm:ss");
        if (diff < 0) {
            callback();
        }
        else {
            var percent = secondsLeft / waitingTimeS;
            $("#testprogress").text(display);
            $("#testprogress").css("width", (percent * 100) + "%");
            window.setTimeout(timeoutFunction, 1000);
        }
    };
    timeoutFunction();
}

function startSingleTest(i, testSuccessCallback, testErrorCallback) {
    TestEnvironment.init(new LoopTestVisualization(testSuccessCallback, testErrorCallback), null);
    var config = new RMBTTestConfig();
    var ctrl = new RMBTControlServerCommunication(config);
    config.uuid = "d105ee81-59c4-4850-abf7-d38f82c27345";
    var websocketTest = new RMBTTest(config, ctrl);

    TestEnvironment.getTestVisualization().setRMBTTest(websocketTest);
    TestEnvironment.getTestVisualization().startTest();

    websocketTest.startTest();
}
