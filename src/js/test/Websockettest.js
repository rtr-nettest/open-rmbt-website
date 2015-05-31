function debug(text) {
   return; //no debug
   $("#debug").prepend(text + "\n");
   console.log(text);
}

function debug_without_newline(text) {
    $("#debug").append(text);
}

//var server_override = "ws://localhost:12345";
//var server_override = "wss://217.develop.netztest.at:443";


//structure from: http://www.typescriptlang.org/Playground 
var RMBTTest = (function() {
    "use strict";
    
    var _chunkSize;
    
    /* @var rmbtTestConfig RMBTTestConfig */
    var _rmbtTestConfig;
    var _rmbtTestResult = null;
    var _errorCallback = null;
    
    var _state = TestState.INIT;
    var _stateChangeMs;
    var _statesInfo = {
        durationInitMs: 2500,
        durationPingMs: 500,
        durationUpMs: -1,
        durationDownMs: -1
    };
    
    var _intermediateResult = new RMBTIntermediateResult();
    
    var _threads = new Array();
    var _blobs = new Array();
    var _endblob;
    var _cyclicBarrier;
    var _numThreads;
    

    var _fallbackDownload = false;
    var _fallbackUpload = false;
    var _uploadChunksPerSecsPretest;

    //this is a observable/subject
    //http://addyosmani.com/resources/essentialjsdesignpatterns/book/#observerpatternjavascript
    //RMBTTest.prototype = new Subject();

    RMBTTest.prototype.version = test_version_name;

    /**
     * 
     * @param {RMBTTestConfig} rmbtTestConfig
     * @returns {}
     */
    function RMBTTest(rmbtTestConfig) {
        //init socket             
        _rmbtTestConfig = rmbtTestConfig;// = new RMBTTestConfig();

    };

    /**
     * Sets the state of the test, notifies the observers if
     * the state changed
     * @param {TestState} state
     */
    function setState(state) {
        if (_state === undefined ||
                _state !== state) {
            _state = state;
            _stateChangeMs = performance.now();
        }
    }

    /**
     * Set the fallback function
     * in case the websocket-test
     * fails for any reason
     * @param {Function} fct
     */
    RMBTTest.prototype.onError = function(fct)  {
        _errorCallback = fct;
    }

    /**
     * Calls the error function (but only once!)
     * @param {RMBTError} error
     */
    var callErrorCallback = function(error) {
        if (!error === RMBTError.NOT_SUPPORTED) {
            setState(TestState.ERROR);
        }
        if (_errorCallback !== null) {
            var t = _errorCallback;
            _errorCallback = null;
            t();
        }
    }

    RMBTTest.prototype.startTest = function() {        
        //see if websockets are supported
        if (window.WebSocket === undefined)  {
            callErrorCallback(RMBTError.NOT_SUPPORTED);
            return;
        }
        
        setState(TestState.INIT);
        _rmbtTestResult = new RMBTTestResult();
        //connect to controlserver
        getDataCollectorInfo(_rmbtTestConfig);

        obtainControlServerRegistration(_rmbtTestConfig, function(response) {
            _numThreads = parseInt(response.test_numthreads);
            _cyclicBarrier = new CyclicBarrier(_numThreads);
            _statesInfo.durationDownMs = response.test_duration * 1e3;
            _statesInfo.durationUpMs = response.test_duration * 1e3;
            
            //@TODO: Nicer
            //if there is testVisualization, make use of it!
            if (TestEnvironment.getTestVisualization() !== null) {
                    TestEnvironment.getTestVisualization().updateInfo(response.test_server_name,
                                response.client_remote_ip,
                                response.provider,
                                response.test_uuid);
            }

            var continuation = function() {
                debug("got geolocation, obtaining token and websocket address");

                //wait if we have to
                window.setTimeout(function() {
                    _rmbtTestResult.beginTime = (Date().now);
                    //n threads
                    for (var i = 0; i < _numThreads; i++) {
                        var thread = new RMBTTestThread(_cyclicBarrier);
                        thread.id = i;
                        _rmbtTestResult.addThread(thread.result);

                        //only one thread will call after upload is finished
                        conductTest(response, thread, function() {

                            debug("All tests finished");
                            wsGeoTracker.stop();
                            _rmbtTestResult.geoLocations = wsGeoTracker.getResults();
                            _rmbtTestResult.calculateAll();
                            submitResults(response, function() {
                                setState(TestState.END);
                            });
                        });

                        //for now
                        //if (i===0) 
                        //    break;

                        _threads.push(thread);
                    }
                }, response.test_wait);
            };

            var wsGeoTracker;
            //get the user's geolocation
            if (TestEnvironment.getGeoTracker() !== null) {
                wsGeoTracker = TestEnvironment.getGeoTracker();
                continuation();
            }
            else {
                wsGeoTracker = new GeoTracker();
                debug("getting geolocation");
                wsGeoTracker.start(function() {
                    continuation();
                });
            }
            
        });
    };

    /**
     * 
     * @returns {RMBTIntermediateResult}
     */
    RMBTTest.prototype.getIntermediateResult = function() {
        _intermediateResult.status = _state;;
        var diffTime = performance.now() - _stateChangeMs;
        
        switch (_intermediateResult.status)
        {
            case TestState.WAIT:
                _intermediateResult.progress = 0;
                //_intermediateResult.remainingWait = params.getStartTime() - System.currentTimeMillis();
                break;

            case TestState.INIT:
            case TestState.INIT_DOWN:
            case TestState.INIT_UP:
                _intermediateResult.progress = diffTime / _statesInfo.durationInitMs;
                break;

            case TestState.PING:
                _intermediateResult.progress = diffTime / _statesInfo.durationPingMs;
                break;

            case TestState.DOWN:
                _intermediateResult.progress = diffTime / _statesInfo.durationDownMs;
                //downBitPerSec.set(Math.round(getAvgSpeed()));
                break;
                
            case TestState.UP:
                _intermediateResult.progress = diffTime / _statesInfo.durationUpMs;
                //upBitPerSec.set(Math.round(getAvgSpeed()));
                break;

            case TestState.END:
                _intermediateResult.progress = 1;
                break;

            case TestState.ERROR:
            case TestState.ABORTED:
                _intermediateResult.progress = 0;
                break;
        }
        if (isNaN(_intermediateResult.progress)) {
                _intermediateResult.progress = 0;
        }
        
        _intermediateResult.progress = Math.min(1,_intermediateResult.progress);
        
        if (_rmbtTestResult !== null) {
            _intermediateResult.pingNano = _rmbtTestResult.ping_median;
            
            
            if (_intermediateResult.status === TestState.DOWN) {
                //download
                var total = 0;
                var targetTime = Infinity;
                for (var i = 0; i < _threads.length > 0; i++) {
                    var down = _rmbtTestResult.threads[i].down;
                    if (down.length > 0) {
                        total += down[down.length - 1].bytes;
                        if (down[down.length - 1].duration < targetTime) {
                            targetTime = down[down.length - 1].duration;
                        }
                    }
                }
                _intermediateResult.downBitPerSec = Math.max(0, (total * 8) / (targetTime / 1e9));
                _intermediateResult.downBitPerSecLog = (log10(_intermediateResult.downBitPerSec / 1e6) + 2) / 4;
            }
            
            if (_intermediateResult.status === TestState.UP) {
                //upload
                total = 0;
                targetTime = Infinity;
                for (var i = 0; i < _threads.length; i++) {
                    var up = _rmbtTestResult.threads[i].up;
                    if (up.length > 0) {
                        total += up[up.length - 1].bytes;
                        if (up[up.length - 1].duration < targetTime) {
                            targetTime = up[up.length - 1].duration;
                        }
                    }
                }
                _intermediateResult.upBitPerSec = Math.max(0, (total * 8) / (targetTime / 1e9));
                _intermediateResult.upBitPerSecLog = (log10(_intermediateResult.upBitPerSec / 1e6) + 2) / 4;
            }
        }
        return _intermediateResult;
    };


    /**
     * Conduct the test
     * @param {RMBTControlServerRegistrationResponse} registrationResponse
     * @param {RMBTTestThread} thread info about the thread/local thread data structures
     * @param {Callback} callback as soon as all tests are finished
     */
    function conductTest(registrationResponse, thread, callback) {
        var server = ((registrationResponse.test_server_encryption) ? "wss://" : "ws://") +
                registrationResponse.test_server_address + ":" + registrationResponse.test_server_port;
        debug(server);
        
        var errorFunctions = function() {
            return {
                IGNORE : function() {
                    //ignore error :)
                },
                CALLGLOBALHANDLER : function() {
                    callErrorCallback(RMBTError.CONNECT_FAILED);
                },
                TRYRECONNECT : function() {
                    //@TODO: try to reconnect
                    //@TODO: somehow restart the current phase
                    callErrorCallback(RMBTError.CONNECT_FAILED);                    
                }
            }
        }();

        //register state enter events
        thread.onStateEnter(TestState.INIT_DOWN, function() {
            setState(TestState.INIT_DOWN);
            debug(thread.id + ": start short download");
            
            //only one thread downloads
            if (thread.id === 0) {
                shortDownloadtest(thread, _rmbtTestConfig.pretestDurationMs);
            }
            else {
                thread.triggerNextState();
            }
        });
        
        thread.onStateEnter(TestState.PING, function() {
            setState(TestState.PING);
            debug(thread.id + ": starting ping");
            //only one thread pings
            if (thread.id === 0) {
                pingTest(thread);
            }
            else {
                thread.triggerNextState();
            }
        });
        
        thread.onStateEnter(TestState.DOWN, function() {
            setState(TestState.DOWN);
            if (!_fallbackDownload || thread.id === 0) {
                downloadTest(thread, registrationResponse.test_duration);
            }
            else {
                thread.triggerNextState();
            }
        });
        
        thread.onStateEnter(TestState.INIT_UP, function() {
            setState(TestState.INIT_UP);
            if (thread.id === 0) {
                shortUploadtest(thread, _rmbtTestConfig.pretestDurationMs);
            }
            else {
                thread.triggerNextState();
            }
        });
        
        thread.onStateEnter(TestState.UP, function() {
            setState(TestState.UP);
                        
            if ((!_fallbackUpload && !_rmbtTestConfig.limitUploadThreads) || thread.id === 0) { //Override for now and use only one thread
                uploadTest(thread, registrationResponse.test_duration);
            }
            else {
                thread.socket.onerror = errorFunctions.IGNORE;
                thread.triggerNextState();
            }
        });
        
        thread.onStateEnter(TestState.END, function() {
            if (thread.id === 0) {
                callback();
            }
        });
        
        
        
        //Lifecycle states finished -> INIT, ESTABLISHED, SHORTDOWNLOAD
        //thread.state = TestState.INIT;
        thread.setState(TestState.INIT);
        setState(TestState.INIT);
        connectToServer(thread,server,registrationResponse.test_token, errorFunctions.CALLGLOBALHANDLER);
        
    }
    
    /**
     * Connect the given thread to the given websocket server
     * @param {RMBTTestThread} thread
     * @param {String} server server:port
     * @param {String} token
     * @param {Function} errorHandler initial error handler
     */
    function connectToServer(thread, server, token, errorHandler) {
        try {
            thread.socket = new WebSocket(server);
        }
        catch(e) {
            callErrorCallback(RMBTError.SOCKET_INIT_FAILED);
            return;
        }
        
        thread.socket.binaryType = "blob";
        thread.socket.onerror = errorHandler;
        
        thread.socket.onmessage = function(event) {
            //debug("thread " + thread.id + " triggered, state " + thread.state + " event: " + event);
            
            //console.log(thread.id + ": Received: " + event.data);
            if (event.data.indexOf("CHUNKSIZE") === 0) {
                _chunkSize = parseInt(event.data.substring(10));
                debug(thread.id + "Chunksize: " + _chunkSize);
            }
            else if (event.data === "ACCEPT TOKEN QUIT\n")
            {
                thread.socket.send("TOKEN " + token + "\n");
            }
            else if (event.data === "OK\n" && thread.state === TestState.INIT) {
                debug(thread.id + ": Token accepted");
            }
            else if (event.data === "ERR\n") {
                errorHandler();
                debug("got error msg");
            }
            else if (event.data === "ACCEPT GETCHUNKS GETTIME PUT PUTNORESULT PING QUIT\n") {
                thread.triggerNextState();
            }
            
            
        };
    }

    /**
     * conduct the short pretest to recognize if the connection
     * is to slow for multiple threads
     * @param {RMBTTestThread} thread
     * @param {Number} durationMs
     */
    function shortDownloadtest(thread, durationMs) {
        var prevListener = thread.socket.onmessage;
        var startTime = performance.now(); //ms since page load
        var n = 1;

        var loop = function() {
            downloadChunks(thread, n, function(msg) {
                debug(thread.id + ": " + msg);

                var now = performance.now();
                if ((now - startTime) > durationMs) {
                    //fallback for slow connections
                    if (n <= _rmbtTestConfig.fallbackChunksDownload) {
                        _fallbackDownload = true;
                    }
                    
                    //"break"
                    thread.socket.onmessage = prevListener;
                }
                else {
                    n = n * 2;
                    loop();
                }
            });
        };
        loop();
        
    }

    /**
     * Download n Chunks from the test server
     * @param {Number} total how many chunks to download
     * @param {RMBTThread} thread containing an open socket
     * @param {Callback} onsuccess expects one argument (String)
     */
    function downloadChunks(thread, total, onsuccess) {
        //console.log(String.format(Locale.US, "thread %d: getting %d chunk(s)", threadId, chunks));
        var socket = thread.socket;
        var remainingChunks = total;
        var expectBytes = _chunkSize * total;
        var totalRead = 0;
        
        var downloadChunkListener = function(event) {

            //var lastByte;
            //console.log("received chunk with " + line.length + " bytes");
            totalRead = totalRead + event.data.size;
            //while (read > 0 && lastByte != (byte) 0xff);

            //socket.onmessage = prevListener;
            if (event.data.size === 1) {
                //for some reason, the last byte is send alone
                remainingChunks--;
            }

            //zero junks remain - get time

             
           if (remainingChunks === 0) {
               //get info
               socket.onmessage = function(line) {
                    var infomsg = line.data;
                    onsuccess(infomsg);
               };
               
               socket.send("OK\n");
           }
        };
        socket.onmessage = downloadChunkListener;
        debug(thread.id + ": downloading " + total + " chunks, " + (expectBytes/1000) + " KB");
        var send = "GETCHUNKS " + total + "\n";
        socket.send(send);
    }

    function pingTest(thread) {
        var shortestPing = Infinity;
        var prevListener = thread.socket.onmessage;
        var pingsRemaining = _rmbtTestConfig.numPings;
        

        var onsuccess = function(pingResult) {
            pingsRemaining--;

            thread.result.pings.push(pingResult);

            if (pingResult.client < shortestPing) {
                shortestPing = pingResult.client;
            }
            debug(thread.id + ": PING " + pingResult.client + " ns client; " + pingResult.server + " ns server");

            if (pingsRemaining > 0) {
                //wait for new 'ACCEPT'-message
                thread.socket.onmessage = function(event) {
                    if (event.data === "ACCEPT GETCHUNKS GETTIME PUT PUTNORESULT PING QUIT\n") {
                        ping(thread, onsuccess);
                    }
                    else {
                        debug("unexpected error during ping test")
                    }
                };
            }
            else {                
                //"break
                
                //median ping
                var tArray = [];
                for (var i=0;i < thread.result.pings.length; i++) {
                    tArray.push(thread.result.pings[i].client);
                }
                _rmbtTestResult.ping_median = Math.median(tArray);
                
                debug(thread.id + ": shortest: " + Math.round(shortestPing / 1000) / 1000 + " ms");
                _rmbtTestResult.ping_shortest = shortestPing;
                thread.socket.onmessage = prevListener;
            }
        };
        ping(thread, onsuccess);
        
    }
    
    /**
     * 
     * @param {RMBTTestThread} thread
     * @param {Callback} onsuccess upon success
     */
    function ping(thread, onsuccess) {
        var begin;
        var clientDuration;
        var pingListener = function(event) {
            if (event.data === "PONG\n") {
                var end = nowNs();
                clientDuration = end - begin;
                thread.socket.send("OK\n");
            }
            else if (event.data.indexOf("TIME") === 0) {
                var result = new RMBTPingResult();
                result.client = clientDuration;
                result.server = parseInt(event.data.substring(5));
                result.timeNs = begin;
                onsuccess(result);
            }
        };
        thread.socket.onmessage = pingListener;
        
        begin = nowNs();
        thread.socket.send("PING\n");
    }

    /**
     * 
     * @param {RMBTTestThread} thread
     * @param {Number} duration in seconds
     */
    function downloadTest(thread, duration) {
        var previousListener = thread.socket.onmessage;
        var totalRead = 0;
        var readChunks = 0;
        
        //read chunk only at some point in the future to save ressources
        var readTimeout;
        var interval;
        var lastRead;
        var lastChunk = null;
        
        interval = window.setInterval(function() {
            if (lastChunk === null) {
                return;
            }
            
            var now = nowNs();
            debug(thread.id + ": " + lastRead + "|" + _rmbtTestConfig.measurementPointsTimespan + "|" + now + "|" + readChunks);
            var lastByte = lastChunk.slice(_chunkSize - 1, _chunkSize);
            var buf = lastChunk;
            lastChunk = null;
            
            var reader = new FileReader();
            
            reader.onload = function() {                
                //add result
                var now = nowNs();
                var duration = now-start;
                thread.result.down.push({duration: duration,
                    bytes: totalRead});
                
                //var now = nowNs();
                lastRead = now;
                
                var lastByte = reader.result.charCodeAt(0);
                if(lastByte >= 0xFF) {
                    debug(thread.id + ": received end chunk");
                    window.clearInterval(interval);
                    
                    //last chunk received - get time
                    thread.socket.onmessage = function(event) {
                        //TIME
                        debug(event.data);
                        thread.socket.onmessage = previousListener;
                    };
                    thread.socket.send("OK\n");
                    _endblob = buf;
                    
                    //saveAs(_endblob,"endblob");
                }
                else {
                    if (_blobs.length < 100) {
                        _blobs.push(buf);
                    }
                }
            };
            
            reader.readAsText(lastByte);
        }, _rmbtTestConfig.measurementPointsTimespan);
        
        var downloadListener = function(event) {
            readChunks++;
            totalRead += event.data.size; //blob
            //var currentRead = totalRead; //concurrency?
            //var now = nowNs();
            lastChunk = event.data;

            //if we don't have enough chunks cached or the timeout is reached - always check (and cache)
            /*if ((readChunks < _rmbtTestConfig.savedChunks))/* || ((lastRead + _rmbtTestConfig.measurementPointsTimespan) < now)) /{
                debug(": " + lastRead + "|" + _rmbtTestConfig.measurementPointsTimespan + "|" + now  + "|" + readChunks);
                lastRead = now;
                
                _blobs.push(event.data);
            }*/
            
            
            
                      
        };
        thread.socket.onmessage = downloadListener;
        
        var start = nowNs();
        thread.socket.send("GETTIME " + duration + "\n");
    }

     /**
     * conduct the short pretest to recognize if the connection
     * is to slow for multiple threads
     * @param {RMBTTestThread} thread
     * @param {Number} durationMs
     */
    function shortUploadtest(thread, durationMs) {
        var prevListener = thread.socket.onmessage;
        var startTime = performance.now(); //ms since page load
        var n = 1;
        
        var performanceTest = window.setTimeout(function() {
            var endTime = performance.now();
            var duration = endTime - startTime;
            debug("diff:" + (duration - durationMs) + " (" + (duration-durationMs)/durationMs + " %)");
        },durationMs);

        var loop = function() {
            uploadChunks(thread, n, function(msg) {
                debug(thread.id + ": " + msg);

                var now = performance.now();
                if ((now - startTime) > durationMs) {
                    //"break"
                    //fallback for slow connections
                    if (n <= _rmbtTestConfig.fallbackChunksUpload) {
                        _fallbackUpload = true;
                    }
                    
                    //thread.socket.onmessage = prevListener;
                    thread.socket.onmessage = prevListener;
                    
                    //save circa result
                    _uploadChunksPerSecsPretest = (n*2)/(durationMs/1000);
                    debug(thread.id + ": circa " + (_uploadChunksPerSecsPretest*_chunkSize)/1000 + " KB/sec");
                }
                else {
                    n = n * 2;
                    loop();
                }
            });
        };
        loop();
        
    }
    
    /**
     * Upload n Chunks to the test server
     * @param {Number} total how many chunks to download
     * @param {RMBTThread} thread containing an open socket
     * @param {Callback} onsuccess expects one argument (String)
     */
    function uploadChunks(thread, total, onsuccess) {
        //console.log(String.format(Locale.US, "thread %d: getting %d chunk(s)", threadId, chunks));
        var socket = thread.socket;
        
        socket.onmessage = function(event) {
            if (event.data.indexOf("OK") === 0) {
                //before we start the test
                return;
            }
            else if (event.data.indexOf("ACCEPT") === 0) {
                //status line after the test - ignore here for now
                return;
            }
            else {
                onsuccess(event.data); //TIME xxxx
            }
        };
        
        debug(thread.id + ": uploading " + total + " chunks, " + ((_chunkSize*total)/1000) + " KB");
        socket.send("PUTNORESULT\n"); //Put no result
        for (var i=0;i<total;i++) {
            var blob;
            if (i === (total-1)) {
                blob = _endblob;
            }
            else {
                blob = _blobs[0];
            }
            socket.send(blob);
        }
    }

    /**
     * 
     * @param {RMBTTestThread} thread
     * @param {Number} duration in seconds
     */
    function uploadTest(thread, duration) {
        var previousListener = thread.socket.onmessage;
        
        //inform server
        var beginS;
        var i = 0;
        
        
        
        var queueSize = Math.ceil(_uploadChunksPerSecsPretest / _numThreads / duration);
        var fixedUnderrun = 5;
        var queueUpperBound = Math.ceil(_uploadChunksPerSecsPretest / _numThreads / duration) *2;
        var timeout;
        
        var sentPackages = 0;
        var maxPackages = Math.ceil((_uploadChunksPerSecsPretest * duration) / _numThreads) * 3;
        
        var ended = false;
        
        var lastDurationInfo = -1;
        var timeoutExtensionsMs = 0;
        
        var timeoutFunction = function () {
            if (!ended) {
                //check how far we are in 
                debug(thread.id + ": is 7.2 sec in, got data for " + lastDurationInfo);
                //if measurements are for < 7sec, give it time
                if ((lastDurationInfo < duration * 1000 * 1000 * 1000) && (timeoutExtensionsMs < 3000)) {
                    window.setTimeout(timeoutFunction, 250);
                    timeoutExtensionsMs += 250;
                }
                else {
                    //kill it with force!
                    debug(thread.id + ": didn't finish, timeout extended by " + timeoutExtensionsMs + " ms, last info for " + lastDurationInfo);
                    ended = true;
                    thread.socket.onerror = function () {
                    }; //do nothing, we kill it on purpose
                    thread.socket.send(_endblob);
                    thread.socket.send("QUIT\n");
                    thread.socket.close();
                    thread.socket.onmessage = previousListener;
                    debug(thread.id + ": socket now closed: " + thread.socket.readyState);
                    thread.triggerNextState();
                }
            }
        };
        window.setTimeout(timeoutFunction, 7000);
        debug(thread.id + ": set timeout");
        
        /*var uploadTimer = function() {
            //debug(thread.id + ": Queue: " + queueSize + "; Buffered: " + thread.socket.bufferedAmount);
            //@TODO acknowledge pre-test
            if (thread.socket.bufferedAmount >= Math.max(fixedUnderrun*_chunkSize,queueSize*_chunkSize)) {
                if (thread.socket.bufferedAmount > queueUpperBound) {
                    queueSize = Math.max(1,queueSize-3);
                }
                return;
            }
            queueSize = Math.min(_uploadChunksPerSecsPretest,queueSize+3);
            
            var nowMs = Date.now();
            var durationMs = nowMs - beginS;
            //debug(durationS + "; " + duration);
            if (durationMs > (duration*1000)) {
                //send last blob
                debug(thread.id + ": send end blob");
                thread.socket.send(_endblob);
                window.clearInterval(timeout);
                
                //give it one more sec, then close it forcefully
                window.setTimeout(function() {
                    if (!ended) {
                        ended = true;
                        thread.socket.close();
                        thread.socket.onmessage = previousListener;
                        triggerNextState(thread);
                    }
                }, 1000);
            }
            else {
                var blob = _blobs[0];
                //var lastByte = blob.slice(_chunkSize-1,_chunkSize);

                for (var j=0;j<queueSize;j++) {
                    sentPackages++;
                    thread.socket.send(blob);
                }
                i++;
            }
            
            
        };*/
        
        
        var pattern = /TIME (\d+) BYTES (\d+)/;
        var patternEnd = /TIME (\d+)/;
        var uploadListener = function(event) {
            //start conducting the test
            if (event.data === "OK\n") {
                for (var j = 0; j < maxPackages; j++) {
                    sentPackages++;
                    thread.socket.send(_blobs[0]);
                }
            }
            
            //intermediate result - save it!
            //TIME 6978414829 BYTES 5738496
            //debug(thread.id + ": rec: " + event.data);
            var matches = pattern.exec(event.data);
            if (matches !== null) {
                var data = {
                    duration: parseInt(matches[1]),
                    bytes: parseInt(matches[2])
                };
                lastDurationInfo = data.duration;
                //debug(thread.id + ": " + JSON.stringify(data));
                thread.result.up.push(data);
            }
            else {
                var matches = patternEnd.exec(event.data);
                if (matches !== null) {
                    //statistic for end match - upload phase complete
                    ended = true;
                    debug("Upload duration: " + matches[1]);
                    thread.socket.onmessage = previousListener;
                }
            }
        };
        thread.socket.onmessage = uploadListener;
        
        thread.socket.send("PUT\n");
        
        beginS = Date.now();
    }

    /**
     * 
     * @param {RMBTTestConfig} rmbtTestConfig
     * @param {RMBTControlServerRegistrationResponseCallback} onsuccess called on completion
     */
    function obtainControlServerRegistration(rmbtTestConfig, onsuccess) {
        var json_data = {
            version: rmbtTestConfig.version,
            language: rmbtTestConfig.language,
            uuid: rmbtTestConfig.uuid,
            type: rmbtTestConfig.type,
            version_code: rmbtTestConfig.version_code,
            client: rmbtTestConfig.client,
            timezone: rmbtTestConfig.timezone,
            time: new Date().getTime()
        };
        
        if (typeof developerCode !== "undefined" && developerCode > 0 
                && typeof UserConf !== "undefined" && UserConf.preferredServer !== undefined && UserConf.preferredServer !== "default") {
            json_data['prefer_server'] = UserConf.preferredServer;
            json_data['developer_code'] = developerCode;
        }

        $.ajax({
            url: rmbtTestConfig.controlServerURL + rmbtTestConfig.controlServerRegistrationResource,
            type: "post",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(json_data),
            success: function(data) {
                var config = new RMBTControlServerRegistrationResponse(data);
                onsuccess(config);
            },
            error: function() {
                debug("error getting testID");
            }
        });

    }
    
    /**
     * get "data collector" metadata (like browser family)
     * @param {RMBTTestConfig} rmbtTestConfig
     */
    function getDataCollectorInfo(rmbtTestConfig) {
        $.ajax({
           url: rmbtTestConfig.controlServerURL + rmbtTestConfig.controlServerDataCollectorResource,
           type: "get",
           dataType: "json",
           contentType: "application/json",
           success: function(data) {
               rmbtTestConfig.product = data.agent.substring(0, Math.min(150, data.agent.length));
               rmbtTestConfig.model = data.product;
               //rmbtTestConfig.platform = data.product;
               rmbtTestConfig.os_version = data.version;
           },
           error: function() {
               debug("error getting data collection response");
           }
        });
    }
    
    /**
     * 
     * @param {RMBTControlServerRegistrationResponse} registrationResponse
     * @param {Callback} callback
     */
    function submitResults(registrationResponse, callback) {
        var json_data = {
            client_language: "de",
            client_name: _rmbtTestConfig.client,
            client_uuid: _rmbtTestConfig.uuid,
            client_version: _rmbtTestConfig.client_version,
            client_software_version: _rmbtTestConfig.client_software_version,
            geoLocations: _rmbtTestResult.geoLocations,
            model: _rmbtTestConfig.model,
            network_type: 98,
            platform: _rmbtTestConfig.platform,
            product: _rmbtTestConfig.product,
            pings: _rmbtTestResult.pings,
            test_bytes_download: _rmbtTestResult.bytes_download,
            test_bytes_upload: _rmbtTestResult.bytes_upload,
            test_nsec_download: _rmbtTestResult.nsec_download,
            test_nsec_upload: _rmbtTestResult.nsec_upload,
            test_num_threads: (_fallbackDownload?1:_numThreads),
            num_threads_ul: ((_fallbackUpload || _rmbtTestConfig.limitUploadThreads)?1:_numThreads),
            test_ping_shortest: _rmbtTestResult.ping_shortest,
            test_speed_download: _rmbtTestResult.speed_download,
            test_speed_upload: _rmbtTestResult.speed_upload,
            test_token: registrationResponse.test_token,
            time: _rmbtTestResult.beginTime,
            timezone: "Europe/Vienna",
            type: "DESKTOP",
            version_code: "1",
            speed_detail: _rmbtTestResult.speedItems,
            developer_code: _rmbtTestConfig.developerCode
        };
        var json = JSON.stringify(json_data);
        debug("Submit size: " + json.length);
        $.ajax({
            url: _rmbtTestConfig.controlServerURL + _rmbtTestConfig.controlServerResultResource,
            type: "post",
            dataType: "json",
            contentType: "application/json",
            data: json,
            success: function(data) {
                //var config = new RMBTControlServerRegistrationResponse(data);
                //onsuccess(config);
                debug("https://develop.netztest.at/en/Verlauf?" + registrationResponse.test_uuid);
                //window.location.href = "https://develop.netztest.at/en/Verlauf?" + registrationResponse.test_uuid;
                callback();
            },
            error: function() {
                debug("error submitting results");
            }
        });
    }

    /**
     * Gets the current state of the test
     * @returns {String} enum [INIT, PING]
     */
    RMBTTest.prototype.getState = function() {

        return "INIT";
    };

    return RMBTTest;
})();

var config = new RMBTTestConfig();

/*var test = new RMBTTest(config);
test.addObserver({
    update: myObserverUpdate
});*/
//test.getState();
//test.startTest();


