exports.language = "en";
exports.strings = {
    "lang": "en",
    "title": {
        "netztest": "RTR - NetTest",
        "qostest": "QosTest"
    },
    "headline" : {
        "netztest" : "RTR-NetTest",
        "qostest" : "www.qostest.eu"
    },
    "index_content": {
        "service_description": {
            "netztest": "The RTR-NetTest informs users about the current service quality (including upload, download, ping, signal strength) of their Internet connection. In addition, a map view and statistics of previous tests can be accessed.",
            "qostest": "qostest.eu informs users about the current service quality (including upload, download, ping, signal strength) of their Internet connection. In addition, a map view and statistics of previous tests can be accessed."
        },
        "tos": {
            "text": "Privacy Policy and Terms of Use",
            "url": {
                "netztest": "https://www.netztest.at/redirect/en/terms",
                "qostest": "https://www.netztest.at/redirect/en/terms"
            }
        },
        "apps_content": 'Download <a href="https://itunes.apple.com/at/app/rtr-netztest/id724321403">iOS</a> or <a href="https://play.google.com/store/apps/details?id=at.alladin.rmbt.android">Android </a> App or conduct the <a href="https://www.rtr.at/en/tk/rtrnetztest_tests">browser test</a>.',
        "apps_url" : "https://www.rtr.at/en/tk/rtrnetztest_tests",
        "apps" : {
            "netztest" : "App and Browser Test",
            "qostest" : "NetTest Apps"
        },
        "apps_alt" : "RTR-NetTest app",
        "select_version" : "Select version",
        "test_section" : {
            "heading" : "Start RTR-NetTest",
            "alt" : {
                "netztest" : "RTR-NetTest teaser",
                "qostest" : "qostest teaser"
            },
            "source" : {
                "netztest" : "../img/rtr-netztest/rtr-netztest.png",
                "qostest" : "../img/qostest/qostest-start.png"
            },
            "start" : "Start"
        },
        "statistics_alt" : "Statistics teaser",
        "map": "Map view",
        "map_content" : "Map with test results",
        "help_content" : "Detailled background information",
        "statistics_content" : "Statistics on the test results",
        "enlarge_map" : "Enlarge map"
    },

    "map_content" : {
        "teaser" : {
            "netztest" : 'This map shows the existing RTR-NetTest results,  it is not always possible to draw conclusions on the broadband coverage. Additional information can be found  <a href="https://www.rtr.at/en/tk/netztestfaq_karte#c26190">here</a>.',
            "qostest" : 'This map shows the existing qostest.eu results, it is not always possible to draw conclusions on the broadband coverage. Additional information can be found <a href="https://www.rtr.at/en/tk/netztestfaq_karte#c26190">here</a>.'
        },
        "search_address" : "Search for an address or city",
        "large_view" : "Large view"
    },

    "statistics_content" : {
        "teaser" : {
            "netztest" : 'The values listed here represent the RTR-NetTest results.     Additional information can be found <a href="https://www.rtr.at/en/rtr/netztestfaq_testergebnis#c26545">here</a>.',
            "qostest" : 'The values listed here represent the qostest.eu results.     Additional information can be found <a href="https://www.rtr.at/en/rtr/netztestfaq_testergebnis#c26545">here</a>.'
        },
        "operators_from" : "Operators from",
        "disclaimer" : 'Repeated tests are filtered for the compilation of statistics.',
        "opendata_disclaimer" : 'Please note: <a href="Opendata.html">raw data available</a> as open data',
        "burgenland" : 'Burgenland',
        "carinthia" : 'Carinthia',
        "lower_austria" : 'Lower Austria',
        "upper_austria" : 'Upper Austria',
        "salzburg" : 'Salzburg',
        "styria" : "Styria",
        "tyrol" : "Tyrol",
        "vorarlberg" : "Vorarlberg",
        "vienna" : "Vienna",
        "all_states" : "All provinces",
        "enddate" : "End date"
    },

    "history_content" : {
        "request_code" : "Request synchronization code",
        "enter_code" : "or enter a known synchronization code in the input box below and confirm your entry by clicking on submit"
    },

    "opentest_content" : {
        "measurement_result_from" : "Measurement result from"
    },

    "opentests_content" : {
        "network_name" : "Mobile network (Display)",
        "mobile_provider_name" : "Mobile operator",
        "sim_home_country" : "SIM home country",
        "sim_mcc_mnc" : "SIM-MCC-MNC",
        "country_geoip" : "Country (IP)",
        "public_ip_as_name" : "Network name (AS)",
        "software_version" : "Software version",
        "next_page" : "Next page",
        "results" : "results",
        "network_country" : "Country",
        "gkz" : "Austrian community ID",
        "pinned_true" : "Included in statistics",
        "pinned_false" : "Not included in statistics"
    },

    "options_content" : {
        "your_uuid" : "Your UUID is",
        "preferred_test_type" : "Preferred Test Type",
        "choose_server_desc" : "Please choose which server should be used for conducting the WebSocket-based test.",
        "config_saved" : "The configuration has been saved.",
        "run_ndt" : "I wish to run the optional NDT-Test."
    },

    "opendata_content" : {
        "open_data_specification" : "Open Data Interface Specification",
        "content_block" : 'In compliance with the RTR-NetTest privacy policy the measurement results of the RTR-NetTest are available as Open Data. The <a href="/en/OpenDataSpecification.html">specification is available as HTML</a>. This specification describes the information which is available as Open Data. It is available as JSON and as CSV-file (see below).',
        "csv_interface" : 'CSV interface',
        "recent_tests_hours" : 'The results of the last 48 hours are available as zip-archive under <a href="/RMBTStatisticServer/export/netztest-opendata_hours-048.zip" title="RTR-Netztest Open Data 48h" target="_blank" class="external-link-new-window">netztest-opendata_hours-048.zip</a>.',
        "recent_tests" : 'The results of the last 31 days are available as zip-archive under <a href="/netztest-opendata.zip" title="RTR-Netztest Open Data" target="_blank" class="external-link-new-window">netztest-opendata.zip</a>.',
        "further_results" : "Further results are available on a monthly basis:",
        "note_timestamp" : "Please note that time stamps are in UTC (not in local time). To ensure the correctness of the results, implausible and/or obvious abusive measurements may be marked with the flag 'implausible' by RTR.",
        "license_text" : 'The data is published under the <a href="http://creativecommons.org/licenses/by/3.0/at/deed.en" target="_blank" class="external-link-new-window">Creative Commons Attribution 3.0 Austria (CC BY 3.0 AT)</a> license.'
    },

    //Page titles and link descriptions
    "index": "Home",
    "statistics": "Statistics",
    "history": "History",
    "map": "Map view",
    "options": "Options",
    "opentest": "Open data measurement result",
    "opentests": "Open data measurement results",
    "opendata": "Open data",
    "help": "Help",
    "help_url": "https://www.rtr.at/en/tk/netztesthilfe",
    "imprint" : "Publishing information",
    "imprint_url" : "https://www.rtr.at/en/rtr/impressum",
    "menu" : "Menu",

    //common words
    "top" : "Top",
    "print" : "Print",
    "time": "Time",
    "operator": "Operator",
    "device": "Device",
    "up": "Up",
    "down": "Down",
    "ping": "Ping",
    "signal": "Signal",
    'mbps': 'Mbps',
    'ms': 'ms',
    'dBm': 'dBm',
    'dB': 'dB',
    'X_recent_tests': "%X% recent tests",
    'recent_tests': "Recent tests",
    'more' : "more",
    'less' : "less",

    "automatic" : "Automatic",
    "heatmap" : "Heatmap",
    "points" : "Points",
    "shapes" : "Shapes",
    "communities" : "Communities",
    "sources" : "Sources",

    "please_select" : "Please select",
    "address_not_distinct" : "Address not distinct",
    "map_key" : "Map key",
    "search" : "Search",

    "further_tests" : "Further tests",
    "austria" : "Austria",

    "1_day" : "1 day",
    "1_week" : "1 week",
    "1_month" : "1 month",
    "X_months" : "%X% months",
    "1_year" : "1 year",
    "X_years" : "%X% years",
    "type" : "Type",
    "mobile" : "Mobile",
    "wifi_test" : "WLAN (App)",
    "browser" : "Browser",
    "time_span" : "Time span",
    "technology" : "Technology",
    "mixed" : "Mixed",
    "quantile" : "Quantile",
    "X_m" : "%X% m",
    "X_km" : "%X% km",
    "quantity" : "Quantity",
    "location_accuracy" : "Location accuracy",
    "any" : "any",
    "name" : "Name",
    "all" : "All",
    "devices" : "Devices",
    'open_uuid': 'Open-User-UUID',
    "begin" : "begin",
    "end" : "end",
    "pinned" : "Pinned",

    "access" : "Access",
    "date" : "Date",
    "synchronization_code" : "Synchronization code",
    "code" : "Code",
    "submit" : "Submit",

    "quality_of_service" : "Quality of Service",
    "details" : "Details",
    "detailed_results" : "Detailed results",
    "position" : "Position",
    "speed_curve" : "Speed curve",
    "download" : "Download",
    "upload" : "Upload",
    "speed" : "Speed",
    "data_volume" : "Data volume",
    "signal_strength" : "Signal strength",
    "connection_technology" : "Connection Technology",
    "share" : "Share",
    "get_forum_banner" : "Get forum banner",
    "send_email" : "Send email",
    "open_data_entry" : "Open data entry",

    "measurement_result" : "Measurement result",
    "detailed_measurements" : "Detailed measurements",
    "measurements" : "Measurements",
	"measurement": "Measurement",
    "moreInfo" : "More Info",
	"net": "Net",

    "websocket" : "WebSocket",
    "java_applet" : "Java-Applet",
    "default_server" : "Default Server",
    "save" : "Save",

    "test_results" : "Test results",
    "advanced_search" : "Advanced search",
    "from" : "from",
    "up_to" : "up to",
    "zip_code" : "Zip code",
    "platform" : "Platform",
    "software_version" : "Software version",
    "asn" : "AS number",
    "apply_filters" : "Apply filters",
    "reset" : "Reset",
    "histogram" : "Histogram",

    "coordinates": "Coordinates",
    "provider" : "Provider"
}