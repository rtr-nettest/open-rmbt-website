var useAddressPopup = true;

var fastConnectionWarningConfig = {
    test_types : ["RMBTws", "RMBTjs"],
    min_download_kbit : 100*1000,
    min_upload_kbit : 30*1000
};

var exdays = 365*24*60*60;
var History = window.History;
/*var uuid;
var showTest = false; //DEACTIVATE NDT!!
var noJava = false;
var noCanvas = false;

var javaTurnOff = getParam('nojava');
var canvasTurnOff = getParam('nocanvas');*/

var color_for_speed_graph_download = "#3CC828"; //or green: #00CC00
var color_for_speed_graph_upload = "#0080C1"; //or green: #00CC00
var color_for_signal_graph = "#D19010"; //D19010
var color_for_signal_graph_lte_background = "#ffe3ab";
var color_for_signal_graph_download_phase = "#B1E9A9";
var color_for_signal_graph_upload_phase = "#99CCE6";
var color_for_map_movement = "#0080C1";
var min_accuracy_for_showing_map = 2000;

//distinguish if the user visits the page from conducting a test
//or from the history
var fromTest = false;
if (window.location.hash && window.location.hash.length > 0) {
    fromTest = true;
}
var geocoder_google = null;
var geocoder_accuracy = null;
var geocoder_provider = "geocoder";
var prevQuery = "";
var map_geoposition;
var map_geoposition_pointer;
var map_baselayer_basemap;
var map_baselayer_google;

/**
 * Initialize the Map for the address form
 * also allow dragging the pointer
 */
function makeMap() {
    
    
    map_baselayer_bing = new ol.layer.Tile({
        visible: false,
        preload: Infinity,
        title: 'Bing Maps',
        type: 'base',
        source: new ol.source.BingMaps({
            key: bing_api_key,
            imagerySet: 'Road'
            // use maxZoom 19 to see stretched tiles instead of the BingMaps
            // "no photos at this zoom level" tiles
            // maxZoom: 19
        })
    });

    map_baselayer_basemap = (function() {
        // basemap.at
        //taken from http://www.basemap.at/application/js/mobile-base3.js
        var gg = ol.proj.get('EPSG:4326');
        var sm = ol.proj.get('EPSG:3857');

        var templatepng =
            '{Layer}/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png';
        var urlsbmappng = [
            '//maps1.wien.gv.at/basemap/' + templatepng,
            '//maps2.wien.gv.at/basemap/' + templatepng,
            '//maps3.wien.gv.at/basemap/' + templatepng,
            '//maps4.wien.gv.at/basemap/' + templatepng
        ];
        var IS_CROSS_ORIGIN = 'anonymous';

        var tilegrid = new ol.tilegrid.WMTS({
            origin: [-20037508.3428, 20037508.3428],
            extent: [977650, 5838030, 1913530, 6281290],
            resolutions: [
                156543.03392811998, 78271.51696419998,
                39135.758481959994, 19567.879241008,
                9783.939620504, 4891.969810252,
                2445.984905126, 1222.9924525644,
                611.4962262807999, 305.74811314039994,
                152.87405657047998, 76.43702828523999,
                38.21851414248, 19.109257071295996,
                9.554628535647998, 4.777314267823999,
                2.3886571339119995, 1.1943285669559998,
                0.5971642834779999, 0.29858214174039993
            ],
            matrixIds: [
                '0', '1', '2', '3', '4', '5',
                '6', '7', '8', '9', '10',
                '11', '12', '13', '14', '15',
                '16', '17', '18', '19'
            ]
        });


        var bmap = new ol.source.WMTS({
            tilePixelRatio: 1,
            projection: sm,
            layer: 'geolandbasemap',
            /*layer: hiDPI ? 'bmaphidpi' : 'geolandbasemap',*/
            style: 'normal',
            matrixSet: 'google3857',
            urls: urlsbmappng,
            visible: true,
            //crossOrigin: IS_CROSS_ORIGIN,
            requestEncoding: /** @type {ol.source.WMTSRequestEncoding} */ ('REST'),
            tileGrid: tilegrid,
            attributions: [
                new ol.Attribution({
                    html: 'Tiles &copy; <a href="//www.basemap.at/">' +
                    'basemap.at</a> (STANDARD).'
                })
            ]
        });

        return new ol.layer.Tile({
            visible: true,
            preload: Infinity,
            source: bmap,
            title: 'Basemap.at',
            type: 'base'
        });
    })();

    map_geoposition = new ol.Map({
        layers: [map_baselayer_basemap, map_baselayer_bing],
        controls: ol.control.defaults({
            attributionOptions: ({
                collapsible: false
            })
        }),
        target: 'map1',
        view: new ol.View({
            center: [0, 0],
            zoom: 2,
            maxZoom : 19
        })
    });

    var textent = [1252344.27125, 5846515.498922221, 1907596.397450879, 6284446.2299491335];
    map_geoposition.getView().fit(textent, map_geoposition.getSize());


    //add marker with test position
    var iconStyle = new ol.style.Style({
        image: new ol.style.Icon({
            src: '../img/speedtest/marker.png'
        })
    });

    map_geoposition_pointer = new ol.Feature({
        geometry: new ol.geom.Point([0,0]),
    });
    map_geoposition_pointer.setStyle(iconStyle);

    var vectorSource = new ol.source.Vector({
        features: [map_geoposition_pointer]
    });

    var vectorLayer = new ol.layer.Vector({
        source: vectorSource
    });


    map_geoposition.addLayer(vectorLayer);
    
    var modify = new ol.interaction.Modify({
        features: new ol.Collection([map_geoposition_pointer])
    });
    
    map_geoposition_pointer.on('change',function(){
        geocoder_provider = "manual";
        geocoder_accuracy = 10;
    },map_geoposition_pointer);
    
    map_geoposition.addInteraction(modify);
}

