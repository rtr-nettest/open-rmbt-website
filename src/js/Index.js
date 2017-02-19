var most_recent_tests = 5;
var fullscreenMap = getParam("fullscreenMap");

$(window).bind("load", function() {
    $(".teaser-icon").css("visibility","visible");
});

$(document).ready(function() {
    //hide custom font objects until the font is loaded
    $(".teaser-icon").css("visibility","hidden");
    
    var mobile_client = navigator.userAgent;
    
    //is it windows phone?
    if (mobile_client.match(/Windows Phone/)) {
        //do nothing (yet)
    }
    //is it android?
    else if (mobile_client.match(/Android|Opera M(obi|ini)|Dolfin|Dolphin/g)) {
        //@TODO: Save links somewhere else
        var url = 'https://play.google.com/store/apps/details?id=at.alladin.rmbt.android';
        $("#teaserlinkStart a").attr("href",url);
        $("#hint-jstest").show();
    }
    //is it iOS?
    else if (mobile_client.match(/iP(hone|od|ad)/g)) {
        $("#iOSApp").show();
        var url = 'https://itunes.apple.com/at/app/rtr-netztest/id724321403';
        $("#teaserlinkStart a").attr("href",url);
        $("#hint-jstest").show();
    } 

    if (userServerSelection > 0) {
        getLastOpenDataResults();
    }
    
    if (!(userServerSelection > 0)) {
        //if fullscreen map parameter set - map is only page content!
        if (fullscreenMap) {
            var mapContainer = $("#new-tests-map-container");
            $("body").empty()
            $("body").append(mapContainer);
        }
        
        loadLastOpenDataResultsMap();
    }
});

