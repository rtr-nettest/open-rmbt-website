// Configuration www.netztest.at

var controlProxy = "https://c01.netztest.at";
var statisticProxy = "https://m-cloud.netztest.at";
if (window.location.href.indexOf("github") !== -1) {
    //default for github pages
} else if (window.location.href.indexOf("http://localhost") !== -1) {
    //default for localhost -> change to your server!
    statisticProxy = "";
    controlProxy = "";
} else if (window.location.href.indexOf("https://www.netztest.at") !== 0) {
    statisticProxy = "";
    controlProxy = "";
}
//var mapProxy = "" - filled in dynamically
var wspath = "RMBTControlServer";
var statisticpath = "RMBTStatisticServer";

var userServerSelection = 0; // FALSE - otherwise TRUE;

var crossDomain = true;

var TestTypes = {
    Websocket : "websocket",
    Java : "Java",
    JavaScript : "jstest"
};

var preferredTest = TestTypes.Websocket;

//can be changed in cookie (/Optionen-Page)
var UserConf = {
    runQos: true,
    qosSsl: true,
    runNdt: false,
    preferredTest: preferredTest,
    preferredServer: "default",
    overrideControlServer: false,
    ipVersion: "default",
    fixedDownloadThreads: null,
    fixedUploadThreads: null
};

var test_version_name = "0.1";
var test_language;
var cookie_uuid;
var test_type = "DESKTOP";
var test_version_code = "1";
var test_name = "RTR-Netztest"; 
var test_timezone;
var test_devices;
var test_networks;
var client_name = "RMBTjs";
var test_token, testUUID;
var bing_api_key = "AhtZ2SmIKuAaKmtpxQksx2lFYBLkqF7xi-AXtnyrb7ocVo1DldoaGSpOtziHjytA";
var osm_server = "https://tile.openstreetmap.org"; ///https://cache.netztest.at/tile/osm/
var fallbackOnJS = false;
var terms_version = 6;

test_timezone = "Europe/Vienna"; // ToDo Timezone dynamisch erzeugen.


var geo_HighAccuracy = true;
var geo_timeout = 10000;
var geo_maximumAge = 60000;

var browser_list = [
	"MSIE",
	"Firefox",
	"Chrome",
	"Safari",
	"Opera"
];
