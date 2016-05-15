
//deprecated
/* function resetzip(newzip) {
        $('#yourzip .error').html('');
        if (newzip.length == 0) {
                setCookie('RMBTzip', '0000', null);
                bValid = false;
        }
        else if (newzip.length == 4) {
                var regexp = /^([0-9])+$/;
                if (!regexp.test(newzip)) {
                        var tmp = (selectedLanguage=='de')?'Die Posleitzahl darf nur aus Zahlen von 0 - 9 bestehen.':'The post code can only contain numbers 0 - 9.';
                        $('#yourzip .error').html(tmp);
                        $('#yourzip input').css('background-color','#DC0000');
                        $('#yourzip input').css('color','#FFFFFF');
                        setTimeout(function(){$('#yourzip input').css('background-color','transparent');$('#yourzip input').css('color','#00000');},2000)
                }
                else {
                        setCookie('RMBTzip', newzip, null);
                        $('#yourzip input').val(newzip);
                        $('#yourzip input').css('background-color','#3CC828');
                        $('#yourzip input').css('color','#FFFFFF');
                        var tmp = (selectedLanguage=='de')?'gespeichert':'saved';
                        $('#yourzip .error').html(tmp);
                        setTimeout(function(){$('#yourzip input').css('background-color','transparent');$('#yourzip input').css('color','#00000');$('#yourzip .error').html('');},2000)
                        
                }
        }
        else {
                var tmp = (selectedLanguage=='de')?'Die Postleitzahl muss 4-stellig sein.':'The postal code must be 4 digits.';
                $('#yourzip .error').html(tmp);     
                $('#yourzip input').css('background-color','#DC0000');
                $('#yourzip input').css('color','#FFFFFF');
                setTimeout(function(){$('#yourzip input').css('background-color','transparent');$('#yourzip input').css('color','#00000');},2000)
        }
} */

function resetndt() {
        //console.log(value);
        //console.log($('#RMBTndtID').attr("checked"));
        
        if ($("#RMBTndtID").attr("checked") == 'checked') {
                show_ndtpopup();
                //setCookie('RMBTndt', '1', 365 * 20);
        }
        else {
                setCookie('RMBTndt', '0', 365 * 20);
                saveFormValues();
        }
}

function show_second_ndtpopup() {
        document.getElementById("popupform").innerHTML = "";
        $(".iwill").detach();
	var longtext;
	
	var tmp = (selectedLanguage=='de')?ndt_short_de:ndt_short_en;
	var tmp2 = (selectedLanguage=='de')?'Ich möchte zusätzlich den optionalen, vertiefenden NDT-Test ausführen.':'I wish to run the optional NDT-Test.';
	
	
	$("#popupform").append(
		'<div id="terms_check" style="margin-top:20px;">' +
			'<div class="longtext">' +
				'<p>'+tmp+'</p>' +
				'<p>' +
					'<form action="javascript:void(0);" class="ndtform">' +
						'<input type="checkbox" name="form_ndt" id="form_ndt" class="text ui-widget-content ui-corner-all" />' +
						'<label for="form_ndt">&nbsp;'+tmp2+'</label>' +
					'</form>' +
				'<p>' +
			'</div>' +
		'</div>'
		);
	
	
	

	
        var bValid = false;
	var tmp_title = (selectedLanguage=='de')?'NDT-Test':'NDT-Test';
	var tmp_decline = (selectedLanguage=='de')?'Abbruch':'Decline';
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
        setCookie("RMBTndt", '0', 365 * 20 * 24 * 3600);
        $('#RMBTndtID').attr('checked',false);
        saveFormValues();
		$(this).dialog("close");
		//show_ndtpopup()
            
	};
	dialog_buttons[tmp_agree] = function() {
	        bValid = true;
	        //console.log(terms_accepted);
        
                
                if ($('#form_ndt').attr('checked')) {
                        setCookie("RMBTndt", '1', 365 * 20 * 24 * 3600);
                        saveFormValues();
                }
                else {
                        setCookie("RMBTndt", '0', 365 * 20 * 24 * 3600);
                        $('#RMBTndtID').attr('checked',false);
                        saveFormValues();
                }
                $(this).dialog("close");
	};
	
    $("#form_ndt").unbind('change');
    $("#form_ndt").change(function() {
        if ($('#form_ndt').attr('checked')) {
            $("button:contains('" + tmp_agree + "')").button("enable");
        }
        else {
            $("button:contains('" + tmp_agree + "')").button("disable");
        }
    })
	
	
	$("#popupform").dialog({
		autoOpen : false,
		title : tmp_title,
		modal : true,
		draggable : false,
		resize : false,
		minHeight : 200,
		minWidth : 350,
		width : 780,
		height : 510,
		close : closeFunc,
		buttons : dialog_buttons
	});
    $("button:contains('" + tmp_agree + "')").button("disable");
    
        //setCookie('RMBTndt', '1', 365 * 20);
        //$(this).dialog("close");
}

function show_ndtpopup() {
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
	
	
	
	var tmp_title = (selectedLanguage=='de')?'Datenschutzpraxis und Nutzungsbedingungen':'Privacy Policy and Terms of Use';
	var tmp_decline = (selectedLanguage=='de')?'Abbruch':'Decline';
	var tmp_agree = (selectedLanguage=='de')?'Zustimmung':'Agree';
	var dialog_buttons = {}; 
	/*
	dialog_buttons[tmp_decline] = function() {
	        setCookie('RMBTndt', '0', 365 * 20);
	        $('#RMBTndtID').attr('checked',false);
	        $(this).dialog("close");
	};
	*/
	dialog_buttons[tmp_agree] = function() {
	        show_second_ndtpopup();
	        
	};
	
	closeFunc = function() {
		$('#RMBTndtID').attr('checked',false);
		$(this).dialog("close");
	}
	
	$("#popupform").dialog({
		autoOpen : false,

		title : tmp_title,

		modal : true,
		draggable : false,
		resize : false,

		minHeight : 200,
		minWidth : 350,

		width : 780,
		height : 510,
		close : closeFunc,
		buttons : dialog_buttons
		
	});
	tmp = (selectedLanguage=='de')?tc_agree_de:tc_agree_en;
	//$("#popupform").append('<p class="iwill">'+tmp+'</p>');
	$(".iwill").detach();
	$(".ui-dialog-buttonpane").append('<p class="iwill">'+tmp+'</p>');
	$("#popupform").dialog("open");
}

function loadFormValues() {
    loadUserConfiguration();
    
    var checkOrUncheckInput = function(input, check) {
        if (check)
            $("#preferredTestForm input[name=" + input + "]").attr("checked","checked");
        else
            $("#preferredTestForm input[name=" + input + "]").removeAttr("checked","checked");
    }
    
    checkOrUncheckInput("qos", UserConf.runQos);
    checkOrUncheckInput("preferredTest][value=websocket", UserConf.preferredTest === TestTypes.Websocket);
    checkOrUncheckInput("preferredTest][value=Java", UserConf.preferredTest === TestTypes.Java);
    checkOrUncheckInput("RMBTndt", UserConf.runNdt);
    
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


function loadServerList() {
    var json = {
        "language": "en",
        "name": "RTR-Netztest",
        "terms_and_conditions_accepted": "true",
        "type": "DESKTOP",
        "uuid": "8aadf45b-0b6c-415c-bf1f-37e285a6de05",
        "version_code": "1",
        "version_name": "0.1",
        "user_server_selection" : userServerSelection
    };
    
     $.ajax({
        url: controlProxy + "/" + wspath + "/settings",
        type: "post",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify(json),
        success: function (data) {
            $.each(data.settings[0].servers_ws,function(i,val) {
                var listElem = $("<li></li>");
                var label = $("<label></label>");
                var radio = $("<input />")
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
                $("#testserverForm ul").append(listElem);
            });
            
            //attach change handler
            $("#testserverForm input").change(function () {
                //saveFormValues();
                //updateForm();
                $("#saveNotification").hide();
            })
        }
    });
}

$(document).ready(function() {
        var cookie_uuid = getCookie('RMBTuuid');
        if (cookie_uuid) {
                //var tmp = (selectedLanguage=='de')?'Ihre UUID lautet: ':'Your UUID is: ';
                $('#youruuid').append(' U'+cookie_uuid);
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
        
        loadServerList();
});