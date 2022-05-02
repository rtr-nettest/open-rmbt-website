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

var tc_short_de = '<b>Im Sinne größtmöglicher Transparenz und Information für den Nutzer, ist die Verwendung der Browser-Version des RTR-Netztests erst nach ausdrücklicher Zustimmung zur Datenschutzerklärung sowie zu den Nutzungsbedingungen der RTR-GmbH hinsichtlich des RTR-Netztests möglich:';
var tc_short_en = '<b>In order to ensure users with the greatest possible transparency and information, the RTR-NetTest browser version can be used only after explicit consent to RTR’s Privacy Policy and Terms of Use for the RTR-NetTest:';
var tc_agree_de = 'Ich stimme der Datenschutzerklärung und den Nutzungsbedingungen der RTR-GmbH hinsichtlich des RTR-Netztests zu.';
var tc_agree_en = 'I agree with RTR’s Privacy Policy and Terms of Use for the RTR-NetTest.';

var ndt_short_de = 'Der NDT-Test der Forschungsplattform M-Lab ist ein optionaler, vertiefender Test, der weitere technische Parameter misst – allerdings auch die Messdauer und das übertragene Datenvolumen deutlich erhöht. Im Rahmen dieses vertiefenden Tests werden Daten, ua. die IP-Adresse, auch ins Ausland au&szlig;erhalb der EU an die Forschungsplattform M-Lab übermittelt, dh. diese Daten werden durch M-Lab dauerhaft gespeichert, veröffentlicht und der Allgemeinheit zur Information, Nutzung, Weiterverbreitung und Weiterverwendung unter M-Lab-Open Data frei zug&auml;nglich gemacht. Aufgrund der Verarbeitung und der Übermittlung der IP-Adresse ins Ausland au&szlig;erhalb der EU könnte gegebenenfalls die Identität des Nutzers bestimmt werden oder bestimmbar sein und somit könnte ein Personenbezug hergestellt werden.<br /><br />Durch Anklicken des Zurück-Button wird der Datenschutztext wieder aufgerufen. Dort finden sich unter <b>1.3</b> die ausführlichen Informationen zum NDT-Test.';
var ndt_short_en = 'The NDT-Test of the research platform M-Lab is an optional, but more comprehensive test, which measures additional technical parameters. Please note that this test increases the time duration of the measurement and the transmitted data volume considerably. As part of the more comprehensive test, data – such as IP-addresses – are transferred, which means that these data are permanently stored and published by M-Lab and are made freely accessable to the general public for information, use, dissemination and other applications under M-Lab Open Data. Given the processing and transfer of IP-addresses to non-EU countries, it is possible that a user’s identity may be determined or become determinable and that personal identification is possible.<br /><br />Click the return button to access RTR’s Privacy Policy for the RTR-NetTest.'

var min_accuracy_for_showing_map = 2000;
var exdays = 365*24*60*60;

function is_array(input){
    return typeof(input)=='object'&&(input instanceof Array);
  }


function splitjavaversion(vers) {
	var javatmp = vers.split(".");
	var alpha = parseInt(javatmp[0]);
	var beta = parseInt(javatmp[1]);
	var ceta = javatmp[2].split("_");
	var ceta1 = parseInt(ceta[0]);
	var ceta2 = parseInt(ceta[1]);
	var return_array = new Array(alpha,beta,ceta1,ceta2);
	return return_array;
}

function getCookie(c_name)
{
var i,x,y,ARRcookies=document.cookie.split(";");
for (i=0;i<ARRcookies.length;i++)
{
  x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
  y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
  x=x.replace(/^\s+|\s+$/g,"");
  if (x==c_name)
    {
    return unescape(y);
    }
  }
}

function setCookie(cookie_name, cookie_value, cookie_exseconds) {
        //var exdate = new Date();
        //exdate.setDate(exdate.getDate() + cookie_exdays);
        
        var futdate = new Date();
        var expdate = futdate.getTime();
        expdate += cookie_exseconds*1000;
        futdate.setTime(expdate);

        
        //var c_value=escape(cookie_value) + ((cookie_exdays==null) ? ";" : "; expires="+exdate.toUTCString() +";");
        var c_value=escape(cookie_value) + ((cookie_exseconds==null) ? ";" : "; expires="+futdate.toUTCString() +";");
        document.cookie = cookie_name+"="+c_value+" path=/;";
}

function nl2br (str, is_xhtml) {   
        var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
}

var selectedLanguage;
function getLanguageFromURL() {
        var pathname = window.location.pathname;
        var tmp = pathname.split("/");
        //console.log(tmp[1]);     
        selectedLanguage = tmp[1];
        return selectedLanguage;
}


var browser_language, browser_port, browser_ip, browser_product, browser_url, browser_header, browser_agent, browser_country_geoip;
/**
 * Requests data from the HTTP header from the control-server
 * @param {String} callback the function that has to be called afterwards
 *                  either: RMBTsettings, RMBTsync, RMBTtestresult, RMBThistory,
 *                      RMBTstatistics or RMBTmapfilter
 * @param {type} options the options that are given to the called function
 * @returns {undefined} The global variables browser_* are filled with the correct data
 */
function requestBrowserData(callback, options) {
	//console.log("browserdata options: "+options);
        $.ajax({
                url: controlProxy+"/"+wspath+"/requestDataCollector",
                type: "GET",
                dataType: "json",
                cache: false,
                crossDomain: crossDomain,
                success: function(data) {
                        //getLanguageFromURL();
                        //console.log(data);
                        var browser_language_temp = data.languages[0];
                        var browser_language_array = browser_language_temp.split("-");
                        browser_language = browser_language_array[0];
                        browser_port = data.port;
                        browser_ip = data.ip;
                        browser_product = data.product;
                        browser_url = data.url;
                        browser_header = data.headers;
                        browser_agent = data.agent;
                        browser_country_geoip = data.country_geoip;
                        //if it is a mobile browser -> dont bother to inform user about
                        //missing javascript (regex from https://gist.github.com/dalethedeveloper/1503252 )
                        var mobile_client_found = browser_agent.match(/Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/g);

                        if (callback == 'RMBTsettings') {
                            //jstest
                            if (mobile_client_found) {
                                $("#noJavaWarning").hide();

                                //is it android?
                                if (browser_agent.match(/Android|Opera M(obi|ini)|Dolfin|Dolphin/g)) {
                                    $("#androidApp").show();
                                    //also display links to phone stores (if available)
                                    $("#androidApp").html('<p>' + Lang.getString('AndroidAppAvailable') + '</p>');
                                }

                                //is it iOS?
                                else if (browser_agent.match(/iP(hone|od|ad)/g)) {
                                    $("#iOSApp").show();
                                    $("#iOSApp").html('<p>' + Lang.getString('IOSAppAvailable') + '</p>');
                                }
                            }

                            //Safari 10.1 and 10.1.1 won't let user's execute tests
                            //due to a previous bug in the WebKit library
                            // -> inform the user
                            //https://bugs.webkit.org/show_bug.cgi?id=170463
                            //if (browser_agent.match(/Firefox\/82\.0.*/)) {
                            //    $("#popuperror").append(Lang.getString("FirefoxBroken"));
                            //    show_errorPopup();
                            //    return;
                            //}

                            //Firefox 82 won't let user's execute tests
                            //due to a previous bug in the WebKit library
                            // -> inform the user
                            //https://bugs.webkit.org/show_bug.cgi?id=170463

                            //Mac os monterey won't let websocket upload work unless
                            if ((browser_agent.match(/Version\/10\.1.*Safari/) &&
                                    !browser_agent.match(/Version\/10\.1\.2.*Safari/))) {
                                $("#popuperror").append(Lang.getString("SafariBroken"));
                                show_errorPopup();
                                return;
                            }
                                
                            RMBTsettings(options);
                        }
                        else if (callback == 'RMBTsync')
                                RMBTsync(options);
                        else if (callback == 'RMBTtestresult') {
                                if (mobile_client_found) {
                                    $('#ndtprogress').hide();
                                }
                                RMBTtestresult(options);
                        }
                        else if (callback == 'RMBThistory')
                                RMBThistory();
                        else if (callback == 'RMBTstatistics')
                                RMBTstatistics();
                        else if (callback == 'RMBTmapfilter')
                                RMBTmapfilter(options);
                        
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    if (typeof TestEnvironment !== 'undefined') {
                        TestEnvironment.getTestVisualization().setStatus('ERROR');
                    }
                        //alert("Error beim requestDataCollector-Abruf, "+xhr.status+", "+thrownError);
                }
        });
}

