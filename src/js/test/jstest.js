var start_dl, start_ul, start_ping;
var start_all = 0;
var start_download = 0;
var start_upload = 0
var end_dl, end_ul, end_ping = 0;
var messung_dl = 0;
var messung_ul = 0;
var bytes_dl = 0;
var bytes_ul = 0;
var speed_dl,speed_ul;
var bytes_dl_messung = 0;
var bytes_ul_messung = 0;
var diff_dl_messung = 0;
var diff_ul_messung = 0;
var speed_dl_messung = 0;
var speed_ul_messung = 0;
var binfile = '';
var dlfiles = new Array();
dlfiles[1] = '000100';
dlfiles[2] = '000200';
dlfiles[3] = '000400';
dlfiles[4] = '000800';
dlfiles[5] = '001600';
dlfiles[6] = '003200';
dlfiles[7] = '006400';
dlfiles[8] = '012800';
dlfiles[9] = '025600';
//dlfiles[10] = '051200';
//dlfiles[11] = '102400';


var ulsize = new Array();
ulsize[1] = 102400;
ulsize[2] = 204800;
ulsize[3] = 409600;
ulsize[4] = 819200;
ulsize[5] = 1638400;
ulsize[6] = 3276800;
ulsize[7] = 6553600;
ulsize[8] = 13107200;
//ulsize[9] = 26214400;
//ulsize[10] = 52428800;
//ulsize[11] = 104857600;

var max_index_download = dlfiles.length-1;
var max_index_upload = ulsize.length-1;
var maxdltime_single = 10; //seconds
var maxdltime_all = 10; //seconds

var maxultime_single = 15; //seconds
var maxultime_all = 15; //seconds
var dl_testlimit = 1; //seconds
var ul_testlimit = 1; //seconds
var maxpinganz = 10;
var minping = 9999;

var _status;
var progress = 0;
var down_log = 0;
var up_log = 0;


//Adapter for the Javascript-Test that implements {RMBTIntermediateResult} .getIntermediateResult()
function JSTestadapter() {
    _status = TestState.INIT;
};


/**
 * 
 * @returns {RMBTIntermediateResult}
 */
JSTestadapter.prototype.getIntermediateResult = function() {
    var intermediateResult = new RMBTIntermediateResult();
    intermediateResult.pingNano = (minping === 9999) ? -1 : (minping * 1e9);
    intermediateResult.status = _status;
    intermediateResult.progress = (progress > 1)?1:progress;
    intermediateResult.downBitPerSec = speed_dl_messung * 1e6; //from mbit to bit
    intermediateResult.downBitPerSecLog = down_log;
    intermediateResult.upBitPerSec = speed_ul_messung * 1e6; //from mbit to bit
    intermediateResult.upBitPerSecLog = up_log;
    return intermediateResult;
};


/**
 * 
 * @param {type} index
 * @param {boolean} easy TRUE, if client does not support canvas 
 * @returns {undefined}
 */
function TestPing(index,easy) {
	_status = TestState.PING;
	start_ping = new Date().getTime();	
	var ajaxerror=false;
	$.ajax({
	type: "GET",
	url: "../jstest/files/000000?id=" + start_ping,
	dataType: "text",
	processData: false,
	error: function(xhr,status,error) {
	    //console.log("status: "+status);
	    //console.log("error: "+error);
	    ajaxerror=true;
	},
	success: function(msg) {
	    end_ping = new Date().getTime();
	    pingdiff = (end_ping - start_ping) / 1000;
	    //console.log("pingdiff: "+pingdiff);
	    if (pingdiff<minping) {
		minping = pingdiff;
	    }
	},
	complete: function(xhr, textStatus) {
		
		if (index < maxpinganz && !ajaxerror) {
			index++;
			TestPing(index,easy);
		}
		else {
			//console.log("minping: "+minping);
			//$('#ping').html('<b>Ping: ' + minping + ' seconds ');
			var showping = minping*1000;
                        
                        //update html
			document.getElementById('showPing').innerHTML = showping+" ms";
			TestDownload(1,easy);
		}
	    
	}
    });
}

/**
 * Called by TestPing
 * @param {int} index #try, starts with 1, ends with max_index_download or time exceeded
 * @param {boolean} easy TRUE if browser doesn't support canvas
 * @returns {undefined}
 */     
