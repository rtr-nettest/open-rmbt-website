
var loadRMBTApplet = true;
var noJava = false;
var oldjava = true;
var cookieEnabled = true;


//var APPLET_HOST = 'develop.netztest.at';
var APPLET_HOST = 'c01.control.netztest.at';
var APPLET_PATH = '/';

var javaTurnOff = getParam('nojava');
var canvasTurnOff = getParam('nocanvas');
var websocket = getParam('websocket');


if (getParam("Java")) {
    preferredTest = TestTypes.Java;
}
if (getParam("websocket")) {
    preferredTest = TestTypes.Websocket;
}
if (preferredTest !== TestTypes.Java) {
        noJava = true;
        loadRMBTApplet = false;
}
else if (!navigator.cookieEnabled) {
	loadRMBTApplet = false;
	cookieEnabled = false;	
}
else if (javaTurnOff==1 && !Modernizr.canvas) {
	loadRMBTApplet = false;
        noJava = true;	
}
else if (!navigator.javaEnabled() || javaTurnOff==1) {
        loadRMBTApplet = false;
        noJava = true;
}
else {
        var versions = deployJava.getJREs();
        //console.log(versions);
        if (versions == null || versions[0] == null || versions[0] == "") {
                //loadRMBTApplet = false;
                noJava = true;
                console.log("no info about JRE version");
        }
        else{
        	loadRMBTApplet = false;
        	var anz_versions = versions.length;
        	var highest_version = anz_versions-1; 
        	var javaplugin = splitjavaversion(versions[highest_version]);
        	var javanow = splitjavaversion("1.7.0_17");
        	if (javaplugin[0] == javanow[0]) {
        		if (javaplugin[1] == javanow[1]) {
        			if (javaplugin[2] == javanow[2]) {
        				if (javaplugin[3] >= javanow[3]) {
        					loadRMBTApplet = true;
        					oldjava = false;
        				}	
        			}	
        		}
        	}
        	var javaplugin = splitjavaversion(versions[highest_version]);
        	var javanow = splitjavaversion("1.6.0_43");
        	if (javaplugin[0] == javanow[0]) {
        		if (javaplugin[1] == javanow[1]) {
        			if (javaplugin[2] == javanow[2]) {
        				if (javaplugin[3] >= javanow[3]) {
        					loadRMBTApplet = true;
        					oldjava = false;
        				}	
        			}	
        		}
        	}
        	if (javaplugin[0] == javanow[0]) {
        		if (javaplugin[1] == 8) {
        			loadRMBTApplet = true;	
        			oldjava = false;
        		}
        	}
        	//console.log(javaplugin[0]+" "+javaplugin[1]+" "+javaplugin[2]+" "+javaplugin[3]);
        }
}
if (loadRMBTApplet) {
        var attributes = {
                id : 'rmbtApplet',
                codebase : '../applet/',
                code : 'at.alladin.rmbt.client.applet.RMBTApplet',
                archive : 'RMBTApplet.jar',
                width : 1,
                height : 1
        };
        var parameters = {
                runQos: UserConf.runQos,
                qosSsl: true,
                runNdt: UserConf.runNdt,
                host: APPLET_HOST,
                path: APPLET_PATH
        };
        deployJava.runApplet(attributes, parameters, '1.6');
}

//jQuery.support.cors = true;
//$.support.cors = true;

// Test Vars
var exdays = 365*24*60*60;
var uuid;



function start_test() {
        var zipInput = $("#form_zip");
        var zipVal = "";
        var zipcookie = '';
        zipcookie = getCookie('RMBTzip');
        if (zipcookie && (zipcookie.length == 4 || zipcookie.length == 0)) {
                zipVal = zipcookie;                                                                                           
        }
        else if (zipInput.val() && zipInput.val().length > 0) {
                zipVal = zipInput.val();
        };
        var options = {
                position : getCurLocation(),
                zip : zipVal
        };
        //if (typeof rmbtApplet.getIntermediateResult == 'function') {
        //if (rmbtApplet.isactive()) {
        try {
		var fct = function(){
			var result;
			result = rmbtApplet.getIntermediateResult();
                        TestEnvironment.getTestVisualization().updateInfo(
                                rmbtApplet.getServerName(),
                                rmbtApplet.getPublicIP(),
                                rmbtApplet.getProvider(),
                                rmbtApplet.getTestUuid()
                                );
                        if (rmbtApplet.getServerName() === null) {
                            //try again
                            window.setTimeout(fct,5000);
                        }
                        
			if (result) {
				var status = result.status.toString();
				if (!status || status.length == 0) {
					$("#popuperror").empty();
					$("#popuperror").append('<p>'+Lang.getString('ErrorOnInitializingApplet') +'</p>');   
					show_errorPopup();
				}
			}
		};
                window.setTimeout(fct,5000);
		requestBrowserData('RMBTsettings', options);
	}
	catch(err) {
		//console.log(err);
		TestEnvironment.getTestVisualization().setStatus("JAVAERROR");	
	}
        //} else set_status("JAVAERROR");
}