function RMBTmapfilter(options) {
        cookie_uuid = getCookie("RMBTuuid");
        var terms_accepted = getCookie("RMBTTermsV6");
        
        var json_data = {
                version_name: test_version_name,
                language: selectedLanguage,
                uuid: cookie_uuid,
                type: test_type,
                version_code: test_version_code,
                name: test_name,
                terms_and_conditions_accepted: terms_accepted,
                open_test_uuid: options.open_test_uuid
        };
        
        /*if (window.console && console.log) {
    		console.log(options); //for firebug
  		}*/

        
        $.ajax({
                url: mapProxy + "/tiles/info",
                type: "post",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(json_data),
                success: function(data) {
                        var form_filter = '';
                        //console.log(data.settings[0].mapfilter.mapFilters);
                        $.each(data.mapfilter.mapFilters, function(key1,row1){
                                form_filter += '<div id="filter_'+key1+'" uk-grid>';
                                //form_filter += '<h3>'+key1+'</h3>';
                                $.each(row1, function(key,row){
                                     var filtername = '';
                                     $.each(row.options[0],function(key1,row1){
                                             if (key1 != 'summary' && key1 != 'title' && key1 != 'default')
                                                     filtername = key1;
                                     });
                                     form_filter += '<div class="form_line">';
                                     //form_filter += '<label for="'+filtername+'">'+row.title+'</label>';
                                     form_filter += '<select name="'+filtername+'" id="'+filtername+'" onchange="redrawOverlay();" class="uk-select">';
                                     $.each(row.options,function(key1,row1){
                                             form_filter += '<option value="'+eval('row1.'+filtername)+'"';
                                             //console.log(row1.title+': '+row1.default);
                                             //IE7,IE8 have the word 'default' reserved, so we
                                             //have to check in subscript notation
                                             if (row1.hasOwnProperty('default') && row1['default'] === true) {
                                                    form_filter += ' selected="selected"';
                                             }
                                                     
                                             form_filter += '>'+row1.title+'</option>';
                                                     
                                     });
                                     form_filter += '</select>';
                                     form_filter += '</div>';
                                });
                                form_filter += '</div>';
                                
                        });
                        $('#filter_selector').append(form_filter);
                        
                        
                        
                        var form_auswahl = '';
                        form_auswahl += '<div uk-grid>';
                        form_auswahl += '<div class="uk-width-1-1"><select name="map_options" id="map_options" onchange="redrawOverlay();" class="uk-select "></div>';
                        var default_cardtyp;
                        $.each(data.mapfilter.mapTypes, function(key,row){
                             var auswahlname = '';
                             
                             $.each(row.options[0],function(key1,row1){
                                     if (key1 != 'summary' && key1 != 'title' && key1 != 'default')
                                             auswahlname = key1;
                             });
                             //form_auswahl += '<option value="'+row.options[0].map_options+'">'+row.title+'</option>';
                             $.each(row.options,function(key1,row1){
                                     //form_auswahl += '<option value="'+eval('row1.'+auswahlname)+'"';
                                     form_auswahl += '<option value="'+row1.map_options+'"';
                                     
                                     //if the user opens the map coming from /Opentest, select 'all' by default
                                     if (options.open_test_uuid !== null) {
                                         if (key===3 && key1==0)  {
                                             form_auswahl += 'selected="selected"';
                                             default_cardtyp = row1.map_options;
                                         }
                                         
                                     }
                                     //by default, select first option 
                                     else if (key==0 && key1==0) {
                                             form_auswahl += 'selected="selected"';
                                             default_cardtyp = row1.map_options;
                                     }
                                     form_auswahl += '>'+row.title+' - '+row1.title+'</option>';
                                     
                                     legends[row1.map_options]={
                                                                heatmap_caption_unit:row1.unit,
                                                                heatmap_caption_high:row1.heatmap_captions[1],
                                                                heatmap_caption_low:row1.heatmap_captions[0],
                                                                classification_high:row1.classification[0],
                                                                classification_low:row1.classification[1],
                                                                colors: row1.heatmap_colors,
                                                                heatmap_captions: row1.heatmap_captions
                                                                };
                                             
                             });
                             
                        });
                        form_auswahl += '</select>';
                        form_auswahl += '</div>';
                        $('#auswahl_selector').prepend(form_auswahl);
                        redrawLegend(default_cardtyp);
                        defaultMapFilterV3();
                        
                },
                error: function() {
                        alert("Error beim mapfilters-Abruf");
                }
        });      
}


function RMBTsettings(options) {
        //override control server url, if given
        if (UserConf.overrideControlServer) {
            controlProxy = UserConf.overrideControlServer;
        }

        cookie_uuid = getCookie("RMBTuuid");
        var terms_accepted = getCookie("RMBTTermsV6");
        var terms_and_conditions_accepted_version = (terms_accepted)?terms_version:null;
        
        var json_data = {
                version_name: test_version_name,
                language: selectedLanguage,
                uuid: cookie_uuid,
                type: test_type,
                version_code: test_version_code,
                name: test_name,
                terms_and_conditions_accepted: terms_accepted,
                terms_and_conditions_accepted_version : terms_and_conditions_accepted_version
        };
        /*
        if (window.console && console.log) {
    		console.log(options); //for firebug
  		}
	*/
        
        $.ajax({
                url: controlProxy+"/"+wspath+"/settings",
                type: "post",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(json_data),
                success: function(data) {
                	//console.log("RMBTsettings success");
                	var javaerror = false;
                        if (data.settings[0].uuid) {
                                setCookie("RMBTuuid", data.settings[0].uuid, exdays);
                                uuid = data.settings[0].uuid;
                        }
                        else if (cookie_uuid) {
                                setCookie("RMBTuuid", cookie_uuid, exdays);
                                uuid = cookie_uuid;
                        }
                        else {
                                alert("Keine UUID!");
                                return;
                        }
                        
                                //UUID should now be set
                        if (options === 'jstest' || options === 'jstest_easy') {
                                RMBTjstest(options);
                        }
                        else if (options === 'websocket') {
                                RMBTWebsocketTest(uuid);
                        }
                        else if (options === 'loop') {
                                RMBTLoopTest(uuid);
                        }
                        else if (options === 'certTest') {
                                RMBTCertTest(uuid);
                        }
                        else if (options !== 'verlauf') {
                            var testStartFunction = function() {
                                try {
                                    rmbtApplet.setBrowserInfo(browser_product);

                                    if (options !== 'verlauf') {
                                        rmbtApplet.startTest(uuid);
                                        //set updated coords sometime later in the test
                                        window.setTimeout(function() {
                                            if (options.position !== undefined &&
                                                    options.position !== null &&
                                                    options.position.coords.latitude !== null &&
                                                    options.position.coords.longitude !== null) {
                                                rmbtApplet.setLocation(
                                                        options.position.timestamp,
                                                        options.position.coords.latitude,
                                                        options.position.coords.longitude,
                                                        options.position.coords.accuracy,
                                                        options.position.coords.altitude,
                                                        options.position.coords.heading,
                                                        options.position.coords.speed);
                                            }
                                            else {
                                                coords = getCookie('coords');
                                                if (coords) {
                                                    tmpcoords = JSON.parse(coords);
                                                    rmbtApplet.setLocation(
                                                            tmpcoords['tstamp'],
                                                            tmpcoords['lat'],
                                                            tmpcoords['long'],
                                                            tmpcoords['accuracy'],
                                                            tmpcoords['altitude'],
                                                            tmpcoords['heading'],
                                                            tmpcoords['speed']);
                                                }
                                            }
                                        }, 16000);

                                        TestEnvironment.getTestVisualization().setRMBTTest(rmbtApplet);
                                        TestEnvironment.getTestVisualization().startTest();
                                    }
                                    else {
                                        requestBrowserData('RMBThistory');
                                    }
                                }
                                catch (err) {
                                    console.log(err);
                                    //start_jstest();
                                    TestEnvironment.getTestVisualization().setStatus(TestState.ERROR);
                                    //set_status("JAVAERROR")

                                    //BUT! - maybe Firefox just blocked Java by default and the user has just unblocked it -> check every 2 seconds
                                    window.setTimeout(testStartFunction,1000);
                                }
                            };
                            testStartFunction();
                                
                                
                               
                        }
                        else {
                                //Verlauf
                                requestBrowserData('RMBThistory');
                        }
                        
                        
                },
                error: function() {
                        //alert("Error beim settings-Abruf");
                    //maybe, connectivity problem
                    if (UserConf.overrideControlServer) {
                        UserConf.overrideControlServer = false;
                        UserConf.ipVersion = "default";
                        console.log("resetting preferred IP version");
                        setCookie("RMBTOptions", JSON.stringify(UserConf), 365 * 20 * 24 * 3600);
                    }
                }
        });      
}

