
$(document).ready(function() {
    //if website doesn't need menu --> don't display it
    //usage: add #noMMenu to the URL

    function getCookie(e){var t,n,r,i=document.cookie.split(";");for(t=0;t<i.length;t++){n=i[t].substr(0,i[t].indexOf("="));r=i[t].substr(i[t].indexOf("=")+1);n=n.replace(/^\s+|\s+$/g,"");if(n==e){return unescape(r)}}}function setCookie(e,t,n){var r=new Date;var i=r.getTime();i+=n*1e3;r.setTime(i);var s=escape(t)+(n==null?";":"; expires="+r.toUTCString()+";");document.cookie=e+"="+s+" path=/; secure"};
    if (getCookie("noMenu") === "noMenu") {
        hideMenu();
    }
    if (window.location.hash && window.location.hash.length > 0 && window.location.hash.indexOf("noMMenu") >= 0) {
        setCookie("noMenu","noMenu",60*60*24);
        hideMenu();
    }


    linkLanguageSwitcherToCurrentPage();

    //add link to homepage
    //$("#mm-netztestmenu ul").prepend("<li><a href='/'><strong>" + $("#netztestmenu").parent().children("a").first().html() + "</strong></a></li>");
});

/**
 * Close the menu
 * Since an *experimental* menu is now used for production that does not implement ANY hooks,
 * we have to do this by hand :-(
 * (window.mlPushMenu) - https://github.com/codrops/MultiLevelPushMenu/blob/master/js/mlpushmenu.js
 */
function hideMenu() {
    $("div#mp-pusher").css("transform","none");
    $("div#mp-pusher>nav#mp-menu").hide();
    $("div.menu-trigger").hide();
    $("div#mp-pusher>div.scroller").css("width","100%");
    $("div.wrapper").css("margin-left","5%");
    $("div.wrapper").css("margin-right","5%");
    $("div.wrapper").css("width","90%");
    $("div.header-container").hide();
    $("div.banner-container").hide();
    $("h1.main-article-header").hide();
}

/**
 * Set the correct link to the current page for the
 * language dropdown
 */
function linkLanguageSwitcherToCurrentPage() {
    var cPage = window.location.pathname + window.location.search + window.location.hash;
    cPage = cPage.substr(4);
    $(".language-select option[data-lang-name='en']").attr("data-href","/en/" + cPage);
    $(".language-select option[data-lang-name='de']").attr("data-href","/de/" + cPage);
}