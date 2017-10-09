"use strict";

/**
 * About TestVisualization:
 *  Constructor expects a object that implements {RMBTIntermediateResult}.getIntermediateResult()
 *      this will be called every xx ms (pull)
 *  The Animation loop will start as soon as "startTest()" is called
 *  The status can be set directly via setStatus or in the intermediateResult
 *  Information (provider, ip, uuid, etc.) has to be set via updateInformation
 *  As soon as the test reaches the "End"-State, the result page is called
 */

var TestVisualization = (function() {
    var _imageDirectory = '../img/';
    
    //static values for the duration of ndt, qos since there is no info from the applet
    var _qosTestDurationMs = 10000;
    var _startTimeQos = -1;
    
    var _rmbtTest;

    var _noCanvas = false;

    //canvas initialization
    var _canvas1; //progession canvas
    var _canvas2; //upload/download-canvas

    var _ctx1; //context of progression canvas
    var _ctx2; //context of upload/download-canvas

    //dimensions
    var _W;
    var _H;

    //Variables
    var _degrees_status = 0; //current status of the animation
    var _new_degrees_status = 0; //current goal of the animation, volatile to jstest.js
    var _old_degrees_status = 0; //the current goal the animation is trying to achieve
    var _degrees_updwn = 0;
    var _new_degrees_updwn = 0;
    var _difference = 0;

    //var color = "lightgreen"; //green looks better to me
    var _bgcolor = "#2E4653";
    var _text;
    var _animation_loop, _redraw_loop;

    var _image;

    // Create gradients
    var _grad1;
    var _grad2;

    var _infogeo = null;
    var _infoserver = null;
    var _infoip = null;
    var _infostatus = null;
    var _infoprovider = null;
    var _spinner = null;
    var _spinnertarget = null;

    
    function TestVisualization() {
        
        //Check if Canvas is supported
        var canvasTurnOff = getParam('nocanvas');
        if (!Modernizr.canvas || canvasTurnOff) {
            _noCanvas = true;
        }
        else {
            _noCanvas = false;
        }
        
        //init the canvas
        if (_noCanvas) {
            $("#dashboard").detach();
            $("#dashboard_easy").show();
        }
        else {
            $("#error_placeholder").hide();
            $("#dashboard").show();
            $("#dashboard_easy").detach();
            initCanvas();
        }
        $("#error_placeholder").hide();
        $("#loading-placeholder").hide();
        
        _infogeo = document.getElementById("infogeo");
        _infoserver = document.getElementById("infoserver");
        _infoip = document.getElementById("infoip");
        _infostatus = document.getElementById("infostatus");
        _infoprovider = document.getElementById("infoprovider");
        _spinnertarget = document.getElementById("activity-indicator");
    };
    
    /**
     * Sets the RMBT Test object
     * @param {Object} rmbtTest has to support {RMBTIntermediateResult}.getIntermediateResult
     */
    TestVisualization.prototype.setRMBTTest = function(rmbtTest) {
        _rmbtTest = rmbtTest;
    };

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

    function initCanvas() {
        // GAUGE VISUALISATION

        //canvas initialization
        _canvas1 = document.getElementById("canvas-progress");
        _canvas2 = document.getElementById("canvas-downup");

        _ctx1 = _canvas1.getContext("2d");
        _ctx2 = _canvas2.getContext("2d");

        //dimensions
        _W = _canvas1.width;
        _H = _canvas1.height;

        _image = new Image();

        // Create gradients
        _grad1 = _ctx1.createRadialGradient(_W / 2, _H / 2, 110, _W / 2, _H / 2, 118);
        _grad1.addColorStop(0.0, 'rgba(200,200,200,1)');
        _grad1.addColorStop(0.3, 'rgba(255,255,255,1)');
        _grad1.addColorStop(0.7, 'rgba(255,255,255,1)');
        _grad1.addColorStop(1.0, 'rgba(200,200,200,1)');

        _grad2 = _ctx2.createRadialGradient(_W / 2, _H / 2, 110, _W / 2, _H / 2, 118);
        _grad2.addColorStop(0.0, 'rgba(50,201,14,1)');
        _grad2.addColorStop(0.3, 'rgba(0,249,61,1)');
        _grad2.addColorStop(0.7, 'rgba(0,249,61,1)');
        _grad2.addColorStop(1.0, 'rgba(50,201,14,1)');
    }

    function resetCanvas() {
        //Clear the canvas everytime a chart is drawn
        _ctx1.clearRect(0, 0, _W, _H);
        _ctx2.clearRect(0, 0, _W, _H);

        //Background 360 degree arc
        _ctx1.beginPath();
        _ctx1.strokeStyle = _bgcolor;
        _ctx1.lineWidth = 35;
        _ctx1.arc(_W / 2, _H / 2, 114, 0 - 150 * Math.PI / 180, Math.PI * 0.66, false);
        //you can see the arc now
        _ctx1.stroke();

        _ctx2.beginPath();
        _ctx2.strokeStyle = _bgcolor;
        _ctx2.lineWidth = 35;
        _ctx2.arc(_W / 2, _H / 2, 114, 0 * Math.PI / 180, Math.PI * 1.7, false);
        //you can see the arc now
        _ctx2.stroke();

        //gauge will be a simple arc
        //Angle in radians = angle in degrees * PI / 180
        var radians1 = _degrees_status * Math.PI / 240;
        var radians2 = _degrees_updwn * Math.PI / 212;

        _ctx1.beginPath();
        _ctx1.strokeStyle = _grad1;
        _ctx1.lineWidth = 18;
        //The arc starts from the rightmost end. If we deduct 90 degrees from the angles
        //the arc will start from the topmost end
        _ctx1.arc(_W / 2, _H / 2, 114, 0 - 150 * Math.PI / 180, radians1 - 150 * Math.PI / 180, false);
        //you can see the arc now
        _ctx1.stroke();

        _ctx2.beginPath();
        _ctx2.strokeStyle = _grad2;
        _ctx2.lineWidth = 18;
        //The arc starts from the rightmost end. If we deduct 90 degrees from the angles
        //the arc will start from the topmost end
        _ctx2.arc(_W / 2, _H / 2, 114, 0 - 0 * Math.PI / 180, radians2 - 0 * Math.PI / 180, false);
        //you can see the arc now
        _ctx2.stroke();

        //Lets add the text
        _ctx1.fillStyle = '#FFF';
        _ctx1.font = "bold 18pt tahoma";
        _text = Math.floor(_degrees_status / 360 * 100) + "%";
        //Lets center the text
        //deducting half of text width from position x
        var text_width = _ctx1.measureText(_text).width;
        //adding manual value to position y since the height of the text cannot
        //be measured easily. There are hacks but we will keep it manual for now.
        _ctx1.fillText(_text, _W / 2 - text_width / 2 + 4, _H / 2 + 7);

        // Down-, Upload Images
        //var image = new Image();
        //image.src = "img/speedtest/download-icon.png";
        if (_image !== null && _image.src !== "") {
            _ctx2.drawImage(_image, _W / 2 - 15, _H / 2 - 24);
        }

        /*
         ctx2.fillStyle = '#FFF';
         ctx2.font = "bold 18pt tahoma";
         text = Math.floor(degrees/360*100) + "";
         //Lets center the text
         //deducting half of text width from position x
         text_width = ctx2.measureText(text).width;
         //adding manual value to position y since the height of the text cannot
         //be measured easily. There are hacks but we will keep it manual for now.
         ctx2.fillText(text, W/2 - text_width/2 + 0, H/2 + 7);
         */
    }

    var _serverName = null;
    var _remoteIp = null;
    var _providerName = null;
    var _testUUID = '';
    TestVisualization.prototype.updateInfo = function(serverName, remoteIp, providerName, testUUID) {
        _serverName = serverName;
        _remoteIp = remoteIp;
        _providerName = providerName;
        _testUUID = testUUID;
    };

    TestVisualization.prototype.setStatus = function(status) {
        set_status(status);
    };
    
    TestVisualization.prototype.setLocation = function(latitude, longitude) {
        //from Opentest.js
        var formatCoordinate = function(decimal, label_positive, label_negative) {
            var label = (deg < 0) ? label_negative : label_positive;
            var deg = Math.floor(Math.abs(decimal));
            var tmp = Math.abs(decimal) - deg;
            var min = tmp * 60;
            return label + " " + deg + "&deg; " + min.toFixed(3) + "'";
        };

        var ausgabe=document.getElementById("infogeo");
        latitude = formatCoordinate(latitude,Lang.getString('North'),Lang.getString('South'));
	longitude = '<br />' + formatCoordinate(longitude, Lang.getString('East'),Lang.getString('West'));
        ausgabe.innerHTML = latitude + " " + longitude;
    };
    
    /**
     * Starts the gauge/progress bar
     * and relies on .getIntermediateResult() therefore
     *  (function previously known as draw())
     */
    TestVisualization.prototype.startTest = function() {
        //reset error
        close_errorPopup();
        
        //first draw, then the timeout should kick in
        draw();
    };

    var lastProgress = -1;
    var lastStatus = -1;
    function draw() {
        var getSignificantDigits = function(number) {
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
        }

        if (down > 0) {
            showdown = (down / 1000000);
            showdown = showdown.formatNumber(getSignificantDigits(showdown)) + " " + Lang.getString("Mbps");
        }

        if (up > 0) {
            showup = (up / 1000000);
            showup = showup.formatNumber(getSignificantDigits(showup)) + " " + Lang.getString("Mbps");
        } 
        
        var drawCanvas = function() {
            console.log(status + ": " + progress);
            var prog = progress_segment(status, progress);
            //console.log("Prog: "+prog);
            //if (status != 'END' && status != 'ERROR' && status != 'ABORTED') {

            //Cancel any movement animation if a new chart is requested
            if (typeof _animation_loop !== undefined)
                clearInterval(_animation_loop);

            //random degree from 0 to 360
            //new_degrees = Math.round(Math.random()*360);
            _new_degrees_status = Math.round(prog * 360) + 1;


            document.getElementById('showPing').innerHTML = showping;

            if (status !== TestState.DOWN) {
                document.getElementById('showDown').innerHTML = showdown;
            }
            if (status !== TestState.UP) {
                document.getElementById('showUp').innerHTML = showup;
            }

            if (status === "DOWN") {
                if (down_log > 1)
                    down_log = 1;
                _degrees_updwn = Math.round(down_log * 360);
                var imgPath = _imageDirectory + "speedtest/download-icon.png";
                if (_image.src !== imgPath) {
                    _image.src = imgPath;
                }
            } else if (status === "UP") {
                if (up_log > 1)
                    up_log = 1;
                _degrees_updwn = Math.round(up_log * 360);
                var imgPath = _imageDirectory + "speedtest/upload-icon.png";
                if (_image.src !== imgPath) {
                    _image.src = imgPath;
                }
            }
            //console.log("up_log: "+up_log);
            //console.log("degrees_updwn: "+degrees_updwn);
            _difference = Math.max(1,_new_degrees_status - _degrees_status);
            //This will animate the gauge to new positions
            //The animation will take 1 second
            //time for each frame is 1sec / difference in degrees
            _animation_loop = setInterval(animate_to, 500 / _difference);
            //animation_loop = setInterval(animate_to, 10);

            
        };
        var drawNoCanvas = function() {
            var show_prog = progress * 100;
            if (show_prog < 100)
                show_prog = show_prog.toPrecision(2);
            else
                show_prog = 100;
            $('#progbar').css('width', Math.floor(210 + (show_prog * 2.1)) + 'px');
            var show_prog_tmp = (show_prog / 2);
            if (status === TestState.UP) {
                show_prog_tmp += 50;
            }
            if (show_prog_tmp < 100)
                show_prog_tmp = show_prog_tmp.toPrecision(2);
            else
                show_prog_tmp = 100;
            $('#progbar').html(show_prog_tmp + "%");
            $('#activity-indicator').html("(" + show_prog + "%)");
            var ulbar_width = Math.floor(up_log * 420);
            $('#ulbar').css('width', ulbar_width + 'px');
            $('#ulbar').html(showup);
            $("#showUp").html(showup);
            
            var dlbar_width = Math.floor(down_log * 420);
            $('#dlbar').css('width', dlbar_width + 'px');
            $('#dlbar').html(showdown);
            $('#showDown').html(showdown);
        };
        set_status(status);
        
        if (_noCanvas) {
            drawNoCanvas();
        }
        else {
            drawCanvas();
        }
        
        if (status !== "END" && status !== "ERROR" && status !== "ABORTED") {
            _redraw_loop = setTimeout(draw, 250);
            //Draw a new chart
        } else if (status === "ERROR" || status === "ABORTED") {

        } else if (status === "END") {

            redirectToTestResult();
        }
        //  }
    }
    
    
    /**
     * function to show current status
     * @param {string} curStatus status that will be displayed
     * @returns {undefined}
     */
    function set_status(curStatus) {
        if (_spinner !== null) {
            _spinner.stop();
            _spinner = null;
        }

        switch (curStatus) {
            case TestState.LOCATE:
                _infostatus.innerHTML = Lang.getString('Locating');
                var opts = {
                    lines: 7,
                    length: 0,
                    width: 3,
                    radius: 2,
                    trail: 50,
                    speed: 1.2,
                    color: "#002D45"
                };
                _spinner = new Spinner(opts).spin(_spinnertarget);
                break;
            case TestState.INIT:
                _infostatus.innerHTML = Lang.getString('Initializing');
                break;
            case TestState.WAIT:
                _infostatus.innerHTML = Lang.getString('WaitForSlot');
                break;
            case TestState.INIT_UP:
                _infostatus.innerHTML = Lang.getString('Init_Upload');
                break;
            case TestState.PING:
                _infostatus.innerHTML = Lang.getString("Ping");
                break;
            case TestState.DOWN:
                _infostatus.innerHTML = Lang.getString("Download");
                break;
            case TestState.UP:
                _infostatus.innerHTML = Lang.getString("Upload");
                break;
            case TestState.QOS_TEST_RUNNING:
                //guess duration here since there is no information from the applet
                if (_startTimeQos < 0) {
                    _startTimeQos = (new Date()).getTime();
                }
                var now = (new Date()).getTime();
                var progress = Math.min(1,(now - _startTimeQos)/_qosTestDurationMs);
                
                _infostatus.innerHTML = Lang.getString('QosTest') + " (" + Math.round(progress*100) + "&nbsp;%)";
                break;
            case TestState.QOS_END:
            case TestState.SPEEDTEST_END:
                //this could be the NDT test running
                if(_rmbtTest.getNdtStatus() !== null && _rmbtTest.getNdtStatus().toString() === "RUNNING") {
                    var progress = _rmbtTest.getNdtProgress();
                    _infostatus.innerHTML = Lang.getString('NDT') + " (" + Math.round(progress*100) + "&nbsp;%)";
                }
                
                break;
            case TestState.END:
                _infostatus.innerHTML = Lang.getString('Finished');
                break;
            case TestState.ERROR:
                _infostatus.innerHTML = Lang.getString('Error');
                $("#popuperror").empty();
                $("#popuperror").append('<p>' + Lang.getString('ErrorOccuredDuringTest') + '</p>');
                if (lastStatus !== curStatus) {
                    show_errorPopup();
                    lastStatus = curStatus;
                }
                break;
            case TestState.ABORTED:
                _infostatus.innerHTML = Lang.getString('Aborted');
                $("#popuperror").empty();
                $("#popuperror").append('<p>' + Lang.getString('PrematureEnd') + '</p>');
                show_errorPopup();
                break;
            case "JAVAERROR":
                _infostatus.innerHTML = Lang.getString('Aborted');
                $("#popuperror").empty();
                $("#popuperror").append('<p>' + Lang.getString('AppletCouldNotBeLoaded') + '</p>');
                show_errorPopup();
                break;
            case TestState.LOCABORTED:
                _infostatus.innerHTML = Lang.getString('Init_applet');
                if (!noJava)
                    start_test();
                else
                    start_jstest();
                break;
            default:
                console.log("Unknown test state: " + curStatus);
        }
    }

    function redirectToTestResult() {
        var forwardUrl = "/" + selectedLanguage + "/Verlauf";
        if (preferredTest === TestTypes.Java || getParam("Java")) {
            forwardUrl += "?Java=True"
        }
        forwardUrl += "#";
        forwardUrl += _testUUID;
        setTimeout(function() {
            window.location.href = forwardUrl;
        }, 2000);
    }
    
    
    /**
     * function to make the chart move to new degrees
     * (one degree at a time)
     * is called by interval declared in animation_loop
     * by speedtest-components (Downloadtest, Uploadtest)
     */
    function animate_to() {
        //clear animation loop if degrees reaches to new_degrees
        if (_degrees_status >= _new_degrees_status)
            clearInterval(_animation_loop);


        if (_degrees_status < _new_degrees_status) {
            _degrees_status++;
        }

        //if the new degrees status is different from the old one
        //move the degrees_status forward to the old one so that
        //animation does not hang
        if (_old_degrees_status !== _new_degrees_status) {
            _degrees_status = _old_degrees_status;
            _old_degrees_status = _new_degrees_status;
        }

        resetCanvas();
    }

    return TestVisualization;
})();


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

    var _redraw_loop = null;
    var _successCallback = null;
    var _errorCallback = null;

    function SvgTestVisualization(successCallback, errorCallback) {
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
            }
        }


        function drawLoop() {
            var barSelector = null;
            var speedMbit = null;
            var directionSymbol = null;
            var fullProgress = Math.round(progress_segment(status, progress) * 100);
            var active = false;
            $("#percents").text(fullProgress + "\u2009%");
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
                    directionSymbol = "\u21a7";
                    break;
                case TestState.INIT_UP:
                    setBarPercentage("#download", 1);
                    barSelector = "#upload";
                    progress = Math.min(0.95, progress * .1);
                    active=false;
                    break;
                case TestState.UP:
                    active=true;
                    barSelector = "#upload";
                    progress = Math.min(0.95, progress * .9 + .1);
                    speedMbit = up / 1e6;
                    directionSymbol = "\u21a5";
                    break;
                case TestState.END:
                    barSelector = "#upload";
                    progress = 1;
                    break;
            }
            if (barSelector !== null) {
                setBarPercentage(barSelector, progress);
            }
            if (speedMbit !== null && speedMbit > 0) {
                //logarithmic to 1Gbit, but [0,1]
                var speedLog = (2+Math.log10(speedMbit))/5;
                speedLog = Math.max(speedLog,0);
                speedLog = Math.min(1, speedLog);
                setBarPercentage("#speed",speedLog);
                $("#speedtext").text(directionSymbol + "\u2009" + speedMbit.formatNumber(getSignificantDigits(speedMbit)));
                $("#speedunit").text(Lang.getString('Mbps'));
                setTimeout(function() {
                    $("#speed").attr("class","gauge speed active");
                },500);
            }else {
                $("#speed").attr("class","gauge speed");
                setBarPercentage("#speed",0);
                //$("#speedtext").text("");
                //$("#speedunit").text("");
            }



            //var fullProgress = Math.round(progress_segment(status, progress) * 100);
            //$("#testprogress").css("width", fullProgress + "%");
            //$("#testprogress").text(fullProgress + " %");
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
            redirectToTestResult();
        }
    }

    /**
     * Starts the gauge/progress bar
     * and relies on .getIntermediateResult() therefore
     *  (function previously known as draw())
     */
    SvgTestVisualization.prototype.startTest = function () {
        //first draw, then the timeout should kick in
        draw();
    };

    function redirectToTestResult() {
        var forwardUrl = "/" + selectedLanguage + "/Verlauf";
        if (preferredTest === TestTypes.Java || getParam("Java")) {
            forwardUrl += "?Java=True"
        }
        forwardUrl += "#";
        forwardUrl += _testUUID;
        setTimeout(function() {
            //window.location.href = forwardUrl;
        }, 2000);
    }

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

function setBarPercentage(barSelector, percents) {
    var bar = $(barSelector);
    if (!bar) {
        console.error("Element not found: " + barSelector + ".");
    } else {
        bar[0].style.strokeDasharray =
            bar[0].getTotalLength() * (percents) + ",9999";
    }
}