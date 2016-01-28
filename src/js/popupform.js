/**
 * @author cs
 */

var form_tips;

function form_updateTips(t) {
	form_tips.text(t).addClass("ui-state-highlight");
}

function form_checkLength(o, n, min, max) {
        if (o.val().length == 0) { //die PLZ darf auch leer sein
        }
        else if (o.val().length > max || o.val().length < min) {
		o.addClass("ui-state-error");
		form_updateTips("Die Postleitzahl muss vierstellig sein.");
		return false;
	} else {
		return true;
	}
}

function form_checkBool(o, n) {
	if (!o.checked) {
		form_updateTips(n);
		return false;
	} else {
		return true;
	}
}

function form_checkRegexp(o, regexp, n) {
	if (!( regexp.test(o.val()) )) {
		o.addClass("ui-state-error");
		form_updateTips(n);
		return false;
	} else {
		return true;
	}
}

/**
 * Opens the AGB-Form IF the user has not accepted them yet
 * if the user has accepted the agb, 
 *  -> IF run_Test is true, the test specified in callback is run
 *  -> IF run_Test if false, the requestBrowserData is called (which ultimately calls
 *      the function specified in callback with the given options
 * @param {boolean} run_Test
 * @param {string} callback a STRING (function is determined in switch-statement)
 * @param {type} options the options for the function defined in callback
 * @returns {show_agbform}
 */
function show_agbform(run_Test, callback, options) {
	document.getElementById("popupform").innerHTML = "";
	var longtext;
	
	var tmp = (selectedLanguage=='de')?tc_short_de:tc_short_en;
	$("#popupform").append(
		'<div id="terms_check" style="margin-top:20px;">' +
			'<div class="longtext">' +
			'<p>'+tmp+'</p>'
			);
	
	$.get('../'+selectedLanguage+'/tc.html',function(data) {
	                data=data.replace(/^[\s\S]+<h1>1/,"<h1>1");
	                data=data.replace(/<\/body><\/html>/,"");
	                $("#popupform .longtext").append(data);
	                
	});
	
	
	
	
	var bValid = false;
	var terms_accepted = getCookie("RMBTTermsV4");
	var tmp_title = (selectedLanguage=='de')?'Datenschutzerklärung und Nutzungsbedingungen':'Privacy Policy and Terms of Use';
	var tmp_decline = (selectedLanguage=='de')?'Abbruch':'Decline';
	var tmp_agree = (selectedLanguage=='de')?'Zustimmung':'Agree';
	var zipcookie = '';
	
	closeFunc = function() {
		if (!bValid) {
			var tmp = (selectedLanguage=='de')?'/de':'/en';
        	window.location.href= tmp;
        }
	}
	
	var dialog_buttons = {};
	
	dialog_buttons[tmp_decline] = function() {
	        $(this).dialog("close");
            closeFunc;
	};
	dialog_buttons[tmp_agree] = function() {
	        bValid = true;
                if(terms_accepted == null || terms_accepted == "false") {
                        //setCookie("RMBTTermsV4", true, 365 * 20 * 24 * 3600);
                        terms_accepted = true;
                        $(this).dialog("close");
                        /*
                        if (!noCanvas && !noJava) {
                        	show_ndtform(run_Test, callback, options, terms_accepted);
                        }
                        else {
                        */
                        	$(this).dialog("close");
                        	bValid = true;
				//console.log(terms_accepted);
				if(terms_accepted != null && terms_accepted == true) {
					setCookie("RMBTTermsV4", true, 365 * 20 * 24 * 3600);
					//console.log("cookie set!");
				}
				if (run_Test){
					/*
					zipcookie = getCookie('RMBTzip');
					//console.log(zipcookie+' '+zipcookie.length);
					if (!zipcookie || zipcookie.length != 4) {
						show_zipform(true, callback, options);
					}
					else {
					*/
						if (callback == 'jstest')
							getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_jstest);
						else if (callback == 'jstest_easy')
							getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_jstest_easy);
						else if (callback === 'websocket')
                                                        getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_websocket);
                                                else 
							getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_test);
					//}
				}
				else if (callback != '') {
					requestBrowserData(callback, options);         
				}	
                        //}
                }
	};
	
	$("#popupform").dialog({
		autoOpen : false,
		title : tmp_title,
		modal : true,
		draggable : false,
		resize : false,
		minHeight : 200,
		minWidth : 350,
		width : 780,
		height : 500,
		close: closeFunc,
		buttons : dialog_buttons
	});
	//console.log('run_Test '+run_Test);
	
	var tmp = (selectedLanguage=='de')?tc_agree_de:tc_agree_en;
	//$("#popupform").append('<p class="iwill">'+tmp+'</p>');
	$(".iwill").detach();
	$(".ui-dialog-buttonpane").prepend('<p class="iwill">'+tmp+'</p>');
	
	
	if (terms_accepted != null && terms_accepted == "true" && !run_Test) {
	        
		requestBrowserData(callback, options);
	}
	else if(terms_accepted == null || terms_accepted == "false") {
		$("#popupform").dialog("open");
	}
	else if (run_Test){
	        //var zipcookie = '';
	        //zipcookie = getCookie('RMBTzip');
	        //console.log(zipcookie+' '+zipcookie.length);
	        /*
	        if (!zipcookie || zipcookie.length != 4) {
	                show_zipform(run_Test, callback, options);
	        }
	        else {
	        */
	                if (callback == 'jstest')
	                	getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_jstest);
	                else if (callback == 'jstest_easy')
	                	getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_jstest_easy);
                        else if (callback == 'websocket')
                            getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_websocket);
	                else 
				getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_test);
	        //}
	}
}

