"use strict"

var most_recent_tests = 5;
var bootstrap_datepicker_path = '/lib/bootstrap-datepicker/';

$(document).ready(function() {
        //$.support.cors = true;
        requestBrowserData('RMBTstatistics');
        getLastOpenDataResults();
        //refresh every 30s
        setInterval(getLastOpenDataResults, 30000);

        //set up enddate field
        Modernizr.load({
            test: Modernizr.inputtypes.date,
            nope: [bootstrap_datepicker_path + 'bootstrap-datepicker.min.js',
                bootstrap_datepicker_path + 'bootstrap-datepicker.de.min.js',
                bootstrap_datepicker_path + 'bootstrap-datepicker3.standalone.min.css'],
            yep: function() {
                //disable jquery ui datepicker
                $('#statistik_enddate').datepicker('disable');
            },
            complete: function () {
                //enable bootstrap datepicker
                $('#statistik_enddate').datepicker({
                    language: selectedLanguage,
                    format: "yyyy-mm-dd",
                    todayHighlight: true,
                    autoclose: true
                });
            }
        });

        //set up "show more"-Button
        $("#show_more_button").click(function() {
            //switch label
            var tmp = $("#show_more_button").text();
            $("#show_more_button").text($("#show_more_button").attr("data-alternate"));
            $("#show_more_button").attr("data-alternate",tmp);
            $("div.additional-fields").slideToggle();
            return false;
        });


        $.tablesorter.addParser({
            id: 'own',
            is: function (s) {
                // return false so this parser is not auto detected
                return false;
            },
            format: function (s, table, cell, cellIndex) {
                // format your data for normalization
                return s.toLowerCase()
                    .replace(/\D/, "")
                    .replace(/\./, "");
            },
            type: 'numeric'
        });
        
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
        $(window).resize(function() {
            adjustTablesToWindowSize();
        });
        
        adjustTimePeriods();
        $("#statistik_enddate").change(function() {
            var end_date = $("#statistik_enddate").val();
            if (end_date !== undefined && end_date !== null && end_date !== "") {
                adjustTimePeriods(end_date);
            }
        })

        $("#statistics_failure a").click(function(e) {
            e.preventDefault();
            $("#statistics_container").show();
            $("#statistics_failure").hide();
            requestBrowserData('RMBTstatistics');
        });
}); 


/**
 * Adjust time periods to represent calendar dates (e.g. 1 month should be 28-31 days)
 */
function adjustTimePeriods(enddate) {
    if (enddate === undefined) {
        enddate = moment();
    }
    else {
        enddate = moment(enddate);
    }
    $("#statistik_duration option").each(function (i, option) {
        var val = $(option).attr("value");
        $.each([{
                count: 30,
                unit: "months"
            },
            {
                count: 365,
                unit: "years"
            }], function (i, timespan) {
            if (val > 7 && (val % timespan.count <= 6)) {
                var units = Math.round(val/timespan.count);
                var then = moment(enddate).subtract(units,timespan.unit);
                
                //if the end of a month is selected - then should also be the end of a month!
                if (timespan.unit==="months" && 
                        moment(enddate).format("YYYY-MM-DD") === moment(enddate).endOf("month").format("YYYY-MM-DD")) {
                    then = then.endOf("month").startOf("day");
                }
                
                $(option).attr("value",moment(enddate).diff(then,"days"));
            }
        })
    })
}

function adjustTablesToWindowSize() {
    //var device_width = $(".text100").width();
    var device_width = $(".main-article").width();
    
    
    //decide which table to display as follows:
    //if device-width is large enough => display normal table
    //if device-width is too small for that but large enough for short provider names => display table_short
    //else: display table with captions inbetween
    $("#statistik_provider").show();
    if (device_width >= $("#statistik_provider").width()) {
        //default
        $("#statistik_provider").show();
        $("#statistik_provider_short").hide();
        $("#statistik_provider_captions").hide();
    }
    else {
        $("#statistik_provider").hide();
        $("#statistik_provider_captions").hide();
        //show table for jquery to be able to determine table width correctly
        $("#statistik_provider_short").show();

        //alert($("#statistik_provider_short").width() + ":" + $("#statistik_provider_captions").width() + ":" + $("#statistik_provider").width() + "<" + $(".text100").width());
        if (device_width < $("#statistik_provider_short").width()) {
            $("#statistik_provider_short").hide();
            $("#statistik_provider_captions").show();
        }
    }

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