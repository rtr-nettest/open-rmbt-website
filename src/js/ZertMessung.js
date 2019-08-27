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
}