function show_ndtform(run_Test, callback, options, terms_accepted) {
	document.getElementById("popupform").innerHTML = "";
	$(".iwill").detach();
	var longtext;
	
	var tmp = (selectedLanguage=='de')?ndt_short_de:ndt_short_en;
	$("#popupform").append(
		'<div id="terms_check" style="margin-top:20px;">' +
			'<div class="longtext">' +
			'<p>'+tmp+'</p>'
			);
	
	
	var tmp = (selectedLanguage=='de')?'Ich möchte zusätzlich den optionalen, vertiefenden NDT-Test ausführen.':'I wish to run the optional NDT-Test.';
	$("#popupform").append(
	                '</div>'
	                 + '<form action="javascript:void(0);" class="ndtform">'
			 + '<input type="checkbox" name="form_ndt" id="form_ndt" class="text ui-widget-content ui-corner-all" />'
			 + '<label for="form_ndt">&nbsp;'+tmp+'</label>'
			 + '</div>'
			 + '</form>'
			 );
		
	var bValid = false;
	var tmp_title = (selectedLanguage=='de')?'NDT-Test':'NDT-Test';
	var tmp_decline = (selectedLanguage=='de')?'Zurück':'Back';
	var tmp_agree = (selectedLanguage=='de')?'Weiter':'Continue';
	var zipcookie = '';
	
	closeFunc = function() {
		if (!bValid) {
			var tmp = (selectedLanguage=='de')?'/de':'/en';
        	window.location.href= tmp;
       }
	}
	
	var dialog_buttons = {}; 
	dialog_buttons[tmp_decline] = function() {
		bValid = true;
	    $(this).dialog("close");
        show_agbform(run_Test, callback, options);
            
	};
	dialog_buttons[tmp_agree] = function() {
	        bValid = true;
	        //console.log(terms_accepted);
                if(terms_accepted != null && terms_accepted == true) {
                        setCookie("RMBTTermsV4", true, 365 * 20 * 24 * 3600);
                        //console.log("cookie set!");
                }
                        
                        if ($('#form_ndt').attr('checked')) {
                                setCookie("RMBTndt", '1', 365 * 20 * 24 * 3600);
                        }
                        else {
                                setCookie("RMBTndt", '0', 365 * 20 * 24 * 3600);
                        }
                        $(this).dialog("close"); 
                        if (run_Test){
	                        zipcookie = getCookie('RMBTzip');
	                        //console.log(zipcookie+' '+zipcookie.length);
	                        if (!zipcookie || zipcookie.length != 4) {
	                                show_zipform(true, callback, options);
	                        }
	                        else {
	                                if (callback == 'jstest')
						getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_jstest);
					else if (callback == 'jstest_easy')
						getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_jstest_easy);
					else if (callback == 'ndttest')
					{
						testID = window.location.hash.substr(1);
						
						var attributes = {
							id : 'rmbtApplet',
							codebase : '../applet/',
							code : 'at.alladin.rmbt.client.applet.RMBTApplet',
							archive : 'RMBTApplet.jar',
							width : 1,
							height : 1
						};
						var parameters = {};
						deployJava.runApplet(attributes, parameters, '1.5');
						
						rmbtApplet.startNdt(cookie_uuid,testID);
						ndt(testID);
					}
					else 
						getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_test);
	                        }
                        }
                        else if (callback != '') {
                                requestBrowserData(callback, options);         
                        }
	};
	
	
	$("#popupform").dialog({
		autoOpen : false,
		title : tmp_title,
		modal : true,
		draggable : false,
		resize : false,
		minHeight : 200,
		minWidth : 350,
		width : 500,
		height : 535,
		close : closeFunc,
		buttons : dialog_buttons
	});
	//console.log('run_Test '+run_Test);

	$("#popupform").dialog("open");

}

