//document.write('Hello from Subbie!');
(function () {
    var subbie =  {};
    /**
     * Function to create the Subbie player in DOM
     */
    function createSrtPlayer() {
        var sHtml = '<div id="subbie-player" class="subbie-player">\
                        <div id="subbie-display"></div>\
                        <div id="subbie-slider"><input type="range" id="idSubbieSlider" min="0" /> <div id="idSubbieTime class="time"></div> </div>\
                        <button id="idSubbiePlay">Play</button>\
                        <button id="idSubbiePause">Pause</button>\
                        <input id="idSubbieFileSelector" type="file"/>\
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
        for (var iIndex = 0; iIndex < aLines.length; iIndex++) {
            var oLine = aLines[iIndex];
            var aParts = oLine.split('\n');
            
            if(aParts[1]){
                var oDuration = aParts[1].split('-->');
                var iDurationInSeconds = toSeconds(oDuration[1]) - toSeconds(oDuration[0]);

                // Form the subtitle text after removing index and duration 
                // eg. From Doctor Strange SRT file
                //  974                          -- Index
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

                aSrtData.push(oSrtLine);
            }
        }

        // Subbie object that controls the player
        subbie = {
            data: aSrtData,
            cursor: 0,
            max: aSrtData.length - 1,
            pause: false
        };

        // Set the slider max
        jQuery('#idSubbieSlider').attr('max', aSrtData.length - 1);
        // Play the loaded SRT
        handleSubbiePlay();
    }

    function playFrom(oScreen){
        var iCursor = subbie.cursor;
        var oCurrentSub = subbie.data[iCursor];

        oScreen.text(oCurrentSub.text);
        jQuery('#idSubbieSlider').attr('value', iCursor);
        jQuery('#idSubbieTime').html(oCurrentSub.duration);
        
        if(iCursor < subbie.max && !subbie.pause){
            // Increment the cursor
            subbie.cursor = subbie.cursor + 1;
            setTimeout(playFrom, subbie.data[iCursor].durationMs, oScreen);
        }
    }
    
    function handleSubbiePause(){
        var oScreen = jQuery('#subbie-display');
        subbie.pause = subbie.pause? false:  true;
        playFrom(oScreen);
    }

    function handleSubbiePlay(){
        var oScreen = jQuery('#subbie-display');
        playFrom(oScreen);
    }

    function handleSliderChange(oEvent){
        var iCursor = parseInt(oEvent.target.value, 10);
        if(iCursor){
            subbie.cursor = iCursor;
        }
    }
    
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