/**
 * 
 * Called from Verlauf.js:document.ready()
 * @param {int} testUUID the test uuid
 * @returns {undefined}
 */
function RMBTtestresult(testUUID) {
	
     var json_data = {
                test_uuid: testUUID,
                language: selectedLanguage,
                timezone: test_timezone
        };
        var stateObj = {page: testUUID};
        
        //Push history state if User visits from Verlauf (from Verlauf or Verlauf?asdfasdfasdf or Verlauf#asdfasdfsdf)
        //to enable navigating between old test results
        if (History) 
                //if the user navigates from Verlauf, push a new state to the history (was "Verlauf")
                if (fromTest === false)
                        History.pushState(stateObj,'Detail','/' + selectedLanguage + '/Verlauf?'+testUUID);
                //if the user just conducted a test, replace the current state ("Verlauf#testuuid") by the new state
                //to prohibit from navigating backwards
                else if (fromTest === true)
                        History.replaceState(stateObj,'Detail','/' + selectedLanguage + '/Verlauf?'+testUUID);
        //alert('options: '+options);
        //History.pushState(stateObj,'Detail',options);
     $.ajax({
                url: controlProxy+"/"+wspath+"/testresult",
                type: "post",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(addCapabilities(json_data)),
                success: function(data) {                    
                        //error received from control server
                        if (data.error.length > 0) {
                                $('#code-eingabe').show();
                                $('#code-eingabe').html('<div class="message">'+data.error[0]+'</div>');
                        }
                         else if (data.testresult[0].measurement.length > 0) {
                             
                                //if the user has already entered a zip code or declined to enter one,
                                //show the entered ZIP code or '0'
                                var requestZIPCode = false;
                         	if (data.testresult[0].zip_code || getCookie("RMBTzip") === "0000") {
                                        if (data.testresult[0].zip_code)
                                            setCookie('RMBTzip', data.testresult[0].zip_code, 3600);	
                         		var tmp = Lang.getString('YourPostalCode') + ' <span id="editzip" onclick="show_zippopup(\''+testUUID+'\')" title="' + Lang.getString('clickToEdit') + '">'+data.testresult[0].zip_code+'</span>';
                         		
                                        if (data.testresult[0].zip_code !== undefined)
                                                $('#yourzip').html(tmp);
                         	}
                         	else if (fromTest === true){
                                        //otherwise, prompt the user with a popup, if a test just finished
                         		requestZIPCode = true;		
                         	}
                                
                                //load data for open-test-uuid and request zip code there (so additional checks with geopositioning can be processed)
                                if (requestZIPCode) {
                                    loadOpenTestData(data.testresult[0].open_test_uuid, testUUID);
                                }
                                else {
                                    loadOpenTestData(data.testresult[0].open_test_uuid);
                                }
                                $("#verlauf-detailcontainer .shareMail").attr("href",
                                   "mailto:?subject=" +
                                   encodeURIComponent(data.testresult[0].share_subject)+
                                   "&body=" +
                                   encodeURIComponent(data.testresult[0].share_text));
                                $('#code-eingabe').hide();

                                var tmp = Lang.getString('MeasurementResultFrom');
                                $("#verlauf-result-from").html(
                                    tmp + ' ' + data.testresult[0].time_string +
                                    '<span class="align-right"><a href="https://www.netztest.at/redirect/' +
                                    selectedLanguage + '/help_result" target="_blank">&nbsp;?&nbsp;</a></span>');

                                $("#verlauf-detail").empty();
                                $.each(data.testresult[0].measurement, function(key,row){
                                        var sprite = null;
                                        if (row.classification >= 1 && row.classification <= 4) {
                                            sprite = 'svg-traffic-light-' + row.classification;
                                        }
                                        else {
                                            sprite = 'svg-empty';
                                        }

                                        $('#verlauf-detail').append(
                                                '<tr>' +
                                                '<td class="uk-width-medium@s">'+row.title+'</td>' +
                                                '<td><a href="https://www.netztest.at/redirect/' + selectedLanguage + '/help_result" target="_blank"><i class="svg-icon svg16 ' + sprite + '"></i></a> ' +row.value+'</td>' +
                                                '</tr>'
                                        );
                                });
                                
                                $.ajax({
                                        url: controlProxy+"/"+wspath+"/testresultdetail",
                                        type: "post",
                                        dataType: "json",
                                        contentType: "application/json",
                                        data: JSON.stringify(json_data),
                                        success: function(data) {
                                                //console.log(data);
                                                $('#testresult-detail tbody').empty();
                                                $.each(data.testresultdetail, function(keydetail,detail){
                                                        $('#testresult-detail tbody').append(
                                                                '<tr>' +
                                                                '<td class="uk-width-medium@s">'+detail.title+'</td>' +
                                                                '<td data-label="' + detail.title + '"><span>'+nl2br(detail.value,true)+'</span></td>' +
                                                                '</tr>'
                                                        );
                                                });
                                                
                                        },
                                        error: function() {
                                                alert("Error beim testresultdetail-Abruf");
                                        }
                                }); 
                                
                                $('#verlaufcontainer').css('display','none');
                                $('#verlauf-detailcontainer').css('display','block');
                                $('#h2').html(Lang.getString('TestResult'));
                        }
                        
                },
                error: function() {
                        alert("Error beim testresult-Abruf");
                }
        }); 
     
}

function RMBTsync(options) {
        
        cookie_uuid = getCookie("RMBTuuid");
        var options_value;
        if (options) {
                options_value = $('#'+options).val();  
        }
        var json_data = {
                uuid: cookie_uuid,
                language: selectedLanguage,
                sync_code: options_value
        };
        $.ajax({
                url: controlProxy+"/"+wspath+"/sync",
                type: "post",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(json_data),
                success: function(data) {
                        //console.log(data);
                        if (data.error.length > 0) {
                                $('#code-eingabe').html('<div class="message">'+data.error[0]+'</div>');
                        }
                        else if (data.sync[0].msg_text && data.sync[0].msg_text.length > 0) {
                                $('#code-eingabe').html('<div class="message">'+data.sync[0].msg_text+'</div>');
                                RMBThistory();
                        }
                         else {       
                                $('#code-eingabe').html('<p>'+Lang.getString('YourSyncCode')+': <span class="sync-code">'+data.sync[0].sync_code+'</span></p>');
                        }
                        
                },
                error: function() {
                        alert("Error beim sync-Abruf");
                }
        });  
}

function sendZIP(tid, zip) {
        
        cookie_uuid = getCookie("RMBTuuid");
        
        var json_data = {
                uuid: cookie_uuid,
                test_uuid: tid,
                zip_code: zip
        };
        $.ajax({
                url: controlProxy+"/"+wspath+"/resultUpdate",
                type: "post",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(json_data),
                success: function(data) {
                        //console.log(data);
                },
                error: function() {
                        alert("Error beim resultUpdate-Abruf");
                }
        });  
}