function show_zipform(run_Test, callback, options) {
	document.getElementById("popupform").innerHTML = "";
	$(".iwill").detach();
	
	if (selectedLanguage == "de") {
	$("#popupform").append(
		'<form action="javascript:void(0);">' +
		'<div id="zip_check">' +
			'<p>Bitte geben Sie für ein bestmögliches Ergebnis Ihre Postleitzahl an.</p>' +
			'<p><label for="form_zip_ausland">Ausland:&nbsp;</label>' +
			'<input type="checkbox" name="form_zip_ausland" id="form_zip_ausland" class="checkbox ui-widget-content ui-corner-all" onchange="$(\'#toggle_zip\').toggle();" /></p>' +
			'<p id="toggle_zip"><label for="form_zip">Österr. Postleitzahl:&nbsp;</label>' +
			'<input type="text" name="form_zip" id="form_zip" class="text ui-widget-content ui-corner-all" /></p>' +
			
		'</div>'
		+ '<div class="validateTips"></div><div class="clear">'
		+ '</form>');
	}
	else {
	$("#popupform").append(
		'<form action="javascript:void(0);">' +
		'<div id="zip_check">' +
			'<p>For optimum results please enter your post code.</p>' +
			'<p><label for="form_zip_ausland">Outside Austria:&nbsp;</label>' +
			'<input type="checkbox" name="form_zip_ausland" id="form_zip_ausland" class="checkbox ui-widget-content ui-corner-all" onchange="$(\'#toggle_zip\').toggle();" /></p>' +
			'<p id="toggle_zip"><label for="form_zip">Austrian postcode:&nbsp;</label>' +
			'<input type="text" name="form_zip" id="form_zip" class="text ui-widget-content ui-corner-all" /></p>' +
			
		'</div>'
		+ '<div class="validateTips"></div><div class="clear">'
		+ '</form>');		
	}

	var zip = $("#form_zip");
	var allFields = $([]);
	var bValid = false;
	form_tips = $(".validateTips");
	var terms_accepted = getCookie("RMBTTermsV4");
	popup_title = (selectedLanguage=='de')?'Postleitzahl':'Post code';
	allFields.add(zip);
	
	var tmp_decline = (selectedLanguage=='de')?'Abbrechen':'Cancel';
	var tmp_agree = (selectedLanguage=='de')?'Weiter':'Continue';
	
	var dialog_buttons = {};
	dialog_buttons[tmp_decline] = function() {
		$(this).dialog("close");
		var tmp = (selectedLanguage=='de')?'/de':'/en';
		window.location.href= tmp;
	};
	dialog_buttons[tmp_agree] = function() {
		bValid = true;
		allFields.removeClass("ui-state-error");
		if(terms_accepted != null && terms_accepted == "true" && run_Test) {
			if (zip.val().length == 0) {
				setCookie('RMBTzip', '0000', 3600);
				$(this).dialog("close");  
				bValid = false;
			}
			else if (zip.val().length) {
				bValid = bValid && form_checkLength(zip, "Postleitzahl", 4, 4);
				bValid = bValid && form_checkRegexp(zip, /^([0-9])+$/, "Posleitzahl darf nur aus Zahlen von 0 - 9 bestehen");
			}
		}
		if (bValid) {
			setCookie('RMBTzip', zip.val(), 3600);
			$(this).dialog("close");
		}
	};

	$("#popupform").dialog({
		autoOpen : false,
		title : popup_title,
		modal : false,
		draggable : false,
		resize : false,
		minHeight : 200,
		minWidth : 350,
		width : 600,
		height : 220,
		buttons : dialog_buttons,
		close : function() {
			if ((terms_accepted != null && terms_accepted == "true") || (bValid)) {
				if (!bValid && run_Test) {
					zip.val("");
				}
				allFields.val("").removeClass("ui-state-error");
				if (terms_accepted != null && terms_accepted == "true" && run_Test) {
					//getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_test);
					if (callback == 'jstest')
						getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_jstest);
					else if (callback == 'jstest_easy')
						getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_jstest_easy);
					else 
						getLocation(geo_HighAccuracy, geo_timeout, geo_maximumAge, start_test);
				}
				else {
					requestBrowserData(callback);
				}
			} else {
				window.location.href = '/de/';
				//$("#popupform").dialog("open");
			}
		}
	});
	if (terms_accepted != null && terms_accepted == "true" && !run_Test) {
		requestBrowserData(callback, options);
	}
	else {
		$("#popupform").dialog("open");
		//setTimeout(function(){$("#form_zip").focus()},1000);
		
	}
	$('#popupform').live('keyup', function(e){
          if (e.keyCode == 13) {
            $(':button:contains("Weiter")').click();
          }
        });
}

function show_errorPopup() {
	$("#popuperror").dialog({

		autoOpen : false,

		title : Lang.getString('Error'),

		modal : true,
		draggable : false,
		resize : false,

		minHeight : 200,
		minWidth : 350,

		width : 500,
		height : 200,

		buttons : { Ok : function() {
				$(this).dialog("close");
			}
		}
		});
	$("#popuperror").dialog("open");
}
function close_errorPopup() {
    try {
        $("#popuperror").dialog("close");
    }catch(err) {}
}