function TestDownload(index,easy) {
    _status = TestState.DOWN;
    start_dl = new Date().getTime();
    var ajaxerror=false;
    $.ajax({
	type: "GET",
	url: "../jstest/files/"+dlfiles[index] + "?id=" + start_dl,
	dataType: "text",
	processData: false,
	error: function(xhr,status,error) {
	    //console.log("status: "+status);
	    //console.log("error: "+error);
	    ajaxerror=true;
	},
	success: function(msg) {
            //compute download speed
	    end_dl = new Date().getTime();    
	    binfile = msg;
	    diff = (end_dl - start_dl) / 1000;
	    diff_dl = (end_dl - start_download) / 1000;
	    bytes = binfile.length;
	    bytes_dl = bytes_dl+bytes;
	    speed = (bytes / diff) / 1024 / 1024 * 8;
	    speed = Math.round(speed*100)/100;
	    speed_dl = (bytes_dl / diff_dl) / 1024 / 1024 * 8;
	    speed_dl = Math.round(speed_dl*100)/100;
	    if (diff < dl_testlimit && messung_dl===0) {
	    }
	    else {
		messung_dl = messung_dl+1;
	    }
	    
            //if min. 1 test has been successful
	    if (messung_dl>0) {
		if (messung_dl===1)
			start_download_messung = new Date().getTime();	
		diff_dl_messung = diff_dl_messung+diff-minping;
		bytes_dl_messung = bytes_dl_messung+bytes;
		speed_dl_messung = (bytes_dl_messung / diff_dl_messung) / 1000 / 1000 * 8;
		speed_dl_messung = Math.round(speed_dl_messung*100)/100;
	    }
	    //$('#dlspeed').html('<b>' + speed + ' Mb/s (You)</b>&nbsp;<img src="busy.gif">');
	    //$('#dlbar').css('width', Math.floor(speed * 8)+'px');
	},
	complete: function(xhr, textStatus) {
		diff_dl = (end_dl - start_download) / 1000;	
		//console.log("speed: "+speed+" speed_dl: "+speed_dl+" speed_dl_messung: "+speed_dl_messung+" binfile.length: "+binfile.length);
		//console.log('index: '+index+', diff: '+diff+', diff_dl: '+diff_dl+', max_index_download: '+max_index_download+', bytes_dl_messung: '+bytes_dl_messung+', diff_dl_messung: '+diff_dl_messung+', messung_dl: '+messung_dl);
		progress = diff_dl_messung/maxdltime_all;
                
		if (progress > 1) progress = 1;
		down_log = (log10(speed_dl_messung) + 2)/4; 
		if (down_log > 1)
			down_log = 1;
		
		if (index < max_index_download)
			index++;
			
		
		
		if (diff < maxdltime_single && diff_dl_messung <= maxdltime_all && !ajaxerror) {
			TestDownload(index,easy);
		}
		else {
			//$('#dlspeed').html('<b>Average: ' + speed_dl_messung + ' Mb/s');
                        //download speed test is finished, now start upload test
			start_upload = new Date().getTime();
                        progress = 0;
			TestUpload(1,easy);
		}
	    
	}
    });
}

/**
 * Upload speed test
 * @param {int} index current round of upload tests (starts with 1)
 * @param {boolean} easy TRUE if browser does not support canvas
 * @returns {undefined}
 */
function TestUpload(index,easy) {
    _status = TestState.UP;
    start_ul = new Date().getTime();
    //get upload-data from the largest downloaded file during the 
    //download speedtest
    var upload_data = binfile.substring(0,ulsize[index]);
    //console.log("ulsize: "+ulsize[index]);
    var ajaxerror=false;
    $.ajax({
	type: "POST",
	url: "/upload",
	data: upload_data,
	contentType: 'application/octet-stream',
	error: function(xhr,status,error) {
		
	    //console.log("status: "+status);
	    //console.log("error: "+error);
	    ajaxerror=true;
	},
	success: function(msg) {
	    //console.log("success");
	    end_ul = new Date().getTime();
	    diff = (end_ul - start_ul) / 1000;
	    diff_ul = (end_ul - start_upload) / 1000;
	    bytes = upload_data.length;
	    bytes_ul = bytes_ul+bytes;
	    speed = (bytes / diff) / 1024 / 1024 * 8;
	    speed = Math.round(speed*100)/100;
	    speed_ul = (bytes_ul / diff_ul) / 1024 / 1024 * 8;
	    speed_ul = Math.round(speed_ul*100)/100;
	    
	    
	    if (diff < ul_testlimit && messung_ul===0) {
	    }
	    else {
		messung_ul = messung_ul+1;
	    }
	    
	    if (messung_ul>0) {
		if (messung_ul===1)
			start_upload_messung = new Date().getTime();	
		diff_ul_messung = diff_ul_messung+diff-minping;
		bytes_ul_messung = bytes_ul_messung+bytes;
		speed_ul_messung = (bytes_ul_messung / diff_ul_messung) / 1000 / 1000 * 8;
		speed_ul_messung = Math.round(speed_ul_messung*100)/100;
	    }
	    
	    //$('#ulspeed').html('<b>' + speed + ' Mb/s (You)&nbsp;<img src="busy.gif"></b>');
	    //$('#ulbar').css('width', Math.floor(speed * 60)+'px');
	},
	complete: function(xhr, textStatus) {
		//console.log("end_ul: "+end_ul+" start_upload: "+start_upload); 
		diff_ul = (end_ul - start_upload) / 1000;
		
		//console.log("speed: "+speed+" speed_ul: "+speed_ul+" speed_ul_messung: "+speed_ul_messung);
		//console.log('index: '+index+', diff: '+diff+', diff_ul: '+diff_ul+', max_index_upload: '+max_index_upload+', bytes_ul_messung: '+bytes_ul_messung+', diff_ul_messung: '+diff_ul_messung+', messung_ul: '+messung_ul);
		
		progress = diff_ul_messung/maxultime_all;
		if (progress > 1) progress = 1;
		up_log = (log10(speed_ul_messung) + 2)/4; //??? progess of complete test?
		if (up_log > 1)
			up_log = 1;
		
//		
		
		if (index < max_index_upload)
			index++;	
		
		
		
		
		if (diff < maxultime_single && diff_ul_messung <= maxultime_all && !ajaxerror) {
			TestUpload(index,easy);
		}
		else {
			//$('#ulspeed').html('<b>Average: ' + speed_ul_messung + ' Mb/s');
			
			RMBTjstest_result(test_token,curGeoPos, function() {
                _status = TestState.END;
            });
			
			
			
		}
	    
	}
    });
}
