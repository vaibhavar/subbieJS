(function () {

    /**
     * Handler for context menu
     * Sends a message to tab asking content script to show subbie player
     */
    function handleContextMenuClick(oInfo, oTab){
        chrome.tabs.sendMessage(oTab.id, {
            showSubbie: true
        }, function(){
           // Callback from tab
        });
    }

    chrome.contextMenus.create({
        title: "+Subbie",
        contexts: ["page", "video"],
        onclick: handleContextMenuClick
    });

})();