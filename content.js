//document.write('Hello from Subbie!');
(function () {
    var subbie =  {};
    /**
     * Function to create the Subbie player in DOM
     */
    function createSrtPlayer() {
        var sHtml = '<div id="subbie-player" class="subbie-player noFile">\
                        <div id="subbie-display"></div>\
                        <div id="subbie-slider"><input type="range" id="idSubbieSlider" min="0" /> <div id="idSubbieTime class="time"></div> </div>\
                        <button id="idSubbiePlay">Play</button>\
                        <button id="idSubbiePause">Pause</button>\
                        <input type="text" id="idSubbieSearch" placeholder="Search" />\
                        <button id="idSubbieClose">Close</button>\
                        <input id="idSubbieFileSelector" type="file"/><br/>\
                    </div>';
        return sHtml;
    }
    
    /**
     * Function toSeconds - converts timestring to seconds
     * Credits : jquery.srt.js
     * http://v2v.cc/~j/jquery.srt/jquery.srt.js
     */
    function toSeconds(t) {
        var s = 0.0;
        if(t) {
        var p = t.split(':');
        for(i=0;i<p.length;i++)
            s = s * 60 + parseFloat(p[i].replace(',', '.'))
        }
        return s;
    }


    /**
     * Function to read SRT file and parse it to a map
     */
    function readSrt(sData) {
        var aLines = sData.split('\n\r\n');
        var aSrtData = [];
        var mSrt = {};
        var mapIndices = [];
        var aTexts = [];
        for (var iIndex = 0; iIndex < aLines.length; iIndex++) {
            var oLine = aLines[iIndex];
            var aParts = oLine.split('\n');
            if(aParts[1]){
                var oDuration = aParts[1].split('-->');
                var iStart = toSeconds(oDuration[0]);
                var iDurationInSeconds = toSeconds(oDuration[1]) - toSeconds(oDuration[0]);

                // Form the subtitle text after removing index and duration 
                // eg. From Doctor Strange SRT file
                // 974                           -- Index
                // 01:47:17,265 --> 01:47:20,447 -- Duration
                // Oh, yes. Probably.            -- Subtitle text 
                // - Alright.                    -- Subtitle text
                
                var aText = aParts.concat([]);
                aText.reverse();
                aText.pop();
                aText.pop();
                aText.reverse();
                var sText = aText.join('\n');
                
                var oSrtLine = {
                    index: aParts[0],
                    duration: iDurationInSeconds,
                    durationMs: iDurationInSeconds*1000,
                    text: sText
                };

                mSrt[iStart] = oSrtLine;
                mapIndices.push(iStart);
                aSrtData.push(oSrtLine);
                aTexts.push(sText.toLowerCase());
            }
        }

        // Subbie object that controls the player
        subbie = {
            data: aSrtData,
            map: mSrt,
            mapIndices: mapIndices,
            srtTexts: aTexts,
            cursor: 0,
            max: mapIndices.length - 1,
            pause: false,
            timer: null
        };

        // Set the slider max
        jQuery('#idSubbieSlider').attr('max', aSrtData.length - 1);
        jQuery("#subbie-player").removeClass('noFile');
        // Play the loaded SRT
        handleSubbiePlay();
    }

    function playFrom(iIndex){
        var oScreen = jQuery('#subbie-display');
        var iCursor = subbie.cursor;
        var oCurrentSub = subbie.data[iCursor];
        oScreen.text(oCurrentSub.text);
        jQuery('#idSubbieSlider').val(iCursor);
        jQuery('#idSubbieTime').text(oCurrentSub.duration);
        
        if(iCursor < subbie.max && !subbie.pause){
            // Increment the cursor
            subbie.cursor = subbie.cursor + 1;
            subbie.nextTimeout = setTimeout(playFrom, subbie.data[iCursor].durationMs, oScreen);
        }
    }
    
    function handleSubbiePause(){
        subbie.pause = subbie.pause? false:  true;
    }

    function handleSubbiePlay(){
        subbie.pause = false;
        playFrom();
    }

    function handleSliderChange(oEvent){
        var iCursor = parseInt(oEvent.target.value, 10);
        if(iCursor){
            subbie.cursor = iCursor;
        }
    }

    function handleSubbieSearch(){
        var sQuery = jQuery('#idSubbieSearch').val().toLowerCase();
        if(!sQuery){
            return false;
        }
        var iIndex = subbie.srtTexts.findIndex(function(sText){
            return sText.indexOf(sQuery) !== -1;
        });

        if(iIndex >=0 ){
            clearTimeout(subbie.nextTimeout);
            subbie.cursor = iIndex;
            playFrom();
        }
    };
    
    /**
     * Message listener 
     * Creates Subbie player on DOM when requested by background script
     * When user clicks on context menu "+Subbie"
     */
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            // Request to show subbie player
            if(request.showSubbie){
                if(!subbie.playerInstance){
                subbie.playerInstance = jQuery('body').append(createSrtPlayer());
            jQuery('#idSubbieFileSelector').on('change', function(oEvent){
                    var aFiles = oEvent.target.files;
                    var oFile = aFiles[0];  // Single select
                    var oReader = new FileReader();

                    oReader.onload = (function(oFileContent){
                            readSrt(oFileContent.target.result);
                    });
                    
                    oReader.readAsBinaryString(oFile);
                
            });

            jQuery("#idSubbieSearch").on('change', handleSubbieSearch);
            jQuery("#idSubbiePlay").on('click', handleSubbiePlay);
            jQuery("#idSubbiePause").on('click', handleSubbiePause);
            jQuery("#idSubbieSlider").on('change', handleSliderChange);
            
            /*jQuery("#subbie-slider").slider({
                min: 0,
                max: subbie.data.max,
                step: 1
            });*/
            jQuery("#subbie-player").draggable();
            jQuery("#subbie-player").resizable();
                }
                else{
                    subbie.playerInstance.show();
                }
            }
    });

})();