function RMBThistory() {
        cookie_uuid = getCookie("RMBTuuid");
        var json_data = {
                uuid: cookie_uuid,
                language: selectedLanguage,
                timezone: test_timezone,
                devices: test_devices,
                networks: test_networks
        };
        $('#spinner').spin('modal');
        $.ajax({
                url: controlProxy+"/"+wspath+"/history",
                type: "post",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(json_data),
                success: function(data) {
                        var network_type, time_string, speed_upload, ping, speed_download;
                    
                        //console.log(data);
                        if (data.error.length > 0 || data.history.length == 0) {
                                 //var tmp = (selectedLanguage=='de')?'Keine Tests gefunden':'No tests found';
                                 //$('#verlaufcontainer').html('<div class="message">'+tmp+'</div>');
                                 $('table#verlauf').css('display','none');
                        }
                        else {
                                $('#verlauf_tbody').empty();
                                $.each(data.history, function(key,row){
                                var klasse, model, network, time, upload, download, ping;
                                if (key == 0) {
                                       klasse = "current-result";
                               }
                                else {
                                       klasse = "past-result";
                               }

								if ( row.model == null) {
									model = "-";
								}
								else {
									model = row.model
								}
								
								if ( row.network_type == null) {
									network_type = "-";
								}
								else {
									network_type = row.network_type
								}
								
								if ( row.time_string == null) {
									time_string = "-";
								}
								else {
									time_string = row.time_string
								}
								
								if ( row.speed_upload == null) {
									speed_upload = "-";
								}
								else {
									speed_upload = row.speed_upload
								}
								
								if ( row.speed_download == null) {
									speed_download = "-";
								}
								else {
									speed_download = row.speed_download
								}
								
								if ( row.ping_shortest == null) {
									ping = "-";
								}
								else {
									ping = row.ping;
								}
   								
								//History.pushState({uid:'+row.uid+'}, \'RTR - Messergebnis '+time_string+'\', \'?test='+row.uid+'\'); 
                                
                                $('#verlauf_tbody').append(
                                        '<tr class="'+klasse+'">' +
                                        '<td onclick="requestBrowserData(\'RMBTtestresult\',\''+row.test_uuid+'\');">'+model+'</td>' +
                                        '<td onclick="requestBrowserData(\'RMBTtestresult\',\''+row.test_uuid+'\');">'+network_type+'</td>'+
                                        '<td onclick="requestBrowserData(\'RMBTtestresult\',\''+row.test_uuid+'\');">'+time_string+'</td>' +
                                        '<td class="uk-text-right" onclick="requestBrowserData(\'RMBTtestresult\',\''+row.test_uuid+'\');">'+speed_download+'</td>' +
                                        '<td class="uk-text-right" onclick="requestBrowserData(\'RMBTtestresult\',\''+row.test_uuid+'\');">'+speed_upload+'</td>' +
                                        '<td class="uk-text-right" onclick="requestBrowserData(\'RMBTtestresult\',\''+row.test_uuid+'\');">'+ping+'</td>' +
                                        '</tr>'
                                  );
                                });
                                $('#h2').html(Lang.getString('History'));

                            var triggerDownloadForm = function(format) {
                                $("#download-link-form input").remove();
                                var allTestUuids=[];
                                $(data.history).each(function(i, obj) {
                                    allTestUuids.push("T" + obj.test_uuid);
                                });

                                $("#download-link-form").append('<input type="hidden" name="test_uuid" value="' + decodeURIComponent(allTestUuids.join(",")) + '" />');
                                if (format === 'pdf') {
                                    $("#download-link-form").attr("action", statisticProxy + "/" + statisticpath + "/export/pdf");
                                }
                                else {
                                    $("#download-link-form").append("<input type='hidden' name='format' value='" + format + "' />");
                                    $("#download-link-form").append("<input type='hidden' name='max_results' value='" + Math.min(10000,data.history.length) + "' />");
                                    $("#download-link-form").attr("action", statisticProxy + "/" + statisticpath + "/opentests/search");
                                }

                                $("#download-link-form").submit();
                            }

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

                        }
                        if (cookie_uuid != null && cookie_uuid != '') {
                        	$('#clientUUID').html("Client UUID: "+ cookie_uuid);
                        }
                        $('#spinner').spin('modal');
                },
                error: function() {
                	$('#spinner').spin('modal');
                        alert("Error beim history-Abruf");
                }
        });       
}

/**
 * Tausendertrennzeichen
 * @param {numeric} number
 * @returns {String} the formatted number
 */
function Trenner(number) {
        number = '' + number;
        if (number.length > 3) {
                var mod = number.length % 3;
                var output = (mod > 0 ? (number.substring(0,mod)) : '');
                for (i=0 ; i < Math.floor(number.length / 3); i++) {
                        if ((mod == 0) && (i == 0))
                        output += number.substring(mod+ 3 * i, mod + 3 * i + 3);
                        else {
                                output+= '.' + number.substring(mod + 3 * i, mod + 3 * i + 3);
                        }
                }
                return (output);
        }
        else return number;
}

var previousStatisticsCountry = '';
/**
 * Displays the statistics in Statistik.html
 * in the designated tables
 * called by requestBrowserData
 */
