var certTest = true;
var testsRunning = false;

$(document).ready(function() {
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


});

function step1() {
    setBreadCrumb("intro");
    $("#intro-container").show();
    $("#intro-container button[type='submit']").click(function() {
        $('#intro-container').hide();
        step2();
    })
}

function step2() {
    setBreadCrumb("intermediate");
    $('#intermediate-container').show();
    $("#intermediate-form").submit(function() {
        if (!$("#intermediate-form").valid()) {
            return false;
        }

        $('#intermediate-container').hide();
        if ($('input[name=\'first\']:checked').val() == 'y') {
            step3();
        } else {
            step4();
        }
        return false;
    })
}

function step3() {
    setBreadCrumb("additional");
    $('#additional-information-container').show();
    $("#additional-information-form").submit(function() {
        $('#additional-information-container').hide();
        step4();

        return false;
    });
}

function step4() {
    setBreadCrumb("measurement");
    $('#loop-mode').show();
    if (!testsRunning) {
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