function convertLongLatToOpenLayersPoint(long,lat) {
    return ol.proj.transform([long, lat], 
                'EPSG:4326', 'EPSG:3857');
}

/**
 * Geocode the address that the user entered, 
 * store the results in the local variables
 * and update the map
 * @param {Callback(successful: boolean)} callback called when positioning finished
 */
function searchAndPositionOnAddress(callback) {
        var query, address, zip, city;
    
        if (geocoder_google === null) {
            geocoder_google = new google.maps.Geocoder();
        }
    
        var buildQuery = function() {
            address = $("input[name=input_address]").val();
            zip = $("input[name=input_zip]").val();
            city = $("input[name=input_city]").val();
            
            if (city.length === 0 && zip.length === 0) {
                return "";
            }

            return address + ", " + zip + " " + city;
        };
        query = buildQuery();
        if (query === prevQuery || query === "") {
            if (callback !== undefined) {
                callback(true);//@TODO different actions if prev. query was successful?
            } 
            return;
        }
        prevQuery = query;
        
        $('#spinner').spin('modal');
        
        geocoder_google.geocode( { 'address': query, 'region': $("select[name=country]").val()}, function(results, status) {
                $('#spinner').spin('modal');
                if (status === google.maps.GeocoderStatus.OK) {
                        var pan = function(i) {
                            $("#address_search .address_input").show();
                            $("#address_search .selection").hide();

                            $("#address_search #address_search_input").val(results[i].formatted_address);
                            
                            var ne = convertLongLatToOpenLayersPoint(results[i].geometry.viewport.getNorthEast().lng(), results[i].geometry.viewport.getNorthEast().lat()); //North East
                            var sw = convertLongLatToOpenLayersPoint(results[i].geometry.viewport.getSouthWest().lng(), results[i].geometry.viewport.getSouthWest().lat()); //South West
                            var center = convertLongLatToOpenLayersPoint(results[i].geometry.location.lng(), results[i].geometry.location.lat());
                           
                            //http://openlayers.org/en/v3.7.0/apidoc/ol.html#Extent
                            //[minx, miny, maxx, maxy]
                            var extent=[
                                ne[0], ne[1],
                                sw[0], sw[1]
                            ];
                            
                            map_geoposition.getView().fit(extent, map_geoposition.getSize());
                            map_geoposition.getView().setZoom(map_geoposition.getView().getZoom()+2);
                            map_geoposition.getView().setCenter(center);
                            
                            map_geoposition_pointer.getGeometry().setCoordinates(center);//(new ol.geom.Point(center));
                            
                            //re-add modify-event in olv3 for some reason
                            var modify = new ol.interaction.Modify({
                                features: new ol.Collection([map_geoposition_pointer])
                            });

                            map_geoposition_pointer.on('change', function () {
                                geocoder_provider = "manual";
                                geocoder_accuracy = 10;
                            }, map_geoposition_pointer);

                            map_geoposition.addInteraction(modify);
                            
                            //reset provider
                            geocoder_provider = "geocoder";


                            //address components
                            $.each(results[i].address_components, function(j,component) {
                                if (zip === "" && component.types.indexOf('postal_code') >= 0) {
                                    $("input[name=input_zip]").val(component.long_name);
                                }
                                else if (city === "" && component.types.indexOf('locality') >= 0) {
                                    $("input[name=input_city]").val(component.long_name);
                                }
                                else if (component.types.indexOf('country') >= 0) {
                                   $("select[name=country]").val(component.short_name.toLowerCase());
                                   
                                   //set map layer
                                   if (component.short_name.toLowerCase() === 'at') {
                                       map_baselayer_basemap.setVisible(true);
                                       map_baselayer_bing.setVisible(false);
                                   }
                                   else {
                                       map_baselayer_bing.setVisible(true);
                                       map_baselayer_basemap.setVisible(false);
                                   }
                                }
                            });
                            
                            //"guess" accuracy
                            geocoder_accuracy = 50000;
                            if (results[i].geometry.location_type === 'ROOFTOP') {
                                geocoder_accuracy = 100;
                            }
                            else if (results[i].geometry.location_type === 'RANGE_INTERPOLATED') {
                                geocoder_accuracy = 500;
                            }
                            else if (results[i].geometry.location_type === 'GEOMETRIC_CENTER') {
                                geocoder_accuracy = 1900;
                            }
                            
                            prevQuery = buildQuery();
                            
                            if (callback !== undefined) {
                                callback(true);
                            }
                        };
                
                        pan(0);
                        
                } else {
                        if (callback !== undefined) {
                            callback(false);
                        }
                        alert(Lang.getString('addressNotFound'));
                }
        });
        
}

$(document).ready(function() {
        //bind browser navigation with history.js
        if (History) {
		History.Adapter.bind(window,'statechange',function(e){
                        //if there is a parameter in the URL - show test results
			if (e.target.location.href.indexOf('?')>=0) {
				$('#verlaufcontainer').css('display','none');
				$('#code-eingabe').css('display','none');
				$('#verlauf-detailcontainer').css('display','block');
				$('#h1').html(Lang.getString('TestResult'));
			}
			else {
				$('#verlaufcontainer').css('display','block');
				$('#code-eingabe').css('display','block');
				$('#verlauf-detailcontainer').css('display','none');
				$('#h1').html(Lang.getString('CourseOverview'));
			}
			
		});
        }
        
        //if a test just finished -> allow conducting a NDT test
        if (fromTest === true) {
            //take the test-uuid from the hash
            testID = window.location.hash.substr(1);

            show_agbform(false, 'RMBTtestresult', testID);


            var zip = getCookie('RMBTzip');
            if (!zip || zip.length !== 4) {
                zip = '';
                //show_zippopup(testID);
            }
        }
        else {
        	
        	
                
                
                if (window.location.search.length > 0) {
                        //if the user visits /Verlauf?test-uuid -> show the test result
                        testID = window.location.search.substr(1);
                        show_agbform(false, 'RMBTtestresult',testID);       
                }
                else {
                        //if the user visits /Verlauf, show the /Verlauf-page
                        show_agbform(false, 'RMBTsettings', 'verlauf');
                }
        }
        
        $('#btn_abschicken').click(function(){requestBrowserData('RMBTsync','speedttest-code')});
        $('#speedttest-code').keypress(function (e) {
            if (e.which == 13) {
                requestBrowserData('RMBTsync', 'speedttest-code');
            }
        });

});

function show_addressPopup(testID) {
	document.getElementById("popupform").innerHTML = "";
	$(".iwill").detach();
	
        var zipForm = '<div id="zip_check">' +
                '<p>' + Lang.getString('PleaseEnterPostalCode') + '</p>' +
                '<p><label for="form_zip_ausland">' + Lang.getString('OutsideAustria') + ':&nbsp;</label>' +
                '<input type="checkbox" name="form_zip_ausland" id="form_zip_ausland" class="checkbox ui-widget-content ui-corner-all" onchange="$(\'#toggle_zip\').toggle();" /></p>' +
                '<p id="toggle_zip"><label for="form_zip">' + Lang.getString('AustrianPostalCode') + ':&nbsp;</label>' +
                '<input type="text" name="form_zip" id="form_zip" class="text ui-widget-content ui-corner-all" /></p>' +
                '</div>' +
                '<div class="validateTips"></div>';
        
        var addressForm = '<div id="address" style="float:left; width:50%; height:100%">        <p>            <label for="input_address">Straße/Nr.</label>            <input type="text" name="input_address" onblur="searchAndPositionOnAddress()"/>        </p>        <p>            <label for="input_zip">Postleitzahl</label>            <input type="text" name="input_zip"  onblur="searchAndPositionOnAddress()"/>        </p>        <p>            <label for="input_city">Ort</label>            <input type="text" name="input_city"  onblur="searchAndPositionOnAddress()"/>        </p>        <p>            <label for="outside-austria"><input type="checkbox" name="outside_austria"  value="outside-austria" id="outside-austria"  onchange="if ($(\'#outside-austria:checked\').length === 1){$(\'#address input[type=text]\').attr(\'disabled\',\'disabled\');}else {$(\'#address input[type=text]\').removeAttr(\'disabled\')}"/> Außerhalb Österreichs</label>        </p>    </div>    <div id="map1" style="float:left; width: 50%; height: 100%;">            </div> ';
        var countryHMTL = "";
        var possibleCountries = Lang.getString('countries');
        $.each(possibleCountries, function(key, value) {
            countryHMTL += "<option value='" + key + "'" + ((key.toUpperCase() === browser_country_geoip)?"selected='selected'":"") + ">" + value + "</option>";
        });
    
        addressForm = '<style>label { display: block; margin-right: 10px; width: 250px; }' +
            '   label + input, label + select { display:block; width: 90%; }</style>' +
            '<div id="address" style="float:left; width:50%; height:100%">' +
            '<p>' +
            '    <label for="input_address">' + Lang.getString('StreetAddress') + '</label>' +
            '    <input type="text" name="input_address" id="input_address" onblur="searchAndPositionOnAddress()"/>' +
            '</p>' +
            '<p>' +
            '    <label for="input_zip">' + Lang.getString('PostalCode') + '</label>' +
            '    <input type="text" name="input_zip" id="input_zip" onblur="searchAndPositionOnAddress()"/>' +
            '</p>' +
            '<p>' +
            '    <label for="input_city">' + Lang.getString('City') + '</label>' +
            '    <input type="text" name="input_city" id="input_city" onblur="searchAndPositionOnAddress()"/>' +
            '</p>' +
            //'<p>' +
            //'    <label for="outside-austria"><input type="checkbox" name="outside_austria"  value="outside-austria" id="outside-austria"/> ' + Lang.getString('OutsideAustria') + '</label>' +
            //'</p>' +
            '<p>' + 
            '    <label for="country">' + Lang.getString('Country') + '</label>' +
            '    <select id="country" name="country" disabled="disabled">' + countryHMTL + '</select>' +
            '</p>' +
            '<p>' +
            '   <a href="' + Lang.getString('PrivacyStatementLink') + '" target="_blank">' + Lang.getString('PrivacyStatement') + '</a>' +
            '</p>' +
            '</div>' +
            '<div id="map1" style="float:left; width: 50%; height: 100%;"></div>';
        
        
        $("#popupform").append(
                '<form action="javascript:void(0);return false;" style="height:280px;margin-bottom:0px">' +
                ((useAddressPopup)?addressForm:zipForm) +
                
                '<div class="clear" />' + 
                '</form>');
	

	var zip = $("#form_zip");
	var allFields = $([]);
	var bValid = false;
	form_tips = $(".validateTips");
	var terms_accepted = getCookie("RMBTTermsV3");
	popup_title = Lang.getString('AddressInput');
	allFields.add(zip);
	
	var tmp_decline;
    if (useAddressPopup) {
        tmp_decline = Lang.getString('Skip');
    }
    else {
        tmp_decline = Lang.getString('Cancel');
    }
	var tmp_agree =  Lang.getString('Continue');
	
	var dialog_buttons = {};
	dialog_buttons[tmp_decline] = function() {
		$(this).dialog("close");
	};
	dialog_buttons[tmp_agree] = function() {
		bValid = true;
		allFields.removeClass("ui-state-error");
                
                if (!useAddressPopup) {
                    console.log("ZIP input no longer supported")
                    /*if (zip.val().length === 0) {
                        setCookie('RMBTzip', '0000', 3600);
                        $(this).dialog("close");
                        bValid = false;
                    }
                    else if (zip.val().length) {
                        bValid = bValid && form_checkLength(zip, "Postleitzahl", 4, 4);
                        bValid = bValid && form_checkRegexp(zip, /^([0-9])+$/, "Posleitzahl darf nur aus Zahlen von 0 - 9 bestehen");
                    }
                    if (bValid) {
                        setCookie('RMBTzip', zip.val(), 3600);
                        $('#editzip').html(zip.val());
                        sendZIP(testID, zip.val());
                        var tmp = Lang.getString('YourPostalCode') + ': <span id="editzip" onclick="show_zippopup(\'' + testID + '\')" title="' + Lang.getString('clickToEdit') + '">' + zip.val() + '</span>';
                        $('#yourzip').html(tmp);
                        $(this).dialog("close");
                    }*/
                }
                else {
                    var that = this;
                    searchAndPositionOnAddress(function(successful){
                            if (successful === false) {
                                return;
                            }
                            //new: get lat/long from marker
                            var point = map_geoposition_pointer.getGeometry().getCoordinates();
                            point = ol.proj.transform(point, 'EPSG:3857', 'EPSG:4326');
                            var lat = point[1];
                            var long = point[0];
                            var accuracy = geocoder_accuracy;
                            var provider = geocoder_provider;

                            //not, if "outside austria"
                            if ($("#outside-austria:checked").length === 1) {
                                setCookie('RMBTzip', '0000', 3600);
                            }
                            else {
                                if (lat !== null && long !== null && accuracy !== null ) {
                                    sendLatLong(testID, lat, long, accuracy, provider, function() {
                                        $("#verlauf-detailcontainer .test-map").show();
                                        setPosition("#verlauf-detailcontainer", lat, long, accuracy, [], 0, true);
                                        reloadShareText(testID);
                                    });
                                }
                            }
                            $(that).dialog("close");
                    });
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
		height : (useAddressPopup)?430:220,
		buttons : dialog_buttons,
		close : function() {
			$(this).dialog("close");
		}
	});
	
	$("#popupform").dialog("open");
	zipcookie = getCookie('RMBTzip');
	zip.val(zipcookie);
		
	$('#popupform').live('keyup', function(e){
          if (e.keyCode == 13) {
            $(':button:contains("' + Lang.getString('Continue') + '")').click();
          }
        });
        
        if (useAddressPopup) {
            makeMap();
            $("#outside-austria").change(function() {
                if ($('#outside-austria:checked').length === 1) { 
                    $('#address input[type=text]').attr('disabled','disabled');
                }
                else {
                    $('#address input[type=text]').removeAttr('disabled')
                }
            });
        }
}

/**
 * Update a test with new geo coordinates
 * @param {uuid} testUID
 * @param {float} lat
 * @param {float} long
 * @param {float} accuracy
 * @param {String} provider
 * @param {function} callback will be called on success
 */
function sendLatLong(testUID, lat, long, accuracy, provider, callback) {
        cookie_uuid = getCookie("RMBTuuid");

        var json_data = {
            uuid: cookie_uuid,
            test_uuid: testUID,
            geo_lat : lat,
            geo_long : long,
            accuracy: accuracy,
            provider: provider
        };
        $.ajax({
            url: controlProxy + "/" + wspath + "/resultUpdate",
            type: "post",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(json_data),
            success: function(data) {
                if (callback !== undefined) {
                    callback();
                }
            },
            error: function() {
                alert("Error beim resultUpdate-Abruf");
            }
        });  
}

/**
 * Reload the result and
 * reattach it to the mail link
 * since the position may changed
 * @param {uuid} testUUID
 */
function reloadShareText(testUUID) {
    var json_data = {
        test_uuid: testUUID,
        language: selectedLanguage,
        timezone: test_timezone
    };
        
    $.ajax({
        url: controlProxy + "/" + wspath + "/testresult",
        type: "post",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify(json_data),
        success: function(data) {
            $("#verlauf-detailcontainer .shareMail").attr("href",
                    "mailto:?subject=" +
                    encodeURIComponent(data.testresult[0].share_subject) +
                    "&body=" +
                    encodeURIComponent(data.testresult[0].share_text));
        }
    });
}


var qosPrototypeHTML = null;
/**
 * Loads even more data from the open-test-database
 * Called by functions.js:RMBTtestresult()
 * @param {String} openTestUUID
 * @param {uuid} testUUIDForZipPopup optional: the test uuid, IF a zip code-popup should be requested. 
 */
function loadOpenTestData(openTestUUID, testUUIDForZipPopup) {
    $.ajax({
        url: controlProxy + "/" + statisticpath + "/opentests/" + openTestUUID,
        type: 'GET',
        dataType: 'json',
        success: function(testdata) {
            //request ZIP popup?
            if (testUUIDForZipPopup !== undefined && testUUIDForZipPopup !== null & testUUIDForZipPopup.length > 1) {
                //request should be issued
                //only if geoposition and IP are not in Austria
                var requestPopup = true;
                if (testdata.country_geoip !== null && testdata.country_geoip.toLowerCase() !== 'at') {
                    requestPopup = false;
                }
                if (requestPopup && testdata.country_location !== null && testdata.country_location.toLowerCase() !== 'at') {
                    requestPopup = false;
                }
                if (requestPopup) {
                    show_addressPopup(testUUIDForZipPopup);
                }
                else {
                    console.log("ZIP input no longer supported");
                    //var tmp = Lang.getString('YourPostalCode') + ' <span id="editzip" onclick="show_zippopup(\'' + testUUID + '\')" title="' + Lang.getString('clickToEdit') + '">: ' + Lang.getString('OutsideAustria') + '</span>';
                    //$('#yourzip').html(tmp);
                }
            }
            
            //warn user if fast internet connection and websocket test
            handleFastConnections(testdata);
            
            $("#verlauf-detailcontainer a.shareBanner").unbind('click');
            $("#verlauf-detailcontainer a.shareBanner").click(function() { showShareBanner("#verlauf-detailcontainer", openTestUUID); });
             
            //reset everything
            $("#verlauf-detailcontainer .speed-curve-graph-download").empty();
            $("#verlauf-detailcontainer .speed-curve-table-download").find("tr:gt(0)").remove();
            $("#verlauf-detailcontainer .speed-curve-graph-upload").empty();
            $("#verlauf-detailcontainer .speed-curve-table-upload").find("tr:gt(0)").remove();
            $("#verlauf-detailcontainer .signal-curve-graph").empty();
            $("#verlauf-detailcontainer .signal-curve-table").find("tr:gt(0)").remove();
            $("#verlauf-detailcontainer .test-map-container").empty();
            $("#verlauf-detailcontainer .social").empty();
             
            
            if (testdata.speed_curve.download.length>0 && testdata.speed_curve.upload.length>0) {
                try {
                    drawSingleSpeedCurve("#verlauf-detailcontainer",testdata.speed_curve.download,"download");
                    drawSingleSpeedCurve("#verlauf-detailcontainer",testdata.speed_curve.upload,"upload");
                    $("#verlauf-detailcontainer .speed-curve").show(); //both
                } catch(e) { 
                    /* IE without canvas */ 
                    $("#verlauf-detailcontainer .speed-curve").hide();
                }
            } else {
                $("#verlauf-detailcontainer .speed-curve").hide();
            }
            
            //if at least two entries
            if (testdata.speed_curve.signal.length > 1) {
                try {
                    drawSignalCurve("#verlauf-detailcontainer", testdata.speed_curve, testdata.time_dl_ms, testdata.duration_download_ms, testdata.time_ul_ms, testdata.duration_upload_ms);
                } catch (e) { /* IE without canvas */
                }
            } else {
                //if no speed curve => hide graph
                $("#verlauf-detailcontainer" + " .signal-curve").hide();
            }
            
            //if there is no position => hide map
            if (testdata.lat === null && testdata.long === null) {
                $("#verlauf-detailcontainer .test-map").hide();
                $("#verlauf-detailcontainer .test-long").parent().parent().remove();
            } else {
                  //if there is no position or not accurate => hide map
                if (testdata.loc_accuracy !== null && testdata.loc_accuracy <= 2000) {
                    $("#verlauf-detailcontainer .test-map").show();
                    var useBasemapAT = (testdata.country_location !== null && testdata.country_location.toLowerCase() === "at")?true:false;
                    setPosition("#verlauf-detailcontainer",testdata.lat,testdata.long,testdata.loc_accuracy, testdata.speed_curve.location,testdata.distance, useBasemapAT);
                } else {
                    $("#verlauf-detailcontainer .test-map").hide();
                }
            }
            
            //wire up share links
            var url = "https://" + document.domain + "/" + selectedLanguage + "/Opentest?" + openTestUUID;
            $("#verlauf-detailcontainer .social").socialSharePrivacy({
                services: {
                    facebook: {
                        'perma_option': 'off'
                    },
                    twitter: {
                        'perma_option': 'off'
                    },
                    gplus: {
                        'perma_option': 'off'
                    }
                },
                uri: url
            });
            
            $("#verlauf-detailcontainer .shareLink").attr("href",url);
        }
    });
    
    $.ajax({
        url: controlProxy + "/" + wspath + "/qos/" + openTestUUID + "/" + selectedLanguage,
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            //put results in the table
            //reset + save for later
            if (qosPrototypeHTML === null) {
                qosPrototypeHTML = $("#verlauf-detailcontainer .testresult-qos").find(".prototype").clone();
            }
            else {
                //reset
                $("#verlauf-detailcontainer .testresult-qos tbody").remove();
                $("#verlauf-detailcontainer .testresult-qos").append(qosPrototypeHTML);
            }
            if (data.error.length === 0) {
                printQoSTestData(data, "#verlauf-detailcontainer");
                $("#verlauf-detailcontainer .testresult-qos").show();
            } else {
                $("#verlauf-detailcontainer .testresult-qos").hide();
            }
        }
    });
}

/**
 * Show a warning for users with a fast
 * connection that did a Websocekt-test
 * since the test results may be
 * imprecise due to browser limitations
 * 
 * @param {JSON} testdata Opendata-result
 */
function handleFastConnections(testdata) {
    if (fastConnectionWarningConfig.test_types.indexOf(testdata.platform) >= 0) {
        if (testdata.download_kbit >= fastConnectionWarningConfig.min_download_kbit ||
            testdata.upload_kbit >= fastConnectionWarningConfig.min_upload_kbit) {
            //show warning
            $("#fast-connection-warning").html("<p>" + Lang.getString("FastConnectionWarning") + "</p>");
        }
    }
}