function RMBTstatistics() {
	var network_type_group = $('#statistik_network_type_group_form_line');
        if ($('#statistik_type').val() == 'mobile')
                network_type_group.show();
        else
                network_type_group.hide();
        cookie_uuid = getCookie("RMBTuuid");
        var country = getParam("country");//$("#country").val();//("country");
        if (!country) {
            country = $("#country").val();
        }

        var province = ($("#province").val());
        (province === 'null') ? province = null : province = parseInt(province);

        if (country !== previousStatisticsCountry && country !== 'null' && country !== 'AT') {
            previousStatisticsCountry = country;
            //Standard values
            $('#statistik_duration').val($("#statistik_duration_default_world").val());
            $('#statistik_quantile').val(0.5);
            $('#statistik_location_accuracy').val(-1);
            $('#statistik_network_type_group').val("all");

            //hide provinces
            $("#province").hide();
            province = null;
        }
        //Austrian values
        else if (country !== previousStatisticsCountry && (country === 'null' || country === 'AT')) {
            previousStatisticsCountry = country;    
            $('#statistik_duration').val($("#statistik_duration_default_at").val());
            $('#statistik_quantile').val(0.5);
            $('#statistik_location_accuracy').val(2000);
            $('#statistik_network_type_group').val("all");

            //show provinces
            $("#province").show();
        }

        //end date field
        var end_date = $("#statistik_enddate").val();
        var end_date_string = null;
        if (end_date !== undefined && end_date !== null && end_date !== "") {
            end_date = moment(end_date).endOf("day").utc();
            end_date_string = end_date.format("YYYY-MM-DD HH:mm:ss");
        }
        else {
            end_date = null;
        }
        
        var json_data = {
                language: selectedLanguage,
                timezone: test_timezone,
                type: $('#statistik_type').val(),
                duration: $('#statistik_duration').val(),
                quantile: $('#statistik_quantile').val(),
                network_type_group: $('#statistik_network_type_group').val(),
                max_devices: 100,
                location_accuracy: $('#statistik_location_accuracy').val(),
                country: (country?country:null),
                province: province,
                end_date: end_date_string
        };
        if (userServerSelection>0) {
            json_data['user_server_selection'] = userServerSelection;
        }
        
        $('#statistics_container').spin();
        $.ajax({
                url: statisticProxy+"/"+statisticpath+"/statistics",
                type: "post",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(addCapabilities(json_data)),
                success: function(data) {
                        $('#statistics_container').spin();

                        //countries
                        //only once!
                        if ($("#country option").length === 1) {
                            data.countries.sort(function(a,b) {
                                if (Lang.getString("countries")[a.toLowerCase()] < Lang.getString("countries")[b.toLowerCase()]) {
                                    return -1;
                                }
                                else {
                                    return 1;
                                }
                            });
                            $.each(data.countries, function(index, value) {
                                if (value === 'AT') return;
                                $("#country").append('<option value="' + value + '">' + Lang.getString("countries")[value.toLowerCase()] + "</option>");
                            });

                            if (browser_country_geoip) {
                                if (browser_country_geoip.toUpperCase() !== 'AT' && data.countries.indexOf(browser_country_geoip.toUpperCase()) >= 0) {
                                    $("#country").val(browser_country_geoip.toUpperCase());
                                    RMBTstatistics();
                                }
                            }
                            else {
                                RMBTstatistics();
                            }
                        }

                        //calculate open-data-search-parameters
                        var opendataParams = {};
                        if ($('#statistik_network_type_group').val() === "2G" || $('#statistik_network_type_group').val() === "3G" ||
                            $('#statistik_network_type_group').val() === "4G" || $('#statistik_network_type_group').val() === "5G")
                            opendataParams["cat_technology"] =$('#statistik_network_type_group').val();
                        
                        if ($('#statistik_type').val() === "wifi")
                            opendataParams["cat_technology"] = "WLAN";
                        
                        if ($('#statistik_type').val() === "browser")
                            opendataParams["cat_technology"]="LAN";

                        if ($("#statistik_type").val() === 'mobile') {
                            opendataParams["mobile_provider_name"] = "*";
                        }

                        //set country geoip if not Austria
                        if (country && country !== 'null' && country !== 'AT' && country !== 'at') {
                            opendataParams['country_geoip'] = country.toLowerCase();
                            delete opendataParams["mobile_provider_name"]; //as there is no mapping on t.mobile_provider_id
                        }

                        if ($('#statistik_location_accuracy').val() > 0) {
                            opendataParams["loc_accuracy"] = [">0", "<" + $('#statistik_location_accuracy').val()];
                        }
                        if (province !== null) {
                            opendataParams["gkz"] = [">" + province*10000, "<"  + (((province+1)*10000)-1)];
                        }
                        
                        if (end_date === null) {
                            var now = moment();
                            var then =  moment(now).subtract($('#statistik_duration').val(),"days").add(1,"milliseconds");
                            opendataParams["time"] = [">" + then.utc().format("YYYY-MM-DD HH:mm:ss"), "<" + now.utc().format("YYYY-MM-DD HH:mm:ss")];
                        } 
                        else {
                            //adjust begin date to match
                            var begin_date =  moment(end_date.toDate()).subtract($('#statistik_duration').val(),"days").add(1,"milliseconds").utc();
                            opendataParams["time"] = [">" + begin_date.format("YYYY-MM-DD HH:mm:ss"), "<"+  end_date.format("YYYY-MM-DD HH:mm:ss")];
                        }

                        opendataParams["pinned"] = true;

                        //set for provider sums
                        data.providers_sums.query_opendata = jQuery.param(opendataParams).replace(/\+/g,"%20"); //still needed in jQuery 1.8.2opendataParams;
                    
                        //console.log(data);
                        var down_green, down_yellow, down_red, up_green, up_yellow, up_red, ping_green, ping_yellow, ping_red, signal_green, signal_yellow, signal_red, sum_count, sum_down, sum_up, sum_ping, signalDetailDiv, model;
                        $('#statistik_provider_body').empty();
                        $('#statistik_provider_foot').empty();
                        $('#statistik_provider_short_body').empty();
                        $('#statistik_provider_short_foot').empty();
                        $('#statistik_provider_captions_body').empty();
                        $('#statistik_provider_captions_foot').empty();

                        //generate open data links
                        $.each(data.providers, function(key, row) {
                            var opentestsProviderParams = jQuery.extend({}, opendataParams);
                            if (row.asn !== undefined) {
                                opentestsProviderParams["asn"] = row.asn;
                                opentestsProviderParams["public_ip_as_name"] = row.name;
                                opentestsProviderParams["country_geoip"] = country.toLowerCase();
                            }
                            else if (row.sim_mcc_mnc !== undefined) {
                                opentestsProviderParams["sim_mcc_mnc"] = row.sim_mcc_mnc;
                            }
                            else if ($("#statistik_type").val() === 'mobile') {
                                opentestsProviderParams["mobile_provider_name"] = row.name;
                            }
                            else {
                                opentestsProviderParams["provider_name"] = row.name;
                            }
                            row.query_opendata = jQuery.param(opentestsProviderParams).replace(/\+/g,"%20"); //still needed in jQuery 1.8.2
                        });

                        var resultTemplate = Handlebars.compile($("#statisticsTemplate").html());

                        //generate tables
                        var generatedHtml = resultTemplate($.extend(data, {
                            id:"statistik_provider"
                        }));
                        $("#statistik_provider_container").html(generatedHtml);

                        generatedHtml = resultTemplate($.extend(data, {
                            id: "statistik_provider_short",
                            useShortNames: true
                        }));
                        $("#statistik_provider_short_container").html(generatedHtml);

                        generatedHtml = resultTemplate($.extend(data, {
                            id:"statistik_provider_captions",
                            onlyCaptions: true
                        }));
                        $("#statistik_provider_captions_container").html(generatedHtml);

                        adjustTablesToWindowSize();
                        
                        //---------------Devices Start
                        var break_devices_after = 10;
                        var current_device_count = 0;
                        
                        $('#statistik_devices_body').empty();
                        $('#statistik_devices_foot').empty();
                        //$('#statistik').append('<tbody>');
                        $.each(data.devices, function(key,row){
                                var opentestsProviderParams = jQuery.extend({}, opendataParams);

                                //get if only mobile tests are evaluated or all tests
                                if ($("#statistik_type").val() === 'mobile') {
                                    opentestsProviderParams['mobile_provider_name']='*';
                                }
                                if (country && country !== 'null' && country !== 'AT' && country !== 'at') {
                                    delete opentestsProviderParams["mobile_provider_name"]; //as there is no mapping on t.mobile_provider_id
                                    delete opentestsProviderParams["provider_name"];

                                    //get if only mobile tests are evaluated or all tests
                                    if ($("#statistik_type").val() === 'mobile') {
                                        opentestsProviderParams["cat_technology"]="!WLAN"; //good 80/20 solution
                                    }
                                }
                            
                                current_device_count++;
                            
                                down_green = row.down_green*100;
                                if (down_green < 100)
                                        down_green = down_green.toPrecision(2);
                                down_yellow = row.down_yellow*100;
                                if (down_yellow < 100)
                                        down_yellow = down_yellow.toPrecision(2);
                                down_red = row.down_red*100;
                                if (down_red < 100)
                                        down_red = down_red.toPrecision(2);
                                up_green = row.up_green*100;
                                if (up_green < 100)
                                        up_green = up_green.toPrecision(2);
                                up_yellow = row.up_yellow*100;
                                if (up_yellow < 100)
                                        up_yellow = up_yellow.toPrecision(2);
                                up_red = row.up_red*100;
                                if (up_red < 100)
                                        up_red = up_red.toPrecision(2);
                                ping_green = row.ping_green*100;
                                if (ping_green < 100)
                                        ping_green = ping_green.toPrecision(2);
                                ping_yellow = row.ping_yellow*100;
                                if (ping_yellow < 100)
                                        ping_yellow = ping_yellow.toPrecision(2);
                                ping_red = row.ping_red*100;
                                if (ping_red < 100)
                                        ping_red = ping_red.toPrecision(2);
                                quantile_down = (row.quantile_down/1000);
                                quantile_down = quantile_down.formatNumber(getSignificantDigits(quantile_down));
                                
                                quantile_up = row.quantile_up/1000;
                                quantile_up = quantile_up.formatNumber(getSignificantDigits(quantile_up));
                                
                                quantile_ping = Math.round(row.quantile_ping/1000000);
                                if (typeof row.model == 'undefined')
                                	model = '-';
                                else model = row.model;

                                opentestsProviderParams["model"] = model;
                                
                                $('#statistik_devices_body').append(
                                        '<tr' + ((current_device_count > break_devices_after)?' style="display:none;"' : '') + '>'+
                                        '<td>'+model+'</td>'+ //link to open-data
                                        '<td class="uk-text-right"><div>'+quantile_down+' ' + Lang.getString('Mbps')+
                                        '</div></td>'+
                                        '<td class="uk-text-right"><div>'+quantile_up+' ' + Lang.getString('Mbps')+
                                        '</div></td>'+
                                        '<td class="uk-text-right"><div>'+quantile_ping+' ms'+
                                        '</div></td>'+
                                        '<td class="uk-text-right uk-table-link"><a href="Opentests?' + jQuery.param(opentestsProviderParams).replace(/\+/g,"%20") + '">'+row.count.formatNumber()+'</a></td>'+
                                        '</tr>'
                                    );
                                        
                                //link for showing more devices if they are hidden
                                if (current_device_count === break_devices_after) {
                                    $('#statistik_devices_foot').append('<tr id="showMoreDevices"><td colspan="5">' +
                                            '<a href="#" onclick="$(\'#statistik_devices_body tr\').show();$(\'#showMoreDevices\').hide();return false;">' + Lang.getString('showMoreDevices') + '</a>' +
                                            '</td></tr>');
                                }
                                                                                                                                                                       
                        });
                        
                        if (data.devices.length === 0) {
                            //no providers found for the current selection
                            $('#statistik_devices_foot').append(
                                    '<tr>' +
                                    '<th colspan="5">' + Lang.getString('NoDevicesFound') + '</th>' +
                                    '</tr>');
                        }

                        //--------------Devices End
                        
                        
                        
                        //$('#statistik').append('</tbody>');

                        $("#statistik_provider").tablesorter({
                            headers:
                                {
                                    0 : {sorter: 'text'},
                                    1 : {sorter: 'digit' },
                                    2 : {sorter: 'digit' },
                                    3 : {sorter: 'digit' },
                                    4 : {sorter: 'digit' },
                                    5 : {sorter: 'own' }

                                }
                        });
                        $("#statistik_devices").tablesorter({
                            headers:
                                {
                                    0 : {sorter: 'text'},
                                    1 : {sorter: 'digit' },
                                    2 : {sorter: 'digit' },
                                    3 : {sorter: 'digit' },
                                    4 : {sorter: 'own' }
                                }
                        });

                        $("table").trigger("update"); 
                        $(".quantile").hover(
                                function(){
                                        $(this).css("background-color","#CCC");
                                        $(".quantile_details", this).css("display","block");          
                                },
                                function(){
                                        $(this).css("background-color",""); //only remove, dont reset (sum rows have default bg other than #fff)
                                        $(".quantile_details", this).css("display","none");    
                                }
                        );
                

                        
                        $('.headerSortUp').removeClass('headerSortUp');
                        $('.headerSortDown').removeClass('headerSortDown');
                        
                },
                error: function() {
                        $('#statistics_container').spin();
                        $("#statistics_container").hide();
                        $("#statistics_failure").slideDown();
                }
        });       
}

