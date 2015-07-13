var most_recent_tests = 10;

$(document).ready(function() {
    var mobile_client = navigator.userAgent;
    //is it android?
    if (mobile_client.match(/Android|Opera M(obi|ini)|Dolfin|Dolphin/g)) {
        //@TODO: Save links somewhere else
        var url = 'https://play.google.com/store/apps/details?id=at.alladin.rmbt.android';
        $("#teaserlinkStart a").attr("href",url);
        $("#hint-jstest").show();
    }

    //is it iOS?
    if (mobile_client.match(/iP(hone|od|ad)/g)) {
        $("#iOSApp").show();
        var url = 'https://itunes.apple.com/at/app/rtr-netztest/id724321403';
        $("#teaserlinkStart a").attr("href",url);
        $("#hint-jstest").show();
    } 
    
    getLastOpenDataResults();
});

/**
 * Get the most recent tests from opendata and
 * display them in the Statistik-Page
 */
function getLastOpenDataResults() {
    var data = "";
    if (developerCode > 0) {
        data = "&developer_code=" + developerCode;
    }
    $.ajax({
        url: controlProxy + "/" + statisticpath + "/opentests/search?max_results=" + most_recent_tests + data,
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