$(document).ready(function() {
    
        TestEnvironment.init();
        
    
               
        if (cookieEnabled && !((preferredTest === TestTypes.Java) && (!loadRMBTApplet || !rmbtApplet))) {
            
                var argument;
                switch(preferredTest) {
                    case TestTypes.Java:
                        argument = '';
                        break;
                    case TestTypes.JavaScript:
                        argument = 'jstest';
                        break;
                    case TestTypes.Websocket:
                        argument = 'websocket';
                        break;
                }
                

                setTimeout(function() {
                    show_agbform(true, argument);
                }, 900);

		//$("#form_zip").focus();	
                
        } 
        else {
        	
        	
        	// Error-Messages bei Fehlern
                $("#popuperror").empty();
                if (!cookieEnabled) {
                	var errormessage = (selectedLanguage=='de')?'<p>Die Cookie-Funktion in Ihrem Browser ist deaktiviert. Sie können den RTR-Netztest nicht ausführen.</p>':'<p>Your browser\'s cookie functionality is turned off. You can not run the RTR-NetTest.<p>';
                	$("#popuperror").append(errormessage);
                	show_errorPopup();	
                }
                
                else if (!Modernizr.canvas) {
                	var errormessage = (selectedLanguage=='de')?'<p>Ihr Browser ist zu alt und unterstützt nicht alle Funktionen, die zur Durchführung des Tests notwendig wären. Bitte verwenden Sie einen neueren oder anderen Browser.</p>':'<p>Your browser version is outdated and does not support all features necessary. Please use a newer browser version.<p>';
                	$("#error_placeholder").hide();
                	$("#dashboard").detach();
                	$("#dashboard_easy").show();
                            setTimeout(function(){show_agbform(true, 'jstest_easy');},2000);
                        }
                else if (noJava) {
                	var errormessage = (selectedLanguage=='de')?'<p>Um den RTR-Netztest nutzen zu können, muss die aktuelle Java Version installiert und aktiviert sein.</p><p>Sie können Java auf <a href="http://www.java.com/de/download/">dieser Seite</a> herunter laden.</p>':'<p>To use the RTR-NetTest you need to install and activate the latest java version.</p><p>Download the latest java version here:<br /><a href="http://www.java.com/de/download/">http://www.java.com/de/download/</a></p>';
                	$("#error_placeholder").hide();
                	$("#dashboard_easy").detach();
                	$("#dashboard").show();
                	//console.log("nojava");
                	//setTimeout(function(){show_agbform(true, 'jstest');},2000);
                    $("#popuperror").append(errormessage);
                	show_errorPopup();	
                }
                else if (oldjava){
                	var errormessage = (selectedLanguage=='de')?'<p>Ihr Java-Plugin (Version '+versions[0]+') ist veraltet!</p><p>Bitte aktualisieren Sie das Plugin per Download unter <a href="http://java.com/inc/BrowserRedirect1.jsp">http://java.com/inc/BrowserRedirect1.jsp</a></p>':'<p>Your java plugin (version '+versions[0]+') is outdated!</p><p>Please update your java plugin using the following download:<br /><a href="http://java.com/inc/BrowserRedirect1.jsp">http://java.com/inc/BrowserRedirect1.jsp</a><p>';
                	$("#error_placeholder").hide();
                	$("#dashboard").show();
                	$("#dashboard_easy").detach();
                	//console.log("oldjava");
                    $("#popuperror").append(errormessage);
                	show_errorPopup();	
                	//setTimeout(function(){show_agbform(true, 'jstest');},2000);
		}
                
                else if (rmbtApplet == null) {
                	var errormessage = (selectedLanguage=='de')?'<p>Fehler beim Laden des Testmoduls.</p>':'<p>Error on loading the test module<p>';
                	$("#error_placeholder").hide();
                	$("#dashboard").show();
                	$("#dashboard_easy").detach();
                	//console.log("noApplet");
                    $("#popuperror").append(errormessage);
                	show_errorPopup();	
                	//setTimeout(function(){show_agbform(true, 'jstest');},2000);
                }
                else {
			var errormessage = (selectedLanguage=='de')?'<p>>Unbekannter Fehler.</p>':'<p>unknown error<p>';
			$("#popuperror").append(errormessage);
			show_errorPopup();
                }
                
                
        }

});
