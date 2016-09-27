var PageIndex = (function () {
    /* 
     * onClick: Menu
     */
    var onClickMenu = function(menu) {
        $(".pages").hide();
        $("#" + menu).show();        
    };
    
    return {
        onClickMenu: onClickMenu
    };
})();

// When page loaded
$(function () {
    // Shows Intro page.
    $("#intro").show();
});