function start_jstest() {
	$("#noJavaWarning").html('<p>' + Lang.getString('NoJavaAvailable') + '</p>');
        

        
	setCookie("RMBTndt", '0', 365 * 20 * 24 * 3600);
	requestBrowserData('RMBTsettings','jstest');
}

/**
 * Called, if the browser does not support the canvas-element
 */
function start_jstest_easy() {
	$(".main-article").prepend('<p>' + Lang.getString('BrowserOutdated') + '</p>');
	setCookie("RMBTndt", '0', 365 * 20 * 24 * 3600);
	requestBrowserData('RMBTsettings','jstest_easy');
}

function start_websocket() {
        requestBrowserData('RMBTsettings','websocket');
}

function RMBTWebsocketTest(uuid) {
    var config = new RMBTTestConfig(selectedLanguage, controlProxy, wspath);
    config.uuid = uuid;
    config.doPingIntervalMilliseconds = ping_interval_milliseconds;

    //explicit ip version
    if (UserConf.ipVersion === "ipv4" || UserConf.ipVersion === "ipv6") {
        config.additionalRegistrationParameters["protocol_version"] = UserConf.ipVersion;
    }
    var numThreads = 0;
    if (UserConf.fixedDownloadThreads) {
        config.downloadThreadsLimitsMbit = {
            0: UserConf.fixedDownloadThreads
        };
        numThreads = UserConf.fixedDownloadThreads;
    }
    if (UserConf.fixedUploadThreads) {
        config.uploadThreadsLimitsMbit = {
            0: UserConf.fixedUploadThreads
        }
        numThreads = Math.max(numThreads, UserConf.fixedUploadThreads);
    }
    if (numThreads > 0) {
        config.additionalRegistrationParameters["num_threads"] = numThreads;
    }


    //override userServiceSelection if server was selected to just affect the test itself
    if (UserConf.preferredServer !== "default") {
        userServerSelection = true;
    }

    var controlServerConnection = new RMBTControlServerCommunication(config);
    var websocketTest = new RMBTTest(config, controlServerConnection);


    websocketTest.onError(function (msg) {
        if (fallbackOnJS === true) {
            //something failed
            start_jstest();
        }
        else {
            if (msg === RMBTError.NOT_SUPPORTED) {
                $("#popuperror").empty();
                $("#popuperror").append('<p>' + Lang.getString('BrowserOutdated') + '</p>');
                show_errorPopup();
            }
            else {
                TestEnvironment.getTestVisualization().setStatus(TestState.ERROR);
            }
            //popup is handled by Test Vizualization
        }
    });

    TestEnvironment.getTestVisualization().setRMBTTest(websocketTest);
    TestEnvironment.getTestVisualization().startTest(uuid);
    websocketTest.startTest();
}

function RMBTjstest(options) {
	cookie_uuid = getCookie("RMBTuuid");
        var now = new Date().getTime(); 
        
        var json_data = {
                version: test_version_name,
                language: selectedLanguage,
                uuid: cookie_uuid,
                type: test_type,
                version_code: test_version_code,
                client: client_name,
                timezone: test_timezone,
                time: now
        };
        
        /*if (window.console && console.log) {
    		console.log(options); //for firebug
  		}*/

        
        $.ajax({
                url: controlProxy+"/"+wspath+"/testRequest",
                type: "post",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(json_data),
                success: function(data) {
                	//console.log(data);	
			var jstest = "../js/test/jstest.js";
			$.getScript(jstest, 
				function() {
					//if (options=="jstest_easy") {
					//	$("#infogeo br").detach();	
					//}
					//console.log("options in RMBTjstest: "+options);
					//infostatus = document.getElementById("infostatus");
//					var show_infoip = data.client_remote_ip;
//					if (!show_infoip || show_infoip == 'undefined') show_infoip = '-';
//					//$('#infoip').html(show_infoip);
//					var show_infoprovider = data.provider;
//					if (!show_infoprovider || show_infoprovider == 'undefined') show_infoprovider = '-';
//					//$('#infoprovider').html(show_infoprovider);
//					var show_infoserver = data.test_server_name;
//					if (!show_infoserver || show_infoserver == 'undefined') show_infoserver = '-';
					//$('#infoserver').html(show_infoserver);
                                        
					start_all = new Date().getTime();
					start_download = new Date().getTime();
					test_token = data.test_token;
					testUUID = data.test_uuid;
                                        
                                        var adapter = new JSTestadapter();
                                        TestEnvironment.getTestVisualization().setRMBTTest(adapter);
                                        TestEnvironment.getTestVisualization().updateInfo(
                                                data.test_server_name,
                                                data.client_remote_ip,
                                                data.provider,
                                                testUUID
                                        )
                                        TestEnvironment.getTestVisualization().startTest();
                                        
                                        
					//start the test
					TestPing(1);
					
				}
			);
			
		},
                error: function() {
                        //alert("Error beim testrequest-Abruf");
                }
        });    
}



function RMBTjstest_result(token,options,callback) {
	cookie_uuid = getCookie("RMBTuuid");
	cookie_zip = getCookie("RMBTzip");
        var now = new Date().getTime() 
        var ping_shorttest = minping * 1000000000;
        var nsec_dl = diff_dl_messung *1000000000;
        var nsec_ul = diff_ul_messung *1000000000;
        var speed_dl =  bytes_dl_messung*8/diff_dl_messung/1000;
        var speed_ul =  bytes_ul_messung*8/diff_ul_messung/1000;
        /*if (curGeoPos && curGeoPos.coords.latitude && curGeoPos.coords.longitude) {
		var loc = {
			geo_lat: curGeoPos.coords.latitude,
			geo_long:curGeoPos.coords.longitude,
			accuracy:curGeoPos.coords.accuracy,
			altitude:curGeoPos.coords.altitude,
			bearing:curGeoPos.coords.heading,
			speed:curGeoPos.coords.speed,
			tstamp: curGeoPos.timestamp
		};
        }
        else {
        	coords = getCookie('coords');
		if (coords) {
			tmpcoords = JSON.parse(coords);
			var loc = {
				geo_lat: tmpcoords['lat'],
				geo_long:tmpcoords['long'],
				accuracy:tmpcoords['accuracy'],
				altitude:tmpcoords['altitude'],
				bearing:tmpcoords['heading'],
				speed:tmpcoords['speed'],
				tstamp: tmpcoords['tstamp']
			};
		}		
        }*/
        var locs = TestEnvironment.getGeoTracker().getResults();
        var geolocations = (locs.length>0)?locs:null;
        
        var json_data = {
        	client_version: test_version_name,
        	client_language: selectedLanguage,
                client_uuid: cookie_uuid,
                type: test_type,
                version_code: test_version_code,
                client_name: client_name,
                timezone: test_timezone,
                time: now,
                test_token: token,
                test_bytes_download: bytes_dl_messung,
                test_bytes_upload: bytes_ul_messung,
                test_nsec_download: nsec_dl,
                test_nsec_upload: nsec_ul,
                test_num_threads: 1,
                test_speed_download: speed_dl,
                test_speed_upload: speed_ul,
                test_ping_shortest: ping_shorttest, 
                zip_code: cookie_zip,
                platform: "JS",
                model: browser_product,
                product: browser_product,
                network_type: 98,
        	geoLocations: geolocations
        };
        var json_string = JSON.stringify(json_data);
        /*if (window.console && console.log) {
    		console.log(options); //for firebug
  		}*/

        
        $.ajax({
                url: controlProxy+"/"+wspath+"/result",
                type: "post",
                dataType: "json",
                contentType: "application/json",
                data: json_string,
                success: function(data) {
                	//console.log(data);
                    //var forwardUrl = '/' + selectedLanguage + '/Verlauf#';
                    //forwardUrl += testUUID;
                    //setTimeout(function() {window.location.href = forwardUrl}, 2000);
                    if (callback !== undefined) {
                        callback()
                    }   
                },
                error: function() {
                        //alert("Error beim testrequest-Abruf");
                }
        });			
}


function log10(val) {
  return Math.log(val) / Math.LN10;
}
function getParam(variable){ 
     var query = window.location.search.substring(1);  
     var vars = query.split("&"); 
      for (var i=0;i<vars.length;i++) {   
            var pair = vars[i].split("=");  
            if(pair[0] == variable){return pair[1];}
       }       return(false);
}

/**
 * load the User Configuration into the global "UserConf" and return it
 * @returns {UserConf}
 */
function loadUserConfiguration() {
    var cookie = getCookie('RMBTOptions');
    if (cookie) {
        UserConf = JSON.parse(cookie);
        preferredTest = UserConf.preferredTest;
    }
    else {
        UserConf.preferredTest = preferredTest;
    }
    return UserConf;
}
//load as soon as possible
loadUserConfiguration();


/**
 * converts a time from open-data (utc) to local time
 * @param {String} time
 * @returns {String}
 */
function formatOpenDataDateToLocalTime(time) {
    var val = time; //1234-67-90 23:56:89 //0123-56-89 12:45:78
    var d = new Date();
    d.setUTCFullYear(val.substr(0,4));
    d.setUTCMonth((parseInt(val.substr(5,2))-1));
    d.setUTCDate(parseInt(val.substr(8,2)));
    //Date.setUTCHours(hour,min,sec,millisec)
    d.setUTCHours(val.substr(11,2), val.substr(14,2), val.substr(17,2));
    
    return d.getFullYear() + "-" + pad(d.getMonth()+1,2) + "-" + pad(d.getDate(),2) + " " +  pad(d.getHours(),2) + ":" + pad(d.getMinutes(),2) +":" + pad(d.getSeconds(),2);

}

/**
 * adds leading zeros to a number
 * http://www.electrictoolbox.com/pad-number-zeroes-javascript/
 * @param {int} number
 * @param {int} length
 * @returns {String} the formatted string
 */
function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
   
    return str;
}

$(document).ready(function() {
        selectedLanguage = getLanguageFromURL();                   
});



/**
 * Prints the given test-data into the table "verlauf"
 * @param {json} testdata json-result representing the test-data from the control server
 * @param {boolean} showUnits true, if the units for the results should be shown
 * @return {String} The table row including the wrapping tr-elements
 */
function getOpenDataRow(testdata, showUnits) {      
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
        else  {
            return 3;
        }
    };
    
    var link = "<a href=\"Opentest?" + testdata.open_test_uuid + "\">";
    if (showUnits === undefined) {
        showUnits = false;
    }
    
    //generate table row in javascript for more speed :-(
    var row = "<tr>";

    //image
    var img = $("<i class='svg-icon svg14'></i>");
    var classification = 3;
    var svgType = "";
    if (testdata.platform.indexOf('WLAN') !== -1) {
        svgType = "wlan4";
    }
    else if (testdata.platform.indexOf('LAN') !== -1) {
        svgType = "browser";
    }
    else if (testdata.platform.indexOf('/') !== -1) {
        svgType = "mobile";
    }
    else if (testdata.platform.indexOf('5G') !== -1) {
        svgType = "5g";
    }
    else if (testdata.platform.indexOf('4G') !== -1) {
        svgType = "4g";
    }
    else if (testdata.platform.indexOf('3G') !== -1) {
        svgType = "3g";
    }
    else if (testdata.platform.indexOf('2G') !== -1) {
        svgType = "2g";
    }

    if (testdata.hasOwnProperty('signal_classification')) {
        svgType += "-" + (testdata.signal_classification);
    }
    else if (testdata.platform.indexOf('WLAN') !== -1) {
        svgType = "wlan3";
    }
    else if (testdata.platform.indexOf('LAN') == -1) {
        svgType += "-0";
    }

    img.addClass("svg-" + svgType);

    //time
    var val = testdata.time; //1234-67-90 23:56
    var d = new Date(val.substr(0,10));
    d.setUTCHours(val.substr(11,2), val.substr(14,2));
    
    row += "<td class='time'>" +  link + img[0].outerHTML + formatOpenDataDateToLocalTime(testdata.time) + "</a></td>";
        
    //environment info
    //position marker
    var position_marker = "";
    if (testdata.long !== null) {
        var image = (testdata.loc_accuracy<=min_accuracy_for_showing_map)?"svg-marker":"svg-marker-line";
        position_marker = "<i class='svg-icon svg14 " + image + "'></i>";
    }
    row += "<td class='test-platform'>" + link +  position_marker + infoFormatter(testdata.model, testdata.platform, testdata.provider_name) + "</a></td>";
    
    //down
    row += "<td class='test-download uk-text-right'>" + link + (testdata.download_kbit / 1000).formatNumber(getSignificantDigits(testdata.download_kbit / 1000)) + (showUnits ? '&nbsp;' + Lang.getString('Mbps') : '') + "</a></td>";
    
    //up
    row += "<td class='test-upload uk-text-right'>" + link + (testdata.upload_kbit / 1000).formatNumber(getSignificantDigits(testdata.upload_kbit / 1000))+ (showUnits ? '&nbsp;' + Lang.getString('Mbps') : '') + "</a></td>";
    
    //ping
    if (testdata.ping_ms >= 0 && testdata.ping_ms !== null) {
        row += "<td class='test-ping uk-text-right'>" + link + (testdata.ping_ms).formatNumber(getSignificantDigits(testdata.ping_ms))+ (showUnits ? '&nbsp;' + Lang.getString('ms') : '') + "</a></td>";
    }
    else {
        row += "<td class='test-ping uk-text-right'>" + link + "-</a></td>";
    }
    
    //signal
    var val_dbm = testdata.signal_strength;
    var val_lte = testdata.lte_rsrp;
    if (val_dbm !== null) {
        row += "<td class='test-network-signal uk-text-right'>" + link + Math.round(val_dbm)+ (showUnits ? '&nbsp;' + Lang.getString('dBm') : '') + "</a></td>";
    }
    else if (val_lte !== null) {
        row += "<td class='test-network-signal uk-text-right'>" + link + Math.round(val_lte)+ (showUnits ? ' ' + Lang.getString('dBm') : '') + "</a></td>";
    }
    else {
        row += "<td class='test-network-signal uk-text-right'>" + link + "-</a></td>";
    }        
    
    
    row += "</tr>\n";
    var rowObj = $(row);
    rowObj.data(testdata);
    
    return rowObj;
}

/**
* Formats model, platform and provider in a nice string like this:
* Platform (Model), Provider
* @param {String} model
* @param {String} platform
* @param {String} provider
* @returns {String}
*/
function infoFormatter(model, platform, provider) {
    var MAX_PROVIDER_LENGTH = 42;
    if (provider !== null && provider.length-3 > MAX_PROVIDER_LENGTH)
        provider = provider.substr(0, MAX_PROVIDER_LENGTH) + "...";

    var nullFkt = function(text) {
        if (text === null || $.trim(text) === "")
            return null;
        else
            return text;
    };

    var modelString = "";
    platform = nullFkt(platform);
    provider = nullFkt(provider);

    if (model !== null && platform !== null) {
        modelString = model + " (" + $.trim(platform) + ")";
    }
    else if (model === null && platform !== null) {
        modelString = platform;
    }
    else if (model !== null && platform === null) {
        modelString = model;
    }

    if (modelString !== "" && provider !== null) {
        modelString = provider + ", " + modelString;
    }
    else if (modelString === "" && provider !== null) {
        modelString = provider;
    }

    //escape html chars to prohibit XSS
    modelString = modelString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return modelString;
}

/**
 * adds additional API parameters
 * @param {Object} request the object that will get additional API parameters
 */
function addCapabilities(request) {
	request["capabilities"] = getCapabilities();
	return request;
}

/**
 * additional API parameters as query parameter
 */
function getCapabilitiesAsQueryParam() {
    return "capabilities=" + encodeURIComponent(JSON.stringify(getCapabilities()));
}

/** 
 * additional API parameters
 */
function getCapabilities() {
	return {
		"classification": {
			"count": 4
		}
	};
}

//i18n class
var Lang = new Object();

/**
 * Gets the translated string for the given key
 * if the key is not found, the key itself is returned
 * @param {String} the key
 * @returns {String} the translation
 */
Lang.getString = function(key) {
    if (Lang.langMap[key] === undefined) {
        console.error("No lang entry found for key '" + key + "'");
        return key;
    }
    return Lang.langMap[key];
};

/**
 * Set the map for the current language
 * @param {Map} map for the current language in form {'key' => 'value', ...}
 */
Lang.setStrings  = function(map) {
    Lang.langMap = map;
};


/**
 * Formats a number
 * http://stackoverflow.com/questions/9318674/javascript-number-currency-formatting
 * @param {Number} decimals the number of decimal places
 * @param {String} thouSeperator the thousands seperator
 * @param {String} decSeperator the decimal seperator
 * @returns {String} the formatted number
 */
Number.prototype.formatNumber = function(decimals,thouSeperator,decSeperator) {
    //Standard values
    if (decimals === undefined) {
        decimals = 0;
    }
    if (thouSeperator === undefined) {
        thouSeperator = Lang.getString('thousandsSeperator');
    }
    if (decSeperator === undefined) {
        decSeperator = Lang.getString('decimalSeperator');
    }
    
    var n = this;
            
    if (decimals < 0) {
        var nDecimals = Math.abs(decimals);
        nDecimals = Math.pow(10,nDecimals);
        n = Math.round(n/nDecimals)*nDecimals;
        decimals = 0;
    }
    
    sign = n < 0 ? "-" : "",
    i = parseInt(n = Math.abs(+n || 0).toFixed(decimals)) + "",
    j = (j = i.length) > 3 ? j % 3 : 0;
    return sign + (j ? i.substr(0, j) + thouSeperator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeperator) + (decimals ? decSeperator + Math.abs(n - i).toFixed(decimals).slice(2) : "");

};



// http://spin.js.org/#v2.3.2 (https://github.com/fgnass/spin.js)
!function(a,b){"object"==typeof module&&module.exports?module.exports=b():"function"==typeof define&&define.amd?define(b):a.Spinner=b()}(this,function(){"use strict";function a(a,b){var c,d=document.createElement(a||"div");for(c in b)d[c]=b[c];return d}function b(a){for(var b=1,c=arguments.length;c>b;b++)a.appendChild(arguments[b]);return a}function c(a,b,c,d){var e=["opacity",b,~~(100*a),c,d].join("-"),f=.01+c/d*100,g=Math.max(1-(1-a)/b*(100-f),a),h=j.substring(0,j.indexOf("Animation")).toLowerCase(),i=h&&"-"+h+"-"||"";return m[e]||(k.insertRule("@"+i+"keyframes "+e+"{0%{opacity:"+g+"}"+f+"%{opacity:"+a+"}"+(f+.01)+"%{opacity:1}"+(f+b)%100+"%{opacity:"+a+"}100%{opacity:"+g+"}}",k.cssRules.length),m[e]=1),e}function d(a,b){var c,d,e=a.style;if(b=b.charAt(0).toUpperCase()+b.slice(1),void 0!==e[b])return b;for(d=0;d<l.length;d++)if(c=l[d]+b,void 0!==e[c])return c}function e(a,b){for(var c in b)a.style[d(a,c)||c]=b[c];return a}function f(a){for(var b=1;b<arguments.length;b++){var c=arguments[b];for(var d in c)void 0===a[d]&&(a[d]=c[d])}return a}function g(a,b){return"string"==typeof a?a:a[b%a.length]}function h(a){this.opts=f(a||{},h.defaults,n)}function i(){function c(b,c){return a("<"+b+' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">',c)}k.addRule(".spin-vml","behavior:url(#default#VML)"),h.prototype.lines=function(a,d){function f(){return e(c("group",{coordsize:k+" "+k,coordorigin:-j+" "+-j}),{width:k,height:k})}function h(a,h,i){b(m,b(e(f(),{rotation:360/d.lines*a+"deg",left:~~h}),b(e(c("roundrect",{arcsize:d.corners}),{width:j,height:d.scale*d.width,left:d.scale*d.radius,top:-d.scale*d.width>>1,filter:i}),c("fill",{color:g(d.color,a),opacity:d.opacity}),c("stroke",{opacity:0}))))}var i,j=d.scale*(d.length+d.width),k=2*d.scale*j,l=-(d.width+d.length)*d.scale*2+"px",m=e(f(),{position:"absolute",top:l,left:l});if(d.shadow)for(i=1;i<=d.lines;i++)h(i,-2,"progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");for(i=1;i<=d.lines;i++)h(i);return b(a,m)},h.prototype.opacity=function(a,b,c,d){var e=a.firstChild;d=d.shadow&&d.lines||0,e&&b+d<e.childNodes.length&&(e=e.childNodes[b+d],e=e&&e.firstChild,e=e&&e.firstChild,e&&(e.opacity=c))}}var j,k,l=["webkit","Moz","ms","O"],m={},n={lines:12,length:7,width:5,radius:10,scale:1,corners:1,color:"#000",opacity:.25,rotate:0,direction:1,speed:1,trail:100,fps:20,zIndex:2e9,className:"spinner",top:"50%",left:"50%",shadow:!1,hwaccel:!1,position:"absolute"};if(h.defaults={},f(h.prototype,{spin:function(b){this.stop();var c=this,d=c.opts,f=c.el=a(null,{className:d.className});if(e(f,{position:d.position,width:0,zIndex:d.zIndex,left:d.left,top:d.top}),b&&b.insertBefore(f,b.firstChild||null),f.setAttribute("role","progressbar"),c.lines(f,c.opts),!j){var g,h=0,i=(d.lines-1)*(1-d.direction)/2,k=d.fps,l=k/d.speed,m=(1-d.opacity)/(l*d.trail/100),n=l/d.lines;!function o(){h++;for(var a=0;a<d.lines;a++)g=Math.max(1-(h+(d.lines-a)*n)%l*m,d.opacity),c.opacity(f,a*d.direction+i,g,d);c.timeout=c.el&&setTimeout(o,~~(1e3/k))}()}return c},stop:function(){var a=this.el;return a&&(clearTimeout(this.timeout),a.parentNode&&a.parentNode.removeChild(a),this.el=void 0),this},lines:function(d,f){function h(b,c){return e(a(),{position:"absolute",width:f.scale*(f.length+f.width)+"px",height:f.scale*f.width+"px",background:b,boxShadow:c,transformOrigin:"left",transform:"rotate("+~~(360/f.lines*k+f.rotate)+"deg) translate("+f.scale*f.radius+"px,0)",borderRadius:(f.corners*f.scale*f.width>>1)+"px"})}for(var i,k=0,l=(f.lines-1)*(1-f.direction)/2;k<f.lines;k++)i=e(a(),{position:"absolute",top:1+~(f.scale*f.width/2)+"px",transform:f.hwaccel?"translate3d(0,0,0)":"",opacity:f.opacity,animation:j&&c(f.opacity,f.trail,l+k*f.direction,f.lines)+" "+1/f.speed+"s linear infinite"}),f.shadow&&b(i,e(h("#000","0 0 4px #000"),{top:"2px"})),b(d,b(i,h(g(f.color,k),"0 0 1px rgba(0,0,0,.1)")));return d},opacity:function(a,b,c){b<a.childNodes.length&&(a.childNodes[b].style.opacity=c)}}),"undefined"!=typeof document){k=function(){var c=a("style",{type:"text/css"});return b(document.getElementsByTagName("head")[0],c),c.sheet||c.styleSheet}();var o=e(a("group"),{behavior:"url(#default#VML)"});!d(o,"transform")&&o.adj?i():j=d(o,"animation")}return h});

var default_opts = {
        lines: 11,
        length: 18,
        width: 8,
        radius: 30,
        corners: 1,
        rotate: 9,
        color: '#CCC',
        speed: 1,
        trail: 47,
        shadow: true,
        hwaccel: false,
        className: 'spinner',
        zIndex: 2e9,
        top: '50%',
        left: '50%'
};

var modal_opts = {
        lines: 11, // The number of lines to draw
        length: 23, // The length of each line
        width: 8, // The line thickness
        radius: 40, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 9, // The rotation offset
        color: '#FFF', // #rgb or #rrggbb
        speed: 1, // Rounds per second
        trail: 50, // Afterglow percentage
        shadow: true, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: '50%', // Top position relative to parent in px
        left: '50%' // Left position relative to parent in px
};
//jquery extension
$.fn.spin = function(opts) {
    if (opts == null) opts = default_opts;
    if (opts == "modal") opts = modal_opts;

    this.each(function() {
        var $this = $(this),
        data = $this.data();

        if (data.spinner) {
            data.spinner.stop();
            delete data.spinner;
            $("#spin_modal_overlay").remove();
            return this;
        }

        var spinElem = this;
        if (opts == modal_opts){
            $('body').append('<div id="spin_modal_overlay" style="background-color: rgba(0, 0, 0, 0.6); width:100%; height:100%; position:fixed; top:0px; left:0px; z-index:'+(opts.zIndex-1)+'"/>');
            spinElem = $("#spin_modal_overlay")[0];
        }
        else {
            $(spinElem).css("position","relative");
            $(spinElem).append('<div id="spin_modal_overlay" style="background-color: rgba(242, 242, 242,0.8); width:100%; height:100%; position:absolute; top:0px; left:0px; z-index:'+(opts.zIndex-1)+'"/>');
            spinElem = $("#spin_modal_overlay")[0];
        }
        data.spinner = new Spinner($.extend({color: $this.css('color')}, opts)).spin(spinElem);
    });
    return this;
};

//IE8 polyfill for Array.indexOf
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}
