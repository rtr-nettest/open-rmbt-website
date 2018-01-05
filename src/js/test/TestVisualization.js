"use strict";

/**
 * About TestVisualization:
 *  Constructor expects a object that implements {RMBTIntermediateResult}.getIntermediateResult()
 *      this will be called every xx ms (pull)
 *  The Animation loop will start as soon as "startTest()" is called
 *  The status can be set directly via setStatus or in the intermediateResult
 *  Information (provider, ip, uuid, etc.) has to be set via updateInformation
 *  As soon as the test reaches the "End"-State, the result page is called
 *
 * ------------------------------------------------------------------------------------
 *
 * Parts of this test visualization are based on the great Open Source code from CZ.NIC
 * You can find their repository here: https://gitlab.labs.nic.cz/websites/netmetr.cz
 */
var SvgTestVisualization = (function () {
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
    var _clientUUID = '';

    var _beforeUnloadEventListener;
    var _unloadEventListener;

    var _redraw_loop = null;
    var _successCallback = null;
    var _errorCallback = null;

    function SvgTestVisualization(successCallback, errorCallback) {
        if (typeof successCallback !== 'undefined') {
            _successCallback = successCallback;
            _errorCallback = errorCallback;
        }

        $("#loading-placeholder").remove();
        $("#error-placeholder").remove();
        $("#inner-test-container").show();

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

        //IE11 fix
        //(IE detection: https://stackoverflow.com/a/21825207)
        if (!!window.MSInputMethodContext && !!document.documentMode) {
            $(".gauge").css("height","500px");
            $(".gauge").css("width","500px");
        }

        //set to 0 %
        set_status(TestState.INIT);

        //add event listeners
        _beforeUnloadEventListener = function (e) {
            var confirmationMessage = Lang.getString('CancelTest');

            e.returnValue = confirmationMessage;     // Gecko, Trident, Chrome 34+
            return confirmationMessage;              // Gecko, WebKit, Chrome <34
        };
        _unloadEventListener = function () {
            navigator.sendBeacon(controlProxy + "/" + wspath + "/resultUpdate", JSON.stringify({
                uuid: _clientUUID,
                test_uuid: _testUUID,
                aborted: true
            }));
        };

        //if a user wants to leave - ask the user if test should really be cancelled
        //no - since all communication is seized by the Browser, if the user is asked
        //window.addEventListener("beforeunload", _beforeUnloadEventListener);
        window.addEventListener("unload", _unloadEventListener,false);
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
    SvgTestVisualization.prototype.setRMBTTest = function (rmbtTest) {
        _rmbtTest = rmbtTest;
    };

    SvgTestVisualization.prototype.updateInfo = function (serverName, remoteIp, providerName, testUUID) {
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
                callErrorCallback();
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
            $("#infocurrent").find("div.row #" + elem + " span").text(" ");
        }
        else {
            $("#infocurrent").find("div.row  .loader").hide();
        }

        $("#infostatus").text(text);
    }

    SvgTestVisualization.prototype.setStatus = function (status) {
        set_status(status);
    };

    SvgTestVisualization.prototype.setLocation = function (latitude, longitude) {
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
            if (status !== TestState.DOWN) {
                $("#infodown span").text(showdown);
            }
        }

        if (up > 0) {
            showup = (up / 1000000);
            showup = showup.formatNumber(getSignificantDigits(showup)) + " " + Lang.getString("Mbps");
            if (status !== TestState.UP) {
                $("#infoup span").text(showup);
            }
        }

        function setBarPercentage(barSelector, percents) {
            var bar = document.querySelector(barSelector);
            if (!bar) {
                console.error("Element not found: " + barSelector + ".");
            } else {
                bar.style.strokeDasharray =
                    bar.getTotalLength() * (percents) + ",9999";

                //IE11 fix (otherwise, the segment will disappear when scrolling - but why does this work???)
                //(IE detection: https://stackoverflow.com/a/21825207)
                if (!!window.MSInputMethodContext && !!document.documentMode) {
                    var current = parseFloat($(barSelector).css('stroke-width'));
                    $(barSelector).css('stroke-width',(current+0.001)+"px");
                }
            }
        }


        function drawLoop() {
            var barSelector = null;
            var speedMbit = null;
            var directionSymbol = null;
            var fullProgress = Math.round(progress_segment(status, progress) * 100);
            var active = false;
            //\u200a = Unicode Hairspace (since thin space is not thin enough)
            $("#percents").text(fullProgress + "\u200a%");
            switch(status) {
                case TestState.INIT:
                    barSelector = "#init";
                    progress = progress * 0.1;
                    break;
                case TestState.INIT_DOWN:
                    barSelector = "#init";
                    progress = progress * 0.9 + 0.1;
                    break;
                case TestState.PING:
                    setBarPercentage("#init", 1);
                    barSelector = "#ping";
                    break;
                case TestState.DOWN:
                    active=true;
                    setBarPercentage("#ping", 1);
                    barSelector = "#download";
                    speedMbit = down / 1e6;
                    //set symbol as unicode, since IE won't handle html entities
                    directionSymbol = "\u21a7"; //↧
                    break;
                case TestState.INIT_UP:
                    setBarPercentage("#download", 1);
                    barSelector = "#upload";
                    progress = Math.min(0.95, progress * .1);
                    active=false;
                    directionSymbol = "\u21a5"; //↥
                    break;
                case TestState.UP:
                    active=true;
                    barSelector = "#upload";
                    progress = Math.min(0.95, progress * .9 + .1);
                    speedMbit = up / 1e6;
                    directionSymbol = "\u21a5"; //↥
                    break;
                case TestState.END:
                    barSelector = "#upload";
                    progress = 1;
                    break;
            }
            if (barSelector !== null) {
                setBarPercentage(barSelector, progress);
            }

            //if speed information is available - set text
            if (speedMbit !== null && speedMbit > 0) {
                //logarithmic to 1Gbit
                var speedLog = (2+Math.log10(speedMbit))/5;
                //but cap at [0,1]
                speedLog = Math.max(speedLog,0);
                speedLog = Math.min(1, speedLog);
                setBarPercentage("#speed",speedLog);

                //set .text and .html, since .html is not ignored by Internet Explorer
                //\u2009 = unicode "hair space"
                $("#speedtext").text(directionSymbol + "\u2009" + speedMbit.formatNumber(getSignificantDigits(speedMbit)));
                $("#speedtext").html("<tspan style=\"fill:#59b200\">" + directionSymbol + "</tspan>\u200a" + speedMbit.formatNumber(getSignificantDigits(speedMbit)));
                $("#speedunit").text(Lang.getString('Mbps'));

                //enable smoothing animations on speed gauge, as soon as initial speed value is set
                //as not to visualize a gradually increase of speed
                setTimeout(function() {
                    $("#speed").attr("class","gauge speed active");
                },500);
            }
            //if only direction symbol is set - display this (init upload phase)
            else if (directionSymbol !== null) {
                //again set .text and .html for Internet Explorer
                $("#speedtext").text(directionSymbol);
                $("#speed").attr("class","gauge speed");
                setBarPercentage("#speed",0);
                $("#speedtext").html("<tspan style=\"fill:#59b200\">" + directionSymbol + "</tspan>");
            }
            //if no speed is available - clear fields, but without any animations
            else {
                $("#speed").attr("class","gauge speed");
                setBarPercentage("#speed",0);
                $("#speedtext").text("");
                $("#speedunit").text("");
            }

        };

        drawLoop();

        set_status(status);

        if (status !== "END" && status !== "ERROR" && status !== "ABORTED") {
            _redraw_loop = setTimeout(draw, 250);
            //Draw a new chart
        } else  {
            //user can navigate
            //window.removeEventListener("beforeunload", _beforeUnloadEventListener);
            window.removeEventListener("unload", _unloadEventListener,false);

            if (status === "ERROR" || status === "ABORTED") {
                callErrorCallback(result);
            } else if (status === "END") {
                // call callback that the test is finished
                if (_successCallback !== null) {
                    var t = _successCallback;
                    _successCallback = null;
                    result["testUUID"] = _testUUID;
                    t(result);
                }
                redirectToTestResult();
            }
        }
    }

    function callErrorCallback(result) {
        if (_errorCallback !== null) {
            var t = _errorCallback;
            _errorCallback = null;
            t(result);
        }
    }

    /**
     * Starts the gauge/progress bar
     * and relies on .getIntermediateResult() therefore
     *  (function previously known as draw())
     */
    SvgTestVisualization.prototype.startTest = function (clientUUID) {
        //first draw, then the timeout should kick in
        draw();

        _clientUUID = clientUUID;
    };

    return SvgTestVisualization;
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