var map;
var vectorLayer;
var mapProxy;
var markers;
function loadLastOpenDataResultsMap() {
    //get map proxy url
    var json_data = {
        "type": test_type,
        "name": test_name
    };
    $.ajax({
        url: controlProxy + "/" + wspath + "/settings",
        type: "post",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify(json_data),
        success: function (data) {
            mapProxy = data.settings[0].urls.url_map_server;
        }
    });
    
    
    var bases = new Array();
    bases.push(
            new ol.layer.Tile({
                visible: true,
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
            }));
    
    var vectorSource = new ol.source.Vector({});
    var currentFeatures = [];
    
    var colors = [
        'rgba(128, 128, 128, 0.9)', //undefined - 0
        'rgba(255, 0, 0, 0.9)', //red - 1
        'rgba(255, 255, 0, 0.9)', //yellow - 2
        'rgba(0, 255, 0, 0.9)', //green - 3
        'rgba(0, 153, 0, 0.9)' //dark green - 4
    ];
        
    var stylingFct = function(feature, resolution) {
        return    [new ol.style.Style({
            image: new ol.style.Circle({
                fill: new ol.style.Fill({
                    color: colors[feature.get('result').download_classification]
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(128, 128, 128, 0.9)',
                    width: 1.25
                }),
                radius: (currentFeatures.indexOf(feature) === 0 && currentFeatures.length === most_recent_tests)?4:(currentFeatures.indexOf(feature) === currentFeatures.length-1)?8:6
            })
        })];
    }
    
    vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: stylingFct
    })
    
    map = new ol.Map({
        layers: bases,
        controls: ol.control.defaults({
            attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                collapsible: false
            })
        }),
        target: $('#newtestsmap')[0],
        view: new ol.View({
            center: [0, 0],
            zoom: 2,
            maxZoom : 19
        })
    });

    
    map.addLayer(vectorLayer);
    
    markers = new ol.Overlay.Popup();
    map.addOverlay(markers);

    map.on('click', function (evt) {
        var feature = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return feature;
                });
        if (feature) {
            var geometry = feature.getGeometry();
            var coord = geometry.getCoordinates();
            
            var test = feature.get("result");
            var uuid = test.open_test_uuid;
            
            //Open Popup?
            //window.location = "Opentest?" + uuid;
            loadMarker(uuid);
        } else {
            //$(element).popover('destroy');
            //remove popup
            markers.hide();
        }
    });
    
    // change mouse cursor when over marker
    map.on('pointermove', function (e) {
        var pixel = map.getEventPixel(e.originalEvent);
        var hit = map.hasFeatureAtPixel(pixel);
        map.getTarget().style.cursor = hit ? 'pointer' : '';
    });
    
    //fit to Austrian border initially
    var textent = [1252344.27125, 5846515.498922221, 1907596.397450879, 6284446.2299491335];
    map.getView().fit(textent, map.getSize());
    
    //load test results
    var currentFirstTestUUID = null;
    
    var addTestToMap = function (result) {
        var coords = convertLongLatToOpenLayersPoint(result.long, result.lat);
        var feature = new ol.Feature({
                    geometry: new ol.geom.Point(coords),
                    result: result
                });
        vectorSource.addFeature(feature);
        currentFeatures.push(feature);
        
        //remove first feature if more than 5
        if (currentFeatures.length > most_recent_tests) {
            var removed = currentFeatures.shift();
            vectorSource.removeFeature(removed);
        }
        
        //if fullscreen - open popup
        if (fullscreenMap) {
            window.setTimeout(function() {
                loadMarker(result.open_test_uuid);
            }, 2000)
        }
    }

    var animateMapToShowTests = function () {
        window.setTimeout(function () {
            var extent = vectorLayer.getSource().getExtent();
            
            var extentSize = ol.extent.getSize(extent);
            extent[0] -= extentSize[0]*.2
            extent[1] -= extentSize[1]*.2
            extent[2] += extentSize[0]*.2
            extent[3] += extentSize[1]*.2
            
            var zoom = ol.animation.zoom({
                resolution: map.getView().getResolution(),
                duration: 2000
            })
            var pan = ol.animation.pan({
                duration: 2000,
                source: /** @type {ol.Coordinate} */ (map.getView().getCenter())
            });
            map.beforeRender(pan, zoom);

            map.getView().fit(extent, map.getSize());
        }, 10);
    }
    
    var refreshOpenTests = function(initial) {
        $.getJSON(statisticProxy + "/" + statisticpath + "/opentests/search?max_results=" + most_recent_tests + "&loc_accuracy=<2000&additional_info=download_classification",
                function (data) {
                    //add points to map
                    var newPoints = 0;
                    var newTests = [];
                    $.each(data.results, function (i, result) {
                        if (result.open_test_uuid === currentFirstTestUUID) {
                            return false;
                        }
                        newPoints++;
                        newTests.push(result);
                        
                        //if initial - don't yet
                        if (!initial) {
                            addTestToMap(result);
                        }
                        
                    })

                    currentFirstTestUUID = data.results[0].open_test_uuid;
                    if (newPoints === 0) {
                        return;
                    }

                    //if initial - add leave out three tests, animate them afterwards
                    if (initial) {
                        for (var i=most_recent_tests;i>3;i--) {
                            addTestToMap(newTests[i-1]);
                        }
                        window.setTimeout(function() {
                            addTestToMap(newTests[2]);
                            animateMapToShowTests();
                        },4000);
                        window.setTimeout(function() {
                            addTestToMap(newTests[1]);
                            animateMapToShowTests();
                        },7000);
                        window.setTimeout(function() {
                            addTestToMap(newTests[0]);
                            animateMapToShowTests();
                        },10000);
                    }

                    animateMapToShowTests();

                    //map.updateSize();
                });
    }
    window.setTimeout(function () {
        window.setInterval(function() {refreshOpenTests(false);}, 3000);
    }, 10000);
    refreshOpenTests(true);
    
    
    window.setTimeout(function() {
        map.updateSize();
    },1)
    $(window).resize(function() {
        map.updateSize();
    })
    $(".menu-trigger #trigger").click(function() {
        //resize whenever mobile menu is opened/closed
        window.setTimeout(function() {
            map.updateSize();
        },10);
        window.setTimeout(function() {
            map.updateSize();
        },200); 
        window.setTimeout(function() {
            map.updateSize();
        },500); 
    })
    
    if (fullscreenMap) {
        //change map location, resize, delete the rest
        switchToFullscreenMap();
    }
}

var originalMapStyle=null;
function switchToFullscreenMap() {
    var mapElem = $("#newtestsmap");

    fullscreenMap = true;
    if (screenfull.enabled) {
        if (originalMapStyle === null) {
            originalMapStyle = mapElem.attr("style");
        }
        mapElem.attr("style", "width:100%;height:100%;position:fixed");
        $("body").addClass("fullscreenMap");
        screenfull.request(mapElem[0]);
        addCurrentTestStatistics();

        //reset css/style when leaving fullscreen
        //https://stackoverflow.com/questions/10706070/how-to-detect-when-a-page-exits-fullscreen
        var onFullScreenChange = function () {
            var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
            if (!fullscreenElement) {
                mapElem.attr("style", originalMapStyle);
                $("body").removeClass("fullscreenMap")
                map.updateSize();
                fullscreenMap = false;
                
                document.removeEventListener("fullscreenchange", onFullScreenChange, false);
                document.removeEventListener("webkitfullscreenchange", onFullScreenChange, false);
                document.removeEventListener("mozfullscreenchange", onFullScreenChange, false);
            }
        };

        document.addEventListener("fullscreenchange", onFullScreenChange, false);
        document.addEventListener("webkitfullscreenchange", onFullScreenChange, false);
        document.addEventListener("mozfullscreenchange", onFullScreenChange, false);

    }


}

/**
 * Add current test statistics to the map container, but only once!
 */
var currentTestStatisticsAdded = false;
function addCurrentTestStatistics() {
    if (currentTestStatisticsAdded) {
        return;
    }
    currentTestStatisticsAdded = true;
    
    //add div to display
    $("#fullscreenTestStatistics").prependTo("#newtestsmap");
    $("#fullscreenTestStatistics").show();
    
    var template = Handlebars.compile($("#fullscreenTestStatistics").html());

    var currentStatistics={};
    var refreshDisplay = function () {
        var data = {
            tests30min: currentStatistics["30min"],
            tests24h: currentStatistics["24h"],
            Lang30min: Lang.getString("TestsInTheLastXMinutes").replace("%", "30"),
            Lang24h: Lang.getString("TestsInTheLastXHours").replace("%", "24"),
            currentTime: Date.now()
        };

        var html = template(data);
        $("#fullscreenTestStatistics").html(html);
    }
    var refreshStatistics = function () {
        $.getJSON(statisticProxy + "/" + statisticpath + "/opentests/statistics",
                function (data) {
                    currentStatistics = data;
                }
        );
    };
    
    window.setInterval(refreshDisplay, 1000);
    window.setInterval(refreshStatistics, 3000);
    refreshDisplay();
    refreshStatistics();
    
        
}


function loadMarker(openTestUUID) {
    var json_data = {
        language: selectedLanguage,
        open_test_uuid: openTestUUID.substring(1)
    };
    json_data = addCapabilities(json_data);

    $.ajax({
        //url : "http://localhost:8080/RMBTMapServer/tiles/markers",
        url: mapProxy + "/tiles/markers",
        type: "post",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify(json_data),
        success: function (data, textStatus, jqXHR) {
            if (data.measurements && data.measurements[0]) {
                addMarkerV3(data.measurements[0].lat, data.measurements[0].lon, data.measurements);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(Lang.getString("Error") + ": " + Lang.getString("CheckConnection") + ". \n(" + xhr.status + " " + thrownError + " " + ajaxOptions + ")");
        }
    });
}


function convertLongLatToOpenLayersPoint(long,lat) {
    return ol.proj.transform([long, lat], 
                'EPSG:4326', 'EPSG:3857');
}

/**
 * Get the most recent tests from opendata and
 * display them in the Statistik-Page
 */
function getLastOpenDataResults() {
    var data = "";
    if (userServerSelection > 0) {
        data = "&user_server_selection=" + userServerSelection;
    }
    $.ajax({
        url: statisticProxy + "/" + statisticpath + "/opentests/search?max_results=" + most_recent_tests + data,
        type: 'GET',
        dataType: 'json',
        cache: false,
        statusCode: {
            404: function(data) {
                //remove the spinner
                //by calling the same function that invoked it
                $('#spinner').spin('modal');
            },
            400: function(data) {
                //remove the spinner
                //by calling the same function that invoked it
                $('#spinner').spin('modal');
                alert("invalid parameter");
            }
        },
        success: function(data) {
            //for each opentest in the "openTests"-table
            var tests = data.results;
            //empty so that refresh does not append to existing results
            $("#verlauf tbody").empty();
            for (var i = 0; i < tests.length; i++) {
                 $("#verlauf tbody").append(getOpenDataRow(tests[i],false));
            }
            //link table rows
            $('#verlauf tbody tr').click( function() {
                window.location = $(this).find('a').first().attr('href');
            });
        }
    });
}


/* From Karte.js */

//add datetime helper
Handlebars.registerHelper('formatDate', function (timestamp) {
    var d = new Date(timestamp);
    return moment(d).format(Lang.getString('map_index_dateformat'));
});

function addMarkerV3(lat, lon, data) {
    var coordinate = [lat, lon];
    markers.setPosition(coordinate);

    var template = Handlebars.compile($("#markerTemplate").html());
    var html = template({
        data: data
    });

    
    markers.show(coordinate, html);
}