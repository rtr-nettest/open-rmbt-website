//var controlProxy = "https://www.netztest.at";
//var mapProxy = "https://www.netztest.at";
var controlProxy = "";
var mapProxy = "";
var wspath = "RMBTControlServer";
var mappath = "RMBTMapServer";
var statisticpath = "RMBTStatisticServer";

var developerCode = 17031552; //otherwise: 0;

var crossDomain = false;

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
    preferredServer: "default"
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
var fallbackOnJS = false;

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
