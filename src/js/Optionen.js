var urls = {
    control_ipv4_only: null,
    control_ipv6_only: null,
    url_ipv4_check: null,
    url_ipv6_check: null
};

function loadFormValues() {
    loadUserConfiguration();
    
    var checkOrUncheckInput = function(input, check) {
        if (check)
            $("#optionsForm input[name=" + input + "]").attr("checked","checked");
        else
            $("#optionsForm input[name=" + input + "]").removeAttr("checked","checked");
    }
    
    checkOrUncheckInput("qos", UserConf.runQos);
    checkOrUncheckInput("preferredTest][value=websocket", UserConf.preferredTest === TestTypes.Websocket);
    checkOrUncheckInput("preferredTest][value=Java", UserConf.preferredTest === TestTypes.Java);
    checkOrUncheckInput("RMBTndt", UserConf.runNdt);

    $("#optionsForm input[name='ipversion']").filter("[value='" + UserConf.ipVersion + "']").attr("checked","checked");

    if (UserConf.fixedDownloadThreads) {
        $("#threads_dl").val(UserConf.fixedDownloadThreads);
    }
    if (UserConf.fixedUploadThreads) {
        $("#threads_ul").val(UserConf.fixedUploadThreads);
    }

    updateForm();
}

function saveFormValues() {    
    //ndt
    var cookie_ndt = getCookie('RMBTndt');
	if (cookie_ndt == '1') {
        UserConf.runNdt = true;
    }
    else {
        UserConf.runNdt = false;
    }
    
    //qos
    if ($("#preferredTestForm input[name=qos]:checked").length === 1) {
        UserConf.runQos = true;
    }
    else {
        UserConf.runQos = false;
    }
    
    //preferred test
    if ($("#preferredTestForm input[name=preferredTest]:checked").size() > 0) {
        UserConf.preferredTest = $("#preferredTestForm input[name=preferredTest]:checked").val();
    }
    else {
        UserConf.preferredTest = TestTypes.Websocket;
    }
    
    //preferred test server
    UserConf.preferredServer = $("#testserverForm input[name=testserver]:checked").val();

	//preferred IP version
    UserConf.ipVersion = $("#ipversionForm input[name=ipversion]:checked").val();
    switch (UserConf.ipVersion) {
        case "default":
            UserConf.overrideControlServer = false;
            break;
        case "ipv4":
            UserConf.overrideControlServer = "https://" + urls.control_ipv4_only;
            break;
        case "ipv6":
            UserConf.overrideControlServer = "https://" + urls.control_ipv6_only;
            break;
    }

    //fixed test threads
    var fixedDownloadThreads = $("#threads_dl").val();
    var fixedUploadThreads = $("#threads_ul").val();

    if (fixedDownloadThreads) {
        UserConf.fixedDownloadThreads = parseInt(fixedDownloadThreads);
    }
    else {
        UserConf.fixedDownloadThreads = null;
    }

    if (fixedUploadThreads) {
        UserConf.fixedUploadThreads = parseInt(fixedUploadThreads);
    }
    else {
        UserConf.fixedUploadThreads = null;
    }
    
    setCookie("RMBTOptions", JSON.stringify(UserConf), 365 * 20 * 24 * 3600);
    
    $("#saveNotification").slideDown();
    
    return false;
}

function updateForm() {
    if ($("#preferredTestForm input[name=preferredTest]:checked").val() === "Java") {
        $("#preferredTestForm .submenu input").removeAttr("disabled");
    }
    else {
        $("#preferredTestForm .submenu input").attr("disabled", "disabled");
    }

}

function loadServerValues() {
    var json = {
        "language": "en",
        "name": "RTR-Netztest",
        "terms_and_conditions_accepted": "true",
        "type": "DESKTOP",
        "uuid": "8aadf45b-0b6c-415c-bf1f-37e285a6de05",
        "version_code": "1",
        "version_name": "0.1",
        "user_server_selection" : true
    };
    
     $.ajax({
        url: controlProxy + "/" + wspath + "/settings",
        type: "post",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify(json),
        success: function (data) {
            //ipv4, ipv6
            urls = data.settings[0].urls;

            //server list
            $.each(data.settings[0].servers_ws,function(i,val) {
                var listElem = $("<div class='radio'></div>");
                var label = $("<label></label>");
                var radio = $("<input />");
                radio.attr("type","radio");
                radio.attr("name","testserver");
                radio.attr("value",val.uuid);                
                //check if chosen by user
                if (val.uuid === UserConf.preferredServer) {
                    radio.attr("checked", "checked");
                }
                
                label.append(radio);
                label.append(" " + val.name);
                listElem.append(label);
                $("#testserverForm #serverList").append(listElem);
            });
            
            //attach change handler
            $("#optionsForm input").change(function () {
                //saveFormValues();
                //updateForm();
                $("#saveNotification").hide();
            })

            checkIPConnectivity();
        }
    });
}

/**
 * Check, if connections over both IPv4 and IPv6 are possible
 */
function checkIPConnectivity () {
    var checkVersion = function(version, url) {
        $.ajax({
            url: url,
            type: "post",
            dataType: "json",
            data: JSON.stringify({
                language: selectedLanguage
            }),
            contentType: "application/json",
            success: function(data) {
                $("#optionsForm input[name='ipversion']").filter("[value='" + version + "']").removeAttr("disabled");
                console.log("success" + version);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("error" + version);
            }
        })
    };
    checkVersion("ipv4", urls.url_ipv4_check);
    checkVersion("ipv6", urls.url_ipv6_check);
}

$(document).ready(function() {
        var cookie_uuid = getCookie('RMBTuuid');
        if (cookie_uuid) {
                //var tmp = (selectedLanguage=='de')?'Ihre UUID lautet: ':'Your UUID is: ';
                $('#youruuid').append(' U'+cookie_uuid);
        }
        else {
            $('#youruuid').append(Lang.getString("NoUUID") + ".");
        }
        
        //deprecated
        /* var cookie_zip = getCookie('RMBTzip');
        if (cookie_zip) {
                //var tmp = (selectedLanguage=='de')?'Ihre eingegebene Postleitzahl lautet: ':'Your postal code entered is: ';
                //$('#yourzip label').html(tmp);
                if (cookie_zip == '0000') 
                        cookie_zip_view = '';
                else cookie_zip_view = cookie_zip;
                $('#yourzip input').val(cookie_zip_view);
        } */
        
        //var tmp = (selectedLanguage=='de')?'Erweiterten Test durchführen':'I wish to run the optional NDT-Test.';
        //$('#yourndt label').html(tmp);
        
        

		var cookie_ndt = getCookie('RMBTndt');
		if (cookie_ndt == '1') {
			$('#yourndt input').attr('checked',true);        
		}
		else {
			$('#yourndt input').attr('checked',false);
        }
        
        $("#preferredTestForm input").change(function() {
            saveFormValues();
            updateForm();
        });
        
        loadFormValues();
        
        loadServerValues();

        //show, if a server is set
        if (UserConf.preferredServer && UserConf.preferredServer !== "default") {
            $("#testserverForm").show();
        }

    //show, if threading is set
    if (UserConf.fixedUploadThreads) {
        $("#threadsForm").show();
    }
});