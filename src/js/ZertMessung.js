var certTest = true;
var testsRunning = false;
var History = window.History;
var currentSession = Math.random();

$(document).ready(function() {
    var locationRule = function() {
        return $("#location_form_group :checked").length>0
    };

    $.validator.setDefaults({
        debug:true,
        onfocusout: function (e) {
            return true;
        },
        messages: {
            first_name: "Bitte geben Sie Ihren Vornamen an.",
            last_name: "Bitte geben Sie Ihren Nachnamen an.",
            address: null
        },
        errorElement: "span",
        errorPlacement: function ( error, element ) {
            // Add the `help-block` class to the error element
            error.addClass( "help-block" );

            if ( element.prop( "type" ) === "checkbox" ) {
                error.insertAfter( element.parent( "label" ) );
            } else {
                error.insertAfter( element );
            }
        },
        showErrors: function (errorMap, errorList) {
            this.defaultShowErrors();
        },
        highlight: function (element, errorClass, validClass) {
            $(element).parents(".form-group").addClass("has-error");
        },
        unhighlight: function (element, errorClass, validClass) {
            $(element).parents(".form-group").removeClass("has-error");
        },
    });
    $("#intermediate-form").validate();
    $("#additional-information-form").validate();

    step1();

    //bind history
    //bind browser navigation with history.js
    if (History) {
        History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
            var state = History.getState(); // Note: We are using History.getState() instead of event.state
            //steps are called all the time, but doesn't matter as there should not be problems with calling steps multiple times
            if (typeof state.data.step === "undefined") {
                step1();
            }
            else if (state.data.session !== currentSession) {
                //reset when from different session
                document.location="ZertMessung";
                document.location.reload();
            }
            else if (state.data.step === "step2") {
                step2();
            }
            else if (state.data.step==="step3") {
                step3();
            }
            else if (state.data.step==="step4") {
                step4();
            }
            else {

            }

            console.log(state)
        });
    };
});

function step1() {
    if (History) {
        History.replaceState({step:"step1", session: currentSession},"","ZertMessung?step1");
    }
    setBreadCrumb("intro");
    $('#intro-container').show();
    $('#intermediate-container').hide();
    $('#additional-information-container').hide();
    $('#loop-mode').hide();

    $("#intro-container button[type='submit']").click(function() {
        step2();
    })
}

function step2() {
    if (History) {
        History.pushState({step:"step2", session: currentSession},"","ZertMessung?step2");
    }
    setBreadCrumb("intermediate");
    $('#intro-container').hide();
    $('#intermediate-container').show();
    $('#additional-information-container').hide();
    $('#loop-mode').hide();

    $("#intermediate-form").submit(function() {
        if (!$("#intermediate-form").valid()) {
            return false;
        }

        if ($('input[name=\'first\']:checked').val() == 'y') {
            step3();
        } else {
            step4();
        }
        return false;
    })

    $('input[name=\'first\']').change(function() {
        if ($('input[name=\'first\']:checked').val() == 'y') {
            $("#intermediate-form button[type='submit']").text("Weiter");
        } else {
            $("#intermediate-form button[type='submit']").text("Zertifizierte Messung starten");
        }
    })
}

function step3() {
    if (History) {
        History.pushState({step:"step3", session: currentSession},"","ZertMessung?step3");
    }
    setBreadCrumb("additional");
    $('#intro-container').hide();
    $('#intermediate-container').hide();
    $('#additional-information-container').show();
    $('#loop-mode').hide();

    $("#additional-information-form").submit(function() {
        if (!$("#additional-information-form").valid()) {
            return false;
        }

        step4();

        return false;
    });
}

function step4() {
    if (History) {
        History.pushState({step:"step4", session: currentSession},"","ZertMessung?step4");
    }
    setBreadCrumb("measurement");
    $('#intro-container').hide();
    $('#intermediate-container').hide();
    $('#additional-information-container').hide();
    $('#loop-mode').show();

    if (!testsRunning) {
        testsRunning = true;
        conductTests();
    }
}

function certTestFinished() {
    setBreadCrumb("report");

   // $("#intermediate-form").ajaxForm();
   // $("#intermediate-form").ajaxSubmit();

    //submit form, wire link
    var formDataBasic = new FormData($("#intermediate-form")[0]);
    var formDataAdditional  = new FormData($("#additional-information-form")[0]);
    var formForSubmission;
    if ($('input[name=\'first\']:checked').val() == 'y') {
        var inputs = $('#intermediate-form input, #intermediate-form textarea');

        inputs.each(function() {
            formDataAdditional.append(this.name,$(this).val());
        });
        formForSubmission = formDataAdditional;
    }
    else {
        formForSubmission = formDataBasic;
    }
    formForSubmission.append("loop_uuid",loopUUID);

    //start with pdf progress
    //50 % upload, 50 % download
    var progressInterval;

    $.ajax({
        url: statisticProxy + "/" + statisticpath + "/export/pdf",
        method: "POST",
        data: formForSubmission,
        type: "post",
        cache: false,
        contentType: false,
        processData: false,
        dataType: "json",
        success: function (data) {
            console.log("received data");
            clearInterval(progressInterval);
            $("#pdfProgress").css('width','100%');
            $("#pdfProgress").text('100 %');
            window.setInterval(function() {
                $("#pdfProgressContainer").slideUp('medium');
            }, 500)

            //wire up download
            $("#report-link").attr('href',statisticProxy + "/" + statisticpath + "/export/pdf/" + data.file);
            $("#report-link").text('Ergebnisse als PDF herunterladen');
            $("#report-link").get(0).click();
        },
        xhr: function() {
            // get the native XmlHttpRequest object
            var xhr = $.ajaxSettings.xhr();
            // set the onprogress event handler
            xhr.upload.onprogress = function (evt) {
                var progress = Math.round((evt.loaded / evt.total * 50));
                $("#pdfProgress").css('width',progress+'%');
                $("#pdfProgress").text(progress+' %');
                console.log('progress', evt.loaded / evt.total * 100)
            };
            // set the onload event handler
            xhr.upload.onload = function () {
                var started = (new Date()).getTime();
                progressInterval = window.setInterval(function () {
                    var secondsPassed = ((new Date()).getTime() - started) / 1000;
                    var progress = Math.round(((secondsPassed / (secondsPassed + 10)) * 0.5 + 0.5) * 100);
                    $("#pdfProgress").css('width', progress + '%');
                    $("#pdfProgress").text(progress + ' %');
                }, 500);
            };
            // return the customized object
            return xhr ;
        }
    });
    console.log("queried for pdf");
}

function setBreadCrumb(name) {
    $(".breadCrumbs .activePage").removeClass("activePage");
    $(".breadCrumbs li").each(function(val, i) {
        if ($(this).hasClass("breadCrumb-" + name)) {
            $(this).addClass("activePage");
            return false;
        }
        else {
            $(this).addClass("visitedPage");
        }
    })
    $('h1')[0].scrollIntoView();
}