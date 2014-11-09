'use strict';

//canvasLister("canvasItem1", "source1.txt", null, null, "#000", "bold", "#00aa00");
//canvasLister("canvasItem2", "source1.txt", "Lithos Pro", "16", null, "#000033", "#dedede");
function canvasLister(canvasItem, sourceFile, fontDefaultFamily, fontDefaultSize, fontDefaultWeight, fontDefaultShape, backgroundColor, fontDefaultColor, text) {

    var hasConsole = typeof (window.console) !== undefined ? true : false;
    
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;

    function lg(msg) {
        if (hasConsole) {
            window.console.log(msg);
        }
    }
    
    // The allowed attributes and there types (0 = Num, 1 = Hex, 2 = Text)
    var attributes = {
        'size': 0,
        'color': 1,
        'align': 2
    };

    var validTexts = ['left', 'right', 'center'];
    var validUnits = ['px']; // %;
    var matchHex = /#[0-9a-f]*/gi;

    // Performs checks if a given keyValuePair is valid to some ruleset
    // returns false if something is wrong or missing
    function checkKeyValuePair(keyValuePair) {
        var key = keyValuePair[0];
        var value = keyValuePair[1];

        var attribute = attributes[key];
        if (attribute === undefined) {
            return false;
        }

        switch (attribute) {
            case 0:
                if (isValidNum(value)) {
                    if (isValidUnit(value)) {
                        return true;
                    }
                }
                break;
            case 1:
                if (isValidHex(value)) {
                    return true;
                }
                break;
            case 2:
                if (isValidText(value)) {
                    return true;
                }
                break;
        }

        return false;
    }


    // Helper functions to check if userinput is valid
    function isValidNum(input) {
        if (Number.isNaN(parseInt(input))) {
            return false;
        }

        return true;
    }


    function isValidHex(input) {
        if (input[0] !== '#') {
            return false;
        }

        var hexMatch = input.match(matchHex)[0];

        if (hexMatch.length > 7) {
            return false;
        }

        if (hexMatch.length < 4) {
            return false;
        }

        return true;
    }

    function isValidText(input) {
        if (validTexts.indexOf(input) !== -1) {
            return true;
        }

        return false;
    }

    function isValidUnit(input) {
        if (input.length < 3) {
            return false;
        }

        for (var unit = 0; unit < validUnits.length; unit++) {
            if (input.indexOf(validUnits[unit]) !== -1) {
                return true;
            }
        }

        return false;
    }


    var canvas = document.getElementById(canvasItem);

    // Checking canvas presence
    if (canvas === null) {
        lg('Canvas item "' + canvasItem + '" cannot be found, doing nothing.');
        return;
    }

    // Get 2d context when present and measurements
    var ci = canvas.getContext('2d');
    var offsetX = 10;
    var offsetY = 10;
    var sizeX = canvas.width - (offsetX * 2);
    var sizeY = canvas.height - (offsetY * 2);

    // Check whether a sourcefile is given and if text then is provided which is required
    if (sourceFile === null) {
        if (typeof (text) === undefined) {
            lg('Source file is not provided, but no text either, canvas item id "' + canvasItem + '"');
            return;
        }
    }


    // Setting default values for background color, font family, size, color and if not set in init
    if (backgroundColor !== null) {
        canvas.style.background = backgroundColor;
    } else {
        backgroundColor = '#fff';
    }

    if (fontDefaultFamily === null) {
        fontDefaultFamily = 'sans-serif';
    }

    if (fontDefaultSize === null) {
        fontDefaultSize = '11px';
    }

    var fontDefaultLineHeight = parseFloat(fontDefaultSize) + 4;

    if (fontDefaultWeight === null) {
        fontDefaultWeight = 'normal';
    }

    if (fontDefaultColor === null) {
        fontDefaultColor = '#000';
    }

    if (fontDefaultShape === null) {
        fontDefaultShape = 'normal';
    }

    ci.font = fontDefaultShape + ' normal ' + fontDefaultWeight + ' ' + fontDefaultSize + ' ' + fontDefaultFamily;
    ci.fillStyle = fontDefaultColor;
    ci.textAlign = 'left';

    var markupData = '';

    // Textloader using ajax
    function loadText() {
        var dataLoader = new XMLHttpRequest();
        dataLoader.onreadystatechange = function () {
            if (dataLoader.readyState === 4) {
                markupData = dataLoader.responseText;
                processMarkup(markupData);
            }
        };
        dataLoader.open('GET', sourceFile);
        dataLoader.send();
    }


    // Matching tags and imageTagStore for parser
    var formatTagMatch = /<[^\/][\w\d\s\=\"\#\'\*\%]*>/g;
    var imgMatch = /<img[^<]*/g;
    var imgReplace = /\bimg\b/g;
    var imgTitleMatch = /title=[\"\'][^\"]*[\"\']{1,2}/gi;
    var imgDescriptionMatch = /description=[\"\'][^\"]*[\"\']{1,2}/gi;
    var imgkeyValueMatch = /[^<\"\'\s]{1,}[\w\d\#]*[^\"\'\=\>\s]/g;

    function simpleParse(formatData) {
        //lg('---parser data------------------');

        var parserObject = {};
        parserObject.data = [];
        parserObject.tags = [];
        parserObject.imageStore = [];
        parserObject.imageTagStore = [];
        parserObject.orders = [];
        parserObject.tagStore = {};
        parserObject.tagKeyValues = {};
        parserObject.triggers = [];

        // Preprocess and remove image tag from formatting data, prepare image data

        var imageData = formatData.match(imgMatch);
        var imageOrder = -3;
        var keyValues = [];

        if (imageData !== null) {
            parserObject.imageTagStore = imageData;
            var imageTag = [];

            var imgTitle = [];
            var imgDescription = [];

            for (var img = 0; img < imageData.length; img++) {
                imageTag = imageData[img];

                // Create the general image object
                var imageObject = {};
                imageObject.title = '';
                imageObject.description = '';
                imageObject.fg = '#000000';
                imageObject.bg = '#ffffff';
                imageObject.src = 'none';
                imageObject.height = '0px';
                imageObject.width = '0px';
                imageObject.id = imageOrder;

                // Clean imageTag from format data
                formatData = formatData.replace(imageTag, '');

                // Clean imageTag from format data
                imageTag = imageTag.replace(imgReplace, '');

                // Check if we can get a title and remove it from the imageTag
                imgTitle = imageTag.match(imgTitleMatch);
                if (imgTitle !== null) {
                    imageObject.title = imgTitle[0].split('=', 2)[1];
                    imageTag = imageTag.replace(imgTitleMatch, '');
                }

                // Check if we can get a description and remove it from imageTag
                imgDescription = imageTag.match(imgDescriptionMatch);
                if (imgDescription !== null) {
                    imageObject.description = imgDescription[0].split('=', 2)[1];
                    imageTag = imageTag.replace(imgDescriptionMatch, '');
                }

                keyValues = imageTag.match(imgkeyValueMatch);
                if (keyValues !== null) {
                    for (var keyValue = 0; keyValue < keyValues.length; keyValue += 2) {
                        imageObject[keyValues[keyValue]] = keyValues[keyValue + 1];
                    }

                    parserObject.orders.push(imageOrder);
                    parserObject.imageStore.push(imageObject);
                } else {
                    // If we only get a image without any attributes we skip it
                    // for now
                    // TODO: Use default styling for a blank image reference
                    continue;
                }

                imageOrder--;
            }
        }

        var parserData = '';
        var tagLength = 0;
        var currentIndex = 0;
        var nextIndex = 0;
        var closingIndex = 0;
        var currentTag = '';
        var nextTag = '';
        var openTags = [];
        var processedTags = 0;

        parserObject.tags = formatData.match(formatTagMatch);


        if (parserObject.tags !== null) {
            tagLength = parserObject.tags.length;
        } else {
            parserObject.tags = [];
        }




        for (var tag = 0; tag < tagLength; tag++) {

            currentTag = parserObject.tags[tag];
            nextTag = parserObject.tags[tag + 1];

            currentIndex = formatData.indexOf(currentTag);
            nextIndex = formatData.indexOf(nextTag);
            closingIndex = formatData.indexOf('</>');

            if (closingIndex === 0) {
                formatData = formatData.substr(closingIndex + 3);
                currentIndex = formatData.indexOf(currentTag);
                nextIndex = formatData.indexOf(nextTag);
                closingIndex = formatData.indexOf('</>');
                openTags.splice(openTags.length - 1, 1);
            }

            //lg('tag: '+currentTag);
            //lg('current: '+currentIndex+' -- next: '+nextIndex+' -- close: '+closingIndex);

            // If the tag start not a zero, we have non-tagged data
            if (currentIndex !== 0) {
                //lg("in non tagged data");
                if (openTags.length === 0) {
                    parserData = formatData.substring(0, currentIndex);
                    parserObject.data.push(parserData);
                    parserObject.orders.push(-1);
                    formatData = formatData.substr(currentIndex);
                } else {
                    parserData = formatData.substring(0, closingIndex);
                    parserObject.data.push(parserData);
                    parserObject.orders.push(openTags[0]);
                    formatData = formatData.substr(closingIndex + 3);
                }

                openTags = [];
                tag--;
                continue;
            }

            // Last tag processing
            if (nextIndex === -1) {
                parserData = formatData.substring(currentTag.length, closingIndex);
                formatData = formatData.substr(closingIndex + 3);
                parserObject.data.push(parserData);
                parserObject.orders.push(tag);
                processedTags++;
                continue;
            }

            // Assume non nested tag
            if (nextIndex > closingIndex && currentIndex === 0) {
                //lg("in non nested");

                if (openTags.length === 0) {
                    parserData = formatData.substring(currentTag.length, closingIndex);
                    formatData = formatData.substr(closingIndex + 3);

                    parserObject.data.push(parserData);
                    parserObject.orders.push(tag);
                } else {
                    parserData = formatData.substring(currentTag.length, closingIndex);
                    formatData = formatData.substr(closingIndex + 3);
                    parserObject.data.push(parserData);
                    parserObject.orders.push(tag);

                    formatData = formatData.substr((openTags.length - 1) * 3);
                    openTags = openTags.slice(openTags.length - 1, 1);
                }

                processedTags++;
                continue;
            }

            // Assume nested tag
            if (nextIndex < closingIndex && currentIndex === 0) {
                //lg("in nested tag");
                parserData = formatData.substring(currentTag.length, nextIndex);
                formatData = formatData.substr(nextIndex);
                parserObject.data.push(parserData);
                parserObject.orders.push(tag);
                openTags.push(tag);
                processedTags++;
                continue;
            }
        }

        // Create key value store for formatting after parsing the data
        //var parserObject.tagKeyValues = {};
        var keyValues = [];
        var singleKey = [];
        var keyValueMatch = /[^<\"\'\s]{1,}[\w\d\#]*[^\"\'\=\>\s]/g;
        var singleValueMatch = /\b[b|i|bi]{1,2}\b/gi;
        var permittedKeyValues = [];

        for (var tag = 0; tag < parserObject.tags.length; tag++) {
            keyValues = parserObject.tags[tag].match(keyValueMatch);
            singleKey = parserObject.tags[tag].match(singleValueMatch);

            if (singleKey !== null) {
                parserObject.tagStore[tag] = singleKey[0];
            } else {
                // Push an empty string to tell that we have no simple tag value
                parserObject.tagStore[tag] = '';
            }

            if (keyValues !== null) {
                permittedKeyValues = [];
                for (var keyValue = 0; keyValue < keyValues.length; keyValue += 2) {
                    if (checkKeyValuePair([keyValues[keyValue], keyValues[keyValue + 1]])) {
                        permittedKeyValues.push([keyValues[keyValue], keyValues[keyValue + 1]]);
                    }
                }

                parserObject.tagKeyValues[tag] = permittedKeyValues;
            } else {
                parserObject.tagKeyValues[tag] = [];
            }


        }

        // Create the triggers for the formatter
        // var parserObject.triggers = [];
        var triggerMatch = /[^_][\w\d\-\'\"\#]*[\,\!\"\'\;\:\;\.]{0,}/g;
        var triggers = [];
        var parserData = '';
        var triggerOne = '';
        var triggerTwo = '';
        for (var data = 0; data < parserObject.data.length; data++) {
            parserData = parserObject.data[data].trim();
            triggers = parserData.match(triggerMatch);

            if (triggers !== null) {
                triggerOne = triggers[0].trim();
                if (triggerOne.length === 1) {
                    parserData = parserData.replace(triggerOne, '');
                    triggerTwo = parserData.trim();
                    parserObject.triggers.push([[0, triggerOne], [parserData.indexOf(triggerTwo), triggerTwo]]);
                } else {
                    triggerTwo = triggers[triggers.length - 1].trim();
                    if (triggerTwo.length === 0) {
                        parserObject.triggers.push([[0, triggerOne], [0, triggerOne]]);
                    } else {
                        parserObject.triggers.push([[parserData.indexOf(triggerOne), triggerOne], [parserData.indexOf(triggerTwo), triggerTwo]]);
                    }
                }
            } else {
                parserObject.triggers.push(false);
            }
        }

        // Summary
        /*
         lg(parserObject.tags);
         lg(parserObject.data);
         lg(parserObject.orders);
         lg(parserObject.tagStore);
         lg(parserObject.tagKeyValues);

         if (parserObject.imageTagStore.length !== 0) {
         lg(parserObject.imageStore);
         lg(parserObject.imageTagStore);
         }

         lg(parserObject.triggers);
         lg('---object-----------------------');
         lg(parserObject);
         lg(' ');
         lg('  ');
         */
        return parserObject;
    }

    // Markup processor
    var hasFormatCheck = /<[^/]*>.*<\/>/g;
    var tagMatchPattern = /<[^<\s]{0,}.*[<\/>]+/g;
    var closingMatch = /<\/>/g;
    function processMarkup(markupData) {
        var markupParts = markupData.trim().split('\n');

        var line = 0;
        var lines = markupParts.length;
        var stepY = 0;
        var stepX = 0;
        var spacerSize = 0;
        var hasFormat = false;
        var parserObjectStore = [];

        ci.translate(offsetX, offsetY);

        var activeLine = '';

        function setDefaultStyle() {
            ci.fillStyle = fontDefaultColor;
            fontStyle = [fontDefaultShape, 'normal', fontDefaultWeight, fontDefaultSize, fontDefaultFamily];
            ci.font = fontStyle.join(' ');
        }

        function resetStyle(resetFormatLevel, openTags) {
            // Get key value formatting or empty array
            keyValues = [];
            if (tagKeyValues.hasOwnProperty(resetFormatLevel)) {
                keyValues = tagKeyValues[resetFormatLevel];
            }

            simpleTag = tagStore[resetFormatLevel];

            // Check if we have a simple tag to start with
            if (simpleTag !== '') {
                switch (simpleTag) {
                    case 'b':
                        fontWeight = fontDefaultWeight;
                        break;
                    case 'i':
                        fontShape = fontDefaultShape;
                        break;
                    case 'bi':
                        fontWeight = fontDefaultWeight;
                        fontShape = fontDefaultShape;
                        break;
                }

                fontStyle = [fontShape, 'normal', fontWeight, fontSize, fontDefaultFamily];
                ci.font = fontStyle.join(' ');
            }

            if (keyValues.length !== 0) {
                for (var keyItem = 0; keyItem < keyValues.length; keyItem++) {
                    switch (keyValues[keyItem][0]) {
                        case "size":
                            fontSize = fontDefaultSize;
                            lineHeightHint = fontDefaultLineHeight;
                            break;
                        case "color":
                            ci.fillStyle = fontDefaultColor;
                            break;
                    }
                }

                fontStyle = [fontShape, 'normal', fontWeight, fontSize, fontDefaultFamily];
                ci.font = fontStyle.join(' ');
            }

            // If we have open tags, dont reset to defaults but previous tag values
            if (openTags > 0) {
                //lg("setting style to: " + (resetFormatLevel - 1) + " from openTag: " + openTags);
                setStyle(resetFormatLevel - 1);
            }
        }

        function setStyle(setFormatLevel) {
            // Get key value formatting or empty array
            keyValues = [];
            if (tagKeyValues.hasOwnProperty(setFormatLevel)) {
                keyValues = tagKeyValues[setFormatLevel];
            }

            simpleTag = tagStore[setFormatLevel];

            // Check if we have a simple tag to start with
            if (simpleTag !== '') {
                switch (simpleTag) {
                    case 'b':
                        fontWeight = 'bold';
                        break;
                    case 'i':
                        fontShape = 'italic';
                        break;
                    case 'bi':
                        fontWeight = 'bold';
                        fontShape = 'italic';
                        break;
                }

                fontStyle = [fontShape, 'normal', fontWeight, fontSize, fontDefaultFamily];
                ci.font = fontStyle.join(' ');
            }

            if (keyValues.length !== 0) {
                for (var keyItem = 0; keyItem < keyValues.length; keyItem++) {
                    switch (keyValues[keyItem][0]) {
                        case "size":
                            fontSize = keyValues[keyItem][1];
                            lineHeightHint = parseFloat(fontSize) + 4;

                            if (fontLineHeight < lineHeightHint) {
                                fontLineHeight = lineHeightHint;
                            }

                            break;
                        case "color":
                            fontColor = keyValues[keyItem][1];
                            ci.fillStyle = fontColor;
                            break;
                    }
                }

                fontStyle = [fontShape, 'normal', fontWeight, fontSize, fontDefaultFamily];
                ci.font = fontStyle.join(' ');
            }
        }


        // Do the actual iterations
        while (line < lines) {
            activeLine = markupParts[line];

            hasFormat = hasFormatCheck.test(activeLine);

            // Forcefull image detection
            if (activeLine.match(imgMatch) !== null) {
                hasFormat = true;
            }


            if (hasFormat) {
                var parserObject = simpleParse(activeLine.match(tagMatchPattern)[0]);
                parserObjectStore.push(parserObject);
                lg(parserObject);

                // Start cleaning up the linedata by clearing tags
                for (var tag = 0; tag < parserObject.tags.length; tag++) {
                    activeLine = activeLine.replace(parserObject.tags[tag], '');
                }

                // Clean up image definitions
                for (var image = 0; image < parserObject.imageTagStore.length; image++) {
                    activeLine = activeLine.replace(parserObject.imageTagStore[image], '');
                }

                // Clean up closings
                activeLine = activeLine.replace(closingMatch, '');
            }

            var words = activeLine.split(' ');
            var wordCount = words.length;

            var currentWord = 0;
            var currentSize = 0;
            var word = '';


            // The formatter level and formatter switch
            var orderLevel = 0;
            var formatLevel = 0;
            var useFormat = parserObject.tags.length !== 0 ? true : false;
            var openTags = [];

            // Shorthands for the parserObject data
            var tagStore = parserObject.tagStore;
            var tagKeyValues = parserObject.tagKeyValues;
            var triggers = parserObject.triggers;
            var orders = parserObject.orders;

            // Sizes for looping
            var triggerSize = parserObject.triggers.length;
            var orderSize = parserObject.orders.length;

            var trigger = 0;
            var order = 0;
            var simpleTag = '';
            var keyValues = [];


            // Reset to default values
            var fontWeight = fontDefaultWeight;
            var fontSize = fontDefaultSize;
            var fontColor = fontDefaultColor;
            var fontFamily = fontDefaultFamily;
            var fontShape = fontDefaultShape;
            var fontLineHeight = fontDefaultLineHeight;

            var lineHeightHint = fontLineHeight;

            var fontStyle = [fontShape, 'normal', fontWeight, fontDefaultSize, fontDefaultFamily];
            var wordSize = 0;


            var triggerWordMatch = /[^\.\;\:\_\#\+\*]*/g;
            while (currentWord < wordCount) {

                word = words[currentWord];
                var triggerWord = word.match(triggerWordMatch)[0];
                               
                if (useFormat) {
                    if (orderLevel >= orderSize) {
                        useFormat = false;
                        setDefaultStyle();
                    } else if (orders[orderLevel] === -1 && formatLevel === 0) {
                        setDefaultStyle();
                    } else {
                        if (orderLevel < triggers.length) {
                            if (triggers[orderLevel] === false || triggerWord === triggers[orderLevel][0][1].match(triggerWordMatch)[0]) {
                                //lg("IN ---- word: " + triggerWord + " --------- IN ----- ol: " + orderLevel + " --- nol: " + orders[orderLevel + 1] + " --- fl: " + formatLevel);
                                setStyle(formatLevel);
                                openTags.push(orderLevel);
                            }
                        }
                    }
                }


                // Layout and draw the text
                wordSize = Math.ceil(ci.measureText(word).width);
                spacerSize = Math.ceil(ci.measureText(' ').width);
                var nextSize = currentSize + wordSize;

                if (nextSize > sizeX) {
                    stepY += lineHeightHint;
                    stepX = 0;
                    currentSize = 0;
                } else {
                    currentWord++;
                    ci.fillText(word, stepX, stepY + fontLineHeight);
                    stepX += (wordSize + spacerSize);
                    currentSize = stepX;
                }

                if (currentWord === wordCount) {
                    stepY += fontDefaultLineHeight;
                    setDefaultStyle();
                    stepX = 0;
                }


                // Change formatting if required
                if (useFormat) {
                    if (orderLevel <= orderSize) {
                        //lg("OUT ---- word: "+ triggerWord + " --------- IN ----- ol: "+orderLevel+" --- nol: "+orders[orderLevel + 1]+" --- fl: "+formatLevel);

                        if (orderLevel === orderSize - 1 || orderLevel > orders[orderLevel + 1]) {
                            if (triggers[orderLevel] === false || triggerWord === triggers[orderLevel][1][1].match(triggerWordMatch)[0]) {
                                var openTagItems = openTags.length - 1;

                                while (openTagItems > openTags[0]) {
                                    resetStyle(openTags[openTagItems], openTagItems);
                                    openTagItems--;
                                    formatLevel--;
                                }

                                if (orders[orderLevel + 1] === -1) {
                                    setDefaultStyle();
                                    formatLevel = orderLevel;
                                } else if (orders[orderLevel + 1] > formatLevel) {
                                    formatLevel = orders[orderLevel + 1];
                                }
                                
                                openTags = [];
                                orderLevel++;
                            }
                        } else {
                            if (triggers[orderLevel] === false || triggerWord === triggers[orderLevel][1][1].match(triggerWordMatch)[0]) {
                                formatLevel++;
                                orderLevel++;
                            }
                        }
                    }
                }
            }

            line++;
        }
    }


    // Get sourceFile data or directly call markup processor
    if (sourceFile !== null) {
        loadText(sourceFile);
    } else {
        processMarkup(text);
    }

}
