//'use strict';

function canvasLister_phantom_v2(canvasItemId, sourceFile, fontDefaultFamily, fontDefaultSize, fontDefaultWeight, fontDefaultShape, textAlignment, backgroundColor, fontDefaultColor, sourceText) {

    var pages = [];

    // If layouting is not in progress anymore, do the actual image loading
    var inLayoutProcess = false;
    var escapeLayoutProcess = false;

    var hasConsole = typeof (window.console) !== undefined ? true : false;

    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;

    function lg(msg) {
        if (hasConsole) {
            window.console.log(msg);
        }
    }

    // The allowed attributes and there types
    // (0 = Num, 1 = Hex, 2 = Tag, 3 = True text)
    var textAttributes = {
        'size': 0,
        'color': 1
    };

    var imageAttributes = {
        'title': 3,
        'description': 3,
        'src': 3,
        'height': 0,
        'width': 0,
        'borderwidth': 0,
        'bordercolor': 1,
        'margin': 0,
        'align': 2,
        'fg': 1,
        'bg': 1
    };

    var validTags = ['left', 'right', 'center'];
    var validUnits = ['px', "%"];
    var matchHex = /#[0-9a-f]*/gi;

    // Performs checks if a given keyValuePair is valid to some ruleset
    // returns false if something is wrong or missing
    function checkKeyValuePair(type, keyValuePair) {
        // Skip keys without a value
        if (keyValuePair[1] === undefined) {
            return false;
        }

        var key = keyValuePair[0].toLowerCase();
        var value = keyValuePair[1].toLowerCase();

        if (type === "text") {
            var attribute = textAttributes[key];
            if (attribute === undefined) {
                return false;
            }
        } else if (type === "image") {
            var attribute = imageAttributes[key];
            if (attribute === undefined) {
                return false;
            }
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
            case 3:
                // This is the override for values, we cant check
                // like the image title and description
                return true;
                break;
        }

        return false;
    }


    // Helper functions to check if userinput is valid
    function isValidNum(input) {
        if (parseInt(input) === NaN) {
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
        if (validTags.indexOf(input) !== -1) {
            return true;
        }

        return false;
    }

    function isValidUnit(input) {
        if (input.length < 2) {
            return false;
        }

        for (var unit = 0; unit < validUnits.length; unit++) {
            if (input.indexOf(validUnits[unit]) !== -1) {
                return true;
            }
        }

        return false;
    }


    var canvas = document.getElementById(canvasItemId);

    // Checking canvas presence
    if (canvas === null) {
        lg('Canvas item "' + canvasItemId + '" cannot be found, doing nothing.');
        return;
    }

    // Get 2d context when present and measurements
    var ci = canvas.getContext('2d');
    var offsetX = 10;
    var offsetY = 10;
    var sizeX = canvas.width - (offsetX * 2);
    var sizeY = canvas.height - (offsetY * 2);

    // Reset any positiong
    ci.translate(0, 0);
    ci.translate(offsetX, offsetY);

    // Check whether a sourcefile is given and if sourceText then is provided which is required
    if (sourceFile === null) {
        if (typeof (sourceText) === undefined) {
            lg('Source file is not provided, but no sourceText either, canvas item id "' + canvasItemId + '"');
            return;
        }
    }


    // Setting default values for background color, font family, size, color and if not set in init
    if (backgroundColor !== null) {
        canvas.style.setProperty("background-color", backgroundColor);
    } else {
        backgroundColor = '#fff';
    }

    if (fontDefaultFamily === null) {
        fontDefaultFamily = 'sans-serif';
    }

    if (fontDefaultSize === null) {
        fontDefaultSize = '11px';
    }

    var fontDefaultLineHeight = parseFloat(fontDefaultSize) + (parseFloat(fontDefaultSize) / 2.5);

    if (fontDefaultWeight === null) {
        fontDefaultWeight = 'normal';
    }

    if (fontDefaultColor === null) {
        fontDefaultColor = '#000';
    }

    if (fontDefaultShape === null) {
        fontDefaultShape = 'normal';
    }

    if (textAlignment === null || textAlignment !== 'justified') {
        textAlignment = "left";
    }

    ci.font = fontDefaultShape + ' normal ' + fontDefaultWeight + ' ' + fontDefaultSize + ' ' + fontDefaultFamily;
    ci.fillStyle = fontDefaultColor;
    ci.textAlign = 'left';

    var markupData = '';

    // Textloader using ajax
    function loadText(sourceFile) {
        if (typeof (ActiveXObject) !== "undefined") {
            var dataLoader = new ActiveXObject("MSXML2.XMLHTTP.6.0");
        } else {
            var dataLoader = new XMLHttpRequest();
        }
        dataLoader.onreadystatechange = function () {
            if (dataLoader.readyState === 4) {
                // Clear the error message from canvas
                ci.clearRect(0, 0, 300, 100);

                // Continue with markup processing
                markupData = dataLoader.responseText;
                processMarkup(markupData);
            }
        };

        // Prepare error message if the source could not be loaded
        var stepY = 20;
        ci.fillStyle = fontDefaultColor;
        ci.fillText("If you see this message,", 10, stepY);
        stepY += fontDefaultLineHeight;
        ci.fillText('the source file "' + sourceFile + '"', 10, stepY);
        stepY += fontDefaultLineHeight;
        ci.fillText("could not be loaded !", 10, stepY);

        dataLoader.open('GET', sourceFile);
        dataLoader.send();
    }

    // Clear and fill for pagination
    function clearAndFill() {
        var previousFill = ci.fillStyle;
        var canvasItem = document.getElementById(canvasItemId);
        ci.clearRect(-10, -10, canvasItem.width + 20, canvasItem.height + 20);
        ci.fillStyle = backgroundColor;
        ci.fillRect(-10, -10, canvasItem.width + 20, canvasItem.height + 20);
        ci.fillStyle = previousFill;
    }


    // Matching tags and imageTagStore for parser
    var formatTagMatch = /<[^\/][\w\d\s\=\"\#\'\*\%]*>/g;
    var imgMatch = /<[^\s]{0,}img\b[^\<]*/gi;
    var imgReplace = /\bimg\b/g;
    var imgTitleMatch = /title=[\"\'][^\"]*[\"\']{1,2}/gi;
    var imgDescriptionMatch = /description=[\"\'][^\"]*[\"\']{1,2}/gi;
    var imgkeyValueMatch = /[^<\"\'\s]{1,}[\w\d\#]*[^\"\'\=\>\s]/g;

    var triggerMatch = /[^_][\w\d]*[\,\!\"\'\;\:\;\.\%\$\?]{0,}/g;
    var triggerClear = /[\.\,\;\:\_\'\"\#\+\*\=\(\)\[\]\&\`\!\%\\$\?]/g;
    var spaceCorrection = /[\s]{2,}/g;

    function simpleParse(formatData) {
        //lg('---parser data------------------');

        var parserObject = {};                  // The parserObject contains the formatter data
        parserObject.data = [];                 // Contains the data of the tag
        parserObject.tags = [];                 // The tags as defined
        parserObject.imageStore = [];           // Image elements
        parserObject.imageTagStore = [];        // Image keyvalue store
        parserObject.orders = [];               // The tag order levels for formatting
        parserObject.tagStore = {};             // The simple tags listed like b, bi, i
        parserObject.tagKeyValues = {};       // The key values store of tags
        parserObject.triggers = [];             // Word boundaries which trigger formatting
        parserObject.dataPoints = [];           // The approximate indexes of the triggers
        parserObject.orderNestedTags = [];      // Information of tags nested into each other

        // Preprocess and remove image tag from formatting data, prepare image data
        // for display on the canvas, using parameters
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
                imageObject.margin = '5px';
                imageObject.align = "center";
                imageObject.borderwidth = "0px";
                imageObject.bordercolor = "#000000";
                imageObject.id = imageOrder;

                // Clean imageTag from format data
                formatData = formatData.replace(imageTag, '');

                // Clean imageTag from format data
                imageTag = imageTag.replace(imgReplace, '');

                // Check if we can get a title and remove it from the imageTag
                imgTitle = imageTag.match(imgTitleMatch);
                if (imgTitle !== null) {
                    var imgTitleString = imgTitle[0].split('=', 2)[1];
                    imageObject.title = imgTitleString.substr(1, imgTitleString.length - 2);
                    imageTag = imageTag.replace(imgTitleMatch, '');
                }

                // Check if we can get a description and remove it from imageTag
                imgDescription = imageTag.match(imgDescriptionMatch);
                if (imgDescription !== null) {
                    var imgDescriptionString = imgDescription[0].split('=', 2)[1];
                    imageObject.description = imgDescriptionString.substr(1, imgDescriptionString.length - 2);
                    imageTag = imageTag.replace(imgDescriptionMatch, '');
                }

                keyValues = imageTag.match(imgkeyValueMatch);
                if (keyValues !== null) {
                    for (var keyValue = 0; keyValue < keyValues.length; keyValue += 2) {
                        if (checkKeyValuePair("image", [keyValues[keyValue], keyValues[keyValue + 1]])) {
                            imageObject[keyValues[keyValue].toLowerCase()] = keyValues[keyValue + 1].toLowerCase();
                        }
                    }
                }

                parserObject.orders.push(imageOrder);
                parserObject.imageStore.push(imageObject);

                imageOrder--;
            }
        }

        // Start of actual parser code which generates the corner data
        // for the formatter engine
        var parserData = '';
        var tagLength = 0;
        var currentIndex = 0;
        var nextIndex = 0;
        var closingIndex = 0;
        var currentTag = '';
        var nextTag = '';
        var openTags = [];
        var processedTags = 0;

        var dataPoint = 0;
        var currentLength = 0;

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

            // Escape from formatting because there was a parsing error
            if (currentIndex === -1 && nextIndex === -1 && closingIndex === -1) {
                break;
            }

            // Check the case if we have a tag followed by the same tag
            if (currentIndex === 0 && nextIndex === 0) {
                parserData = formatData.substring(currentIndex + currentTag.length, closingIndex);
                parserObject.data.push(parserData);
                parserObject.orders.push(tag);
                formatData = formatData.substr(closingIndex + 3);
                parserObject.dataPoints.push(dataPoint);
                continue;
            }

            // If the tag start not a zero, we have non-tagged data
            if (currentIndex !== 0) {
                //lg("in non tagged data");
                if (openTags.length === 0) {
                    parserData = formatData.substring(0, currentIndex);
                    parserObject.data.push(parserData);
                    parserObject.orders.push(-1);
                    formatData = formatData.substr(currentIndex);

                    parserObject.dataPoints.push(dataPoint);

                    if (parserData.trim() !== "") {
                        dataPoint += parserData.length;
                    }
                } else {
                    parserData = formatData.substring(0, closingIndex);
                    parserObject.data.push(parserData);
                    parserObject.orders.push(openTags[0]);
                    formatData = formatData.substr(closingIndex + 3);

                    parserObject.dataPoints.push(dataPoint);

                    if (parserData.trim() !== "") {
                        dataPoint += parserData.length;
                    }
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

                parserObject.dataPoints.push(dataPoint);
                if (parserData.trim() !== "") {
                    dataPoint += parserData.length;
                }

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

                parserObject.dataPoints.push(dataPoint);

                if (parserData.trim() !== "") {
                    dataPoint += parserData.length;
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

                parserObject.dataPoints.push(dataPoint);

                if (parserData.trim() !== "") {
                    dataPoint += parserData.length;
                }

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
            singleKey = parserObject.tags[tag].match(singleValueMatch);
            keyValues = parserObject.tags[tag].match(keyValueMatch);


            if (singleKey !== null) {
                // Only the first matched singleKey is used for formatting
                parserObject.tagStore[tag] = singleKey[0].toLowerCase();
            } else {
                // Push an empty string to tell that we have no simple tag value
                parserObject.tagStore[tag] = '';
            }


            if (keyValues !== null) {
                permittedKeyValues = [];

                // If we have one or more single key values, remove those to
                // build up the keyValue pairs list
                var keyValuesSize = keyValues.length;
                if (singleKey !== null) {
                    for (var keyValue = 0; keyValue < keyValuesSize; keyValue++) {
                        for (var singleTag = 0; singleTag < singleKey.length; singleTag++) {
                            if (singleKey[singleTag] === keyValues[keyValue]) {
                                keyValues.splice(keyValue, 1);
                                keyValuesSize--;
                            }
                        }
                    }
                }

                for (var keyValue = 0; keyValue < keyValues.length; keyValue += 2) {
                    if (checkKeyValuePair("text", [keyValues[keyValue], keyValues[keyValue + 1]])) {
                        permittedKeyValues.push([keyValues[keyValue].toLowerCase(), keyValues[keyValue + 1].toLowerCase()]);
                    }
                }

                parserObject.tagKeyValues[tag] = permittedKeyValues;
            } else {
                parserObject.tagKeyValues[tag] = [];
            }


        }

        // Create the triggers for the formatter from the parserObject.data
        // for a particular tag
        // Triggers are cleared of some special characters, to
        // avoid that we cant trigger from "merged" data once the markup
        // has been cleared from tag separators and line endings, line separators
        // become merged during the clearing.
        // var parserObject.triggers = [];
        var triggers = [];
        var parserData = '';
        var triggerOne = '';
        var triggerTwo = '';

        for (var data = 0; data < parserObject.data.length; data++) {
            parserData = parserObject.data[data].trim();
            
            // Use whole word as trigger if we have no spaces inside
            if (parserData.indexOf(" ") === -1 && parserData.length !== 0) {
                triggerOne = parserData.match(triggerMatch)[0].replace(triggerClear, '').trim();
                if (triggerOne === "") {
                    triggerOne = parserData;
                }
                parserObject.triggers.push([[0, triggerOne], [0, triggerOne]]);
                continue;
            }
            
            triggers = parserData.match(triggerMatch);

            if (triggers !== null) {
                triggerOne = triggers[0].replace(triggerClear, '').trim();

                if (triggerOne.length === 0) {
                    parserData = parserData.replace(triggerOne, '');
                    triggerTwo = parserData.trim();
                    parserObject.triggers.push([[0, triggerOne], [parserData.indexOf(triggerTwo), triggerTwo]]);
                } else {
                    triggerTwo = triggers[triggers.length - 1].replace(triggerClear, '').trim();
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


        // Get the information on how many tags are nested into one tag order
        // based on the order list
        parserObject.orderNestedTags = [];

        var orderLevel = 0;
        var tagSteps = 0;
        var processedOrders = [];
        var nestedTagCount = 0;

        for (var order = 0; order < parserObject.orders.length; order++) {

            orderLevel = parserObject.orders[order];

            // If we have an image, simply add it as single item
            if (orderLevel < -1) {
                parserObject.orderNestedTags.push(0);
                continue;
            }

            // If we have no open tag, dont push anything
            if (orderLevel === -1) {
                parserObject.orderNestedTags.push(-1);
                continue;
            }

            tagSteps = 0;
            previousTags = 0;
            nestedTagCount = 0;

            // Check that we process every order level only once
            if (processedOrders.indexOf(orderLevel) === -1) {
                var previousTags = 0;
                for (var index = order + 1; index < parserObject.orders.length; index++) {

                    // If the index is not the same, assume a previous tag
                    if (parserObject.orders[index] !== orderLevel) {
                        previousTags++;
                    }
                    tagSteps++;

                    // If we reached the the same order level, the tag/orderLevel count is closed
                    // else
                    // if the index hits -1 or lower, the tag can be assumend to be closed
                    if (parserObject.orders[index] === orderLevel) {
                        break;
                    } else if (parserObject.orders[index] <= -1) {
                        break;
                    }
                }

                // Add the order to the processed order list
                processedOrders.push(orderLevel);

                // Push the amount of included tags
                nestedTagCount = tagSteps - previousTags;
                parserObject.orderNestedTags.push(nestedTagCount);
            }
        }

        // After figuring out the how the tags are nested in orderNestedTags
        // lets get the indexes for the data right, so we can start formatting
        // not only by triggerwords, but also based on the position
        // in the sourceText to avoid triggering on triggerwords before the acutal tag
        // has started

        return parserObject;
    }

    // Markup processor
    var hasFormatCheck = /<[^/]*>.*<\/>/;
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

        // The current line we are working with
        var activeLine = '';
        // The cleaned up alternative text array
        var altTextArray = [];


        // Helper functions to set the font styles to
        // default, a particular level or reset to previous levels
        function setDefaultStyle() {
            fontWeight = fontDefaultWeight;
            fontSize = fontDefaultSize;
            fontColor = fontDefaultColor;
            fontFamily = fontDefaultFamily;
            fontShape = fontDefaultShape;
            ci.fillStyle = fontDefaultColor;
            fontStyle = [fontDefaultShape, 'normal', fontDefaultWeight, fontDefaultSize, fontDefaultFamily];
            ci.font = fontStyle.join(' ');
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
                            if (keyValues[keyItem][1].indexOf("%") !== -1) {
                                fontSize = (parseFloat(fontDefaultSize) * (parseFloat(keyValues[keyItem][1]) / 100)).toString() + "px";
                            } else {
                                fontSize = keyValues[keyItem][1];
                            }
                            lineHeightHint = parseFloat(fontSize);

                            if (fontLineHeight < lineHeightHint) {
                                fontLineHeight = lineHeightHint;
                            } else {
                                lineHeightHint = fontLineHeight;
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

        function resetStyle(resetLevel, openTags) {
            // Get key value formatting or empty array
            keyValues = [];
            if (tagKeyValues.hasOwnProperty(resetLevel)) {
                keyValues = tagKeyValues[resetLevel];
            }

            simpleTag = tagStore[resetLevel];

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
                            if (lineHeightHint < fontDefaultLineHeight) {
                                lineHeightHint = fontDefaultLineHeight;
                            }

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
                //lg("setting style to: " + (resetLevel - 1) + ", from openTag: " + openTags);
                setStyle(resetLevel - 1);
            } else {
                //lg("setting style to: default, from openTag: " + openTags);
                setDefaultStyle();
            }
        }

        // Define if we make use of phantom mode to align text if required
        // in example for justified spaced text
        var usePhantom = false;
        var phantomLines = [];
        var hadPhantom = false;

        if (textAlignment === "justified") {
            usePhantom = true;
            hadPhantom = false;
        }

        // This function stores img data as well as coordinates and size
        // from the markup, and draw the images once they are ready onto
        // the canvas
        var phantomImages = [];
        var phantomImageIds = [];
        var imgCounter = 0;
        function drawImages() {

            if (inLayoutProcess) {
                return;
            }

            if (imgCounter >= phantomImages.length) {
                if (pages.length > 0) {
                    ci.putImageData(pages[0], 0, 0);
                }
                activePage = 0;
                return;
            }

            var phantomImg = phantomImages[imgCounter];
            if (phantomImg[1].width === 0 || phantomImg[1].height === 0 || phantomImg[1].complete !== true) {
                window.requestAnimationFrame(drawImages);
                return;
            } else {
                if (pages.length > 0) {
                    clearAndFill();
                    ci.putImageData(pages[phantomImg[6]], 0, 0);
                }

                ci.drawImage(phantomImg[1], phantomImg[2], phantomImg[3], phantomImg[4], phantomImg[5]);

                if (pages.length > 0) {
                    pages[phantomImg[6]] = ci.getImageData(0, 0, canvas.width, canvas.height);
                }
                imgCounter++;
            }
        }

        // Set the amount of pages used to zero
        pages = [];

        // Set default style on refresh
        setDefaultStyle();

        // Clear the canvas and fill it with background color
        clearAndFill();

        // Do the actual iterations and draw the sourceText
        while (line < lines) {

            if (escapeLayoutProcess) {
                inLayoutProcess = false;
                escapeLayoutProcess = false;
                return;
            }

            activeLine = markupParts[line];
            hasFormat = hasFormatCheck.test(activeLine);

            // Detect image declarations
            if (imgMatch.test(activeLine)) {
                if (hasFormat) {
                    // Clean imageTag from format data if we have other tags
                    var imageTags = activeLine.match(imgMatch);
                    for (var tag = 0; tag < imageTags.length; tag++) {
                        activeLine = activeLine.replace(imageTags[tag], '');
                    }
                }

                hasFormat = true;
            }


            if (hasFormat) {
                if (parserObjectStore.length < lines) {
                    var parserObject = simpleParse(activeLine.match(tagMatchPattern)[0]);

                    // Patch the first trigger data point so the formatter starts
                    // formatting from within the first tag
                    var tagStartIndex = activeLine.indexOf(parserObject.tags[0]);
                    if (tagStartIndex > 0) {
                        parserObject.dataPoints[0] = tagStartIndex - parserObject.tags[0].length;
                    }

                    parserObjectStore.push(parserObject);

                } else {
                    var parserObject = parserObjectStore[line];
                }

                // Start cleaning up the linedata by clearing tags
                for (var tag = 0; tag < parserObject.tags.length; tag++) {
                    activeLine = activeLine.replace(parserObject.tags[tag], ' ').replace(spaceCorrection, ' ');
                }

                // Clean up image definitions from present line and alt text
                var altLine = activeLine;
                for (var image = 0; image < parserObject.imageTagStore.length; image++) {
                    activeLine = activeLine.replace(parserObject.imageTagStore[image], '');
                    altLine = altLine.replace(parserObject.imageTagStore[image], parserObject.imageStore[image].description);
                }

                // Clean up closings from processed line and alt text
                activeLine = activeLine.replace(closingMatch,  ' ').replace(spaceCorrection, ' ');
                altLine = altLine.replace(closingMatch, '');
                if (altLine.trim() !== "") {
                    altTextArray.push(altLine);
                }
            } else {
                // Define an empty parserobject if we have not markup in
                // the present linedata
                var parserObject = {};
                parserObject.data = [];
                parserObject.tags = [];
                parserObject.imageStore = [];
                parserObject.imageTagStore = [];
                parserObject.orders = [];
                parserObject.tagStore = {};
                parserObject.tagKeyValues = {};
                parserObject.triggers = [];
                parserObject.dataPoints = [];

                if (parserObjectStore.length < lines) {
                    parserObjectStore.push(parserObject);
                }

                // Push the raw, unformated line onto the altText array
                if (activeLine.trim() !== "") {
                    altTextArray.push(activeLine);
                }
            }

            var words = activeLine.trim().replace(/'\r'/g, '').trim().split(' ');
            var wordCount = words.length;

            var currentWord = 0;
            var currentSize = 0;
            var word = '';


            // The formatter level and formatter switch
            var orderLevel = 0;
            var useFormat = parserObject.tags.length !== 0 ? true : false;
            var openTags = [];

            // Shorthands for the parserObject data
            var tagStore = parserObject.tagStore;
            var tagKeyValues = parserObject.tagKeyValues;
            var triggers = parserObject.triggers;
            var orders = parserObject.orders;
            var dataPoints = parserObject.dataPoints;
            var imageStore = parserObject.imageStore;
            var orderNestedTags = parserObject.orderNestedTags;

            // Sizes for looping and such
            var orderSize = parserObject.orders.length;

            var simpleTag = '';
            var keyValues = [];


            // Reset to default values
            var fontWeight = fontDefaultWeight;
            var fontSize = fontDefaultSize;
            var fontColor = fontDefaultColor;
            var fontFamily = fontDefaultFamily;
            var fontShape = fontDefaultShape;
            var fontLineHeight = fontDefaultLineHeight;
            var lineHeightHint = fontDefaultLineHeight;

            var fontStyle = [fontShape, 'normal', fontWeight, fontSize, fontFamily];
            var wordSize = 0;
            var wordIndex = 0;

            if (usePhantom && !hadPhantom) {
                var phantomIndex = 0;
            }

            while (currentWord < wordCount) {
                // Check if we only have a single word, most likely this
                // will be the result of one or more image tags
                if (parserObject.imageStore.length !== 0 && wordCount === 1 && (hadPhantom || !usePhantom)) {
                    var currentImage = {};
                    var imageRow = [];
                    var topX = sizeX;
                    var bottomX = 0;
                    var sizeInX = 0;

                    function getTallestItem(imageRow) {
                        if (imageRow.length !== 0) {
                            var descriptionImageHeight = 0;
                            var rowHeight = 0;
                            for (var imageItem = 0; imageItem < imageRow.length; imageItem++) {
                                if (imageRow[imageItem].description[0] === "bottom") {
                                    if (descriptionImageHeight < imageRow[imageItem].description[2]) {
                                        descriptionImageHeight = imageRow[imageItem].description[2] + imageRow[imageItem].height + imageRow[imageItem].margin + imageRow[imageItem].borderwidth;
                                    }
                                }

                                if (rowHeight < imageRow[imageItem].height) {
                                    rowHeight = imageRow[imageItem].height + imageRow[imageItem].margin + imageRow[imageItem].borderwidth;
                                }
                            }

                            if (rowHeight < descriptionImageHeight) {
                                rowHeight = descriptionImageHeight;
                            }

                            return rowHeight;
                        }

                        return 0;
                    }

                    for (var item = 0; item < imageStore.length; item++) {
                        currentImage = imageStore[item];

                        var img = {};
                        img.width = parseInt(currentImage.width);
                        img.height = parseInt(currentImage.height);
                        img.margin = parseFloat(currentImage.margin);
                        img.borderwidth = parseFloat(currentImage.borderwidth) * 2;
                        img.bordercolor = currentImage.bordercolor;
                        img.align = currentImage.align;
                        img.description = ["none", 0, 0];

                        stepY += img.margin;
                        if (img.align === "center") {
                            stepY += getTallestItem(imageRow);
                            stepX = (sizeX - img.width) / 2;
                            imageRow = [];

                            topX = sizeX;
                            bottomX = 0;

                            if ((stepY + img.height + img.description[2]) > (sizeY - 20)) {
                                pages.push(ci.getImageData(0, 0, canvas.width, canvas.height));
                                clearAndFill();
                                stepY = 0;
                            }

                        } else {
                            imageRow.push(img);

                            sizeInX = img.width + img.borderwidth;

                            if (imageRow.length > 1) {
                                if (img.align === "left") {
                                    stepX = bottomX;
                                    bottomX += (sizeInX + img.margin);

                                    if (bottomX > (topX + img.margin)) {
                                        stepX = 0;
                                        stepY += getTallestItem(imageRow);
                                        imageRow = [img];
                                    }
                                } else if (img.align === "right") {
                                    stepX = topX - sizeInX;
                                    topX = (stepX - img.margin);

                                    if (topX < (bottomX - img.margin)) {
                                        stepX = sizeX - sizeInX;
                                        stepY += getTallestItem(imageRow);
                                        bottomX = 0;
                                        imageRow = [img];
                                        topX = (stepX - img.margin);
                                    }
                                }

                                if ((stepY + img.height + img.description[2]) > (sizeY - 20)) {
                                    pages.push(ci.getImageData(0, 0, canvas.width, canvas.height));
                                    clearAndFill();
                                    stepY = 0;
                                }

                            } else {
                                if (img.align === "left") {
                                    stepX = 0;
                                    bottomX = (sizeInX + img.margin);
                                    topX = sizeX;
                                } else if (img.align === "right") {
                                    bottomX = 0;
                                    stepX = topX - sizeInX;
                                    topX = (stepX - img.margin);
                                }

                                if ((stepY + img.height + img.description[2]) > (sizeY - 20)) {
                                    pages.push(ci.getImageData(0, 0, canvas.width, canvas.height));
                                    clearAndFill();
                                    stepY = 0;
                                }
                            }
                        }

                        // Add image to the stack for further drawing after script execution
                        var phantomImage = new Image();
                        phantomImage.src = currentImage.src;
                        if (phantomImageIds.indexOf([currentImage.id, line]) === -1) {
                            phantomImageIds.push([currentImage.id, line]);
                            phantomImages.push([currentImage, phantomImage, stepX, stepY, img.width, img.height, pages.length]);
                        }

                        // Add the description text underneath the image
                        stepY += img.height;
                        ci.lineWidth = 0;
                        if (currentImage.description !== '') {
                            var descriptionWords = currentImage.description.split(' ');
                            var boxWidth = img.width - 10;
                            var currentWidth = 0;
                            var descriptionLineBrake = [];
                            var descWordSize = 0.0;
                            var descSpacerSize = ci.measureText(' ').width;
                            var currentHeight = 25;

                            if (ci.measureText(currentImage.description).width > img.width) {
                                for (var wordItem = 0; wordItem < descriptionWords.length; wordItem++) {
                                    descWordSize = ci.measureText(descriptionWords[wordItem]).width;
                                    currentWidth += descWordSize;
                                    if (currentWidth > boxWidth - 10) {
                                        descriptionLineBrake.push(wordItem);
                                        currentWidth = (descWordSize + descSpacerSize);
                                        if ((wordItem + 1) < descriptionWords.length) {
                                            currentHeight += fontDefaultLineHeight;
                                        }
                                    } else {
                                        currentWidth += descSpacerSize;
                                    }
                                }

                            }

                            img.description = ["bottom", img.width, currentHeight];

                            // Draw the outline for the image if present
                            // since the height of the box has been calculated
                            if (img.borderwidth !== 0) {
                                ci.lineWidth = img.borderwidth;
                                ci.strokeStyle = img.bordercolor;
                                ci.beginPath();
                                ci.rect(stepX, stepY - img.height, img.width, img.height + img.description[2]);
                                ci.stroke();
                                ci.closePath();
                            }

                            // Draw the description box underneath the image
                            ci.fillStyle = currentImage.bg;
                            ci.fillRect(stepX, stepY, img.width, img.description[2]);

                            // Create the text clipping area
                            ci.save();
                            ci.beginPath();
                            ci.rect(stepX, stepY, img.width - 10, img.description[2]);
                            ci.closePath();
                            ci.clip();


                            // Draw the text inside the description box
                            ci.fillStyle = currentImage.fg;

                            if (descriptionLineBrake.length === 0) {
                                ci.fillText(currentImage.description, stepX + 10, stepY + 16);
                            } else {
                                var previousY = stepY;
                                var previousX = stepX;
                                var descWord = "";
                                stepX += 10;
                                stepY += 16;
                                descSpacerSize = ci.measureText(" ").width;
                                descWordSize = 0.0;

                                for (var wordItem = 0; wordItem < descriptionWords.length; wordItem++) {
                                    descWord = descriptionWords[wordItem];
                                    descWordSize = ci.measureText(descWord).width;
                                    if (descriptionLineBrake.length !== 0) {
                                        if (wordItem === 0 && descriptionLineBrake[0] === 0) {
                                            descriptionLineBrake.splice(0, 1);
                                        } else if (descriptionLineBrake[0] === wordItem) {
                                            stepY += fontDefaultLineHeight;
                                            stepX = previousX + 10;
                                            descriptionLineBrake.splice(0, 1);
                                        }

                                    }

                                    ci.fillText(descWord, stepX, stepY);
                                    stepX += (descWordSize + descSpacerSize);
                                }

                                stepY = previousY;
                            }

                            ci.restore();
                        } else {
                            // Draw the outline for the image if present
                            if (parseInt(currentImage.borderwidth) !== 0) {
                                ci.lineWidth = parseInt(currentImage.borderwidth);
                                ci.strokeStyle = currentImage.bordercolor;
                                ci.beginPath();
                                ci.rect(stepX, stepY - img.height, img.width, img.height + img.description[2]);
                                ci.stroke();
                                ci.closePath();
                            }
                        }

                        stepY -= (img.height + img.margin);
                        if (item === imageStore.length - 1 || currentImage.align === "center") {
                            stepY += (img.margin + img.height);
                            if (currentImage.description !== '') {
                                stepY += img.description[2] + img.margin;
                            }
                        }
                    }
                    stepX = 0;
                    currentWord++;
                }

                if (!hadPhantom) {
                    word = words[currentWord].trim();
                } else {
                    if (phantomData[phantomIndex] === '|' || phantomData[phantomIndex] === '-') {
                        // Reset stepX to zero, as we have a forced line brake
                        // from phantomData
                        stepX = 0;
                        phantomIndex++;

                        // Add vertical spacing according to general rules
                        if (fontDefaultLineHeight < fontLineHeight) {
                            stepY += lineHeightHint;
                        } else {
                            stepY += fontDefaultLineHeight;
                        }

                        if (!useFormat) {
                            fontLineHeight = fontDefaultLineHeight;
                        }

                    }
                    word = phantomData[phantomIndex][1];
                }

                if (useFormat) {
                    var triggerWord = "";
                    if (word !== "") {
                        triggerWord = word.match(triggerMatch)
                        if (triggerWord !== null) {
                            triggerWord = triggerWord[0].replace(triggerClear, '');
                            
                            if (triggerWord === "") {
                                triggerWord = word;
                            }
                        }
                    }

                    
                    if (orderLevel >= orderSize) {
                        setDefaultStyle();
                        useFormat = false;
                    } else {
                        //lg("IN ---- word: " + triggerWord + " --------- IN ----- ol: " + orderLevel + " --- nol: " + orders[orderLevel + 1]);
                        if ((triggers[orderLevel] === false || triggerWord === triggers[orderLevel][0][1]) && (wordIndex + 3) >= dataPoints[orderLevel]) {
                            if (orderLevel === (orderSize-1) && openTags.length === 2) {
                                openTags = [];
                                setDefaultStyle();
                                
                            }
                            
                            setStyle(orders[orderLevel]);
                            
                            if (openTags.indexOf(orders[orderLevel]) === -1) {
                                openTags.push(orders[orderLevel]);
                            }
                        }

                        if (triggers[orderLevel] === false) {
                            orderLevel++;
                            continue;
                        }
                    }
                }

                // Keep the character index sync for the trigger word index check
                wordIndex += (word.length + 1);

                // Calculate the layout and draw the words on the canvas
                wordSize = Math.ceil(ci.measureText(word).width);
                spacerSize = Math.ceil(ci.measureText(' ').width);
                var nextSize = currentSize + wordSize;

                if (!hadPhantom && nextSize > sizeX && stepX !== 0) {
                    if (fontDefaultLineHeight < fontLineHeight) {
                        stepY += lineHeightHint;
                    } else {
                        stepY += fontDefaultLineHeight;
                    }

                    if (!useFormat) {
                        fontLineHeight = fontDefaultLineHeight;
                    }

                    if (usePhantom) {
                        phantomLines.push("-");
                        //lg(phantomLines);
                    }

                    stepX = 0;
                    currentSize = 0;
                    continue;
                } else {
                    currentWord++;
                    if (!usePhantom) {
                        if (stepY > (sizeY - 40)) {
                            pages.push(ci.getImageData(0, 0, canvas.width, canvas.height));
                            clearAndFill();
                            stepX = 0;
                            stepY = 0;
                        }
                        ci.fillText(word, stepX, stepY + fontLineHeight);

                        if (hadPhantom) {
                            stepX += phantomData[phantomIndex][0];
                            phantomIndex++;
                        } else {
                            stepX += (wordSize + spacerSize);
                        }
                    } else {
                        phantomLines.push([wordSize, spacerSize, word]);
                        stepX += (wordSize + spacerSize);
                    }

                    currentSize = stepX;
                }

                if (currentWord === wordCount) {
                    if (fontDefaultLineHeight < fontLineHeight) {
                        stepY += fontLineHeight;
                    } else {
                        stepY += fontDefaultLineHeight;
                    }

                    if (usePhantom) {
                        phantomLines.push("|");
                    }

                    //stepY += fontDefaultLineHeight;
                    setDefaultStyle();
                    stepX = 0;
                }


                // Change formatting if required
                if (useFormat) {
                    if (triggers[orderLevel] !== false) {

                        //lg("OUT ---- word: "+ triggerWord + " --------- IN ----- ol: "+orderLevel+" --- nol: "+orders[orderLevel + 1]+" --- fl: "+formatLevel);
                        if (triggerWord === triggers[orderLevel][1][1]) {
                            if (orders[orderLevel] > orders[orderLevel + 1]) {
                                if (openTags.length === 1) {
                                    resetStyle(openTags[0], 0);
                                } else {
                                    var openTagItems = openTags.length - 1;
                                    while (openTagItems) {
                                        resetStyle(openTags[openTagItems], openTagItems);
                                        openTagItems--;
                                    }
                                }

                                openTags = [];

                                if (orders[orderLevel + 1] === -1) {
                                    setDefaultStyle();
                                    orderLevel++;
                                }
                            } else {
                                if (orderLevel === orderSize) {
                                    useFormat = false;
                                }
                            }
                            
                            orderLevel++;
                        }
                    } else {
                        orderLevel++;
                    }
                }
            }

            line++;

            // Switch off phantom drawing mode and start the actual drawing routine
            // after calculating the optimal spacing for the text items
            if (usePhantom && line >= lines) {
                line = 0;
                stepX = 0;
                stepY = 0;
                usePhantom = false;
                hadPhantom = true;

                var phantomData = [];
                var currentItem;
                var availableWidth = canvas.width;
                var processedItems = 0;
                var phantomLength = phantomLines.length;

                for (var textItem = 0; textItem < phantomLength; textItem++) {
                    currentItem = phantomLines[textItem];
                    if (currentItem.length === 0) {
                        continue;
                    }

                    if (currentItem === '|') {

                        // Add the data for non complete lines which not
                        // to force to be justified as the sourceText fits without justification
                        var lastItem = textItem - 1;
                        processedItems--;

                        for (var item = 0; item < processedItems; item++) {
                            var subItem = phantomLines[lastItem - (processedItems - item)];
                            phantomData.push([subItem[0] + subItem[1], subItem[2].trim()]);
                        }

                        phantomData.push([phantomLines[lastItem][0], phantomLines[lastItem][2].trim()]);

                        availableWidth = canvas.width;
                        processedItems = 0;
                        continue;
                    } else if (currentItem !== '-') {
                        availableWidth -= currentItem[0];
                        processedItems++;
                        continue;
                    } else if (currentItem === '-') {
                        var lastItem = textItem - 1;

                        // Reduce the width by 20, because we have the
                        // canvas.translate by 10 on x the x axis
                        availableWidth -= 20;

                        // Calculate the spacing we can give to each item
                        processedItems--;
                        var itemSpace = parseFloat((availableWidth / (processedItems)).toPrecision(3));

                        for (var item = 0; item < processedItems; item++) {
                            var subItem = phantomLines[lastItem - (processedItems - item)];
                            phantomData.push([subItem[0] + itemSpace, subItem[2].trim()]);
                        }

                        // Add last item without any addional spacing
                        phantomData.push([phantomLines[lastItem][0], phantomLines[lastItem][2].trim()]);

                        // Push a line break, so the formatter knows where to
                        // make a cut in the justified sourceText
                        phantomData.push("-");

                        processedItems = 0;
                        availableWidth = canvas.width;
                        continue;
                    }
                }
            }
            inLayoutProcess = false;
            window.requestAnimationFrame(drawImages);
        }

        // If we have pages, set the first page active on the canvas
        if (pages.length > 0) {
            pages.push(ci.getImageData(0, 0, canvas.width, canvas.height));
            ci.putImageData(pages[0], 0, 0);
        }

        // Setting the title and alternative tag for screenreaders from
        // cleaned markup data if not present
        // Only the alternative text becomes replaced, if there is a title
        // provided, with the text of the canvas.
        // In other cases we promote the alt text to the title, this can
        // include the first paragraph of the markup data if there is no title
        // and neither an alt text specified
        var exAlt = canvas.getAttribute("alt");
        var exTitle = canvas.getAttribute("title");

        if (exAlt !== null) {

            if (altTextArray.length > 0) {
                canvas.setAttribute("alt", altTextArray.join(' '));
            }

            if (exTitle === null) {
                canvas.setAttribute("title", exAlt);
            }
        } else {

            if (exTitle === null) {
                canvas.setAttribute("title", altTextArray[0]);
            }

            if (altTextArray.length > 0) {
                canvas.setAttribute("alt", altTextArray.slice(1).join(' '));
            }
        }


    }


    function setup() {
        if (!inLayoutProcess) {
            inLayoutProcess = true;
            escapeLayoutProcess = false;
            activePage = 0;

            // Get 2d context when present and measurements after geometry change
            canvas = document.getElementById(canvasItemId);
            ci = canvas.getContext('2d');
            offsetX = 10;
            offsetY = 10;
            sizeX = canvas.width - (offsetX * 2);
            sizeY = canvas.height - (offsetY * 2);
            ci.translate(0, 0);
            ci.translate(offsetX, offsetY);

            // If we have resized the canvas, rerun the content layouting
            if (sourceFile !== null) {
                loadText(sourceFile);
            } else if (typeof (sourceText) !== undefined) {
                processMarkup(sourceText);
            } else {
                lg("Missing markup source file and source text for canvas '" + canvasItemId + "'");
            }
        } else if (escapeLayoutProcess) {
            window.requestAnimationFrame(setup);
        }
    }

    // Set the viewed page to zero and and key handlers for
    // pagination or resizing
    var activePage = 0;
    function pagingHandler(evt) {
        evt.preventDefault();

        // This code block is used for the paginated, without image support, version
        if (evt.keyCode === 39) {
            activePage++;
            if (activePage > pages.length - 1) {
                activePage = 0;
            }
            ci.putImageData(pages[activePage], 0, 0);
            return;
        } else if (evt.keyCode === 37) {
            activePage--;
            if (activePage < 0) {
                activePage = pages.length - 1;
            }
            ci.putImageData(pages[activePage], 0, 0);
            return;
        }

        // Increasing or descreasing size by pressing the num pad plus minus
        if (evt.keyCode === 107 || evt.keyCode === 171) {
            document.getElementById(canvasItemId).width += 15;
            escapeLayoutProcess = true;
        } else if (evt.keyCode === 109 || evt.keyCode === 173) {
            if (document.getElementById(canvasItemId).width > 200) {
                document.getElementById(canvasItemId).width -= 15;
                escapeLayoutProcess = true;
            } else {
                return;
            }
        } else {
            return;
        }

        setup();

    }

    canvas.addEventListener("click", function (evt) {
        //lg("added keyboard handlers for "+canvas.getAttribute("id"));
        document.addEventListener("keyup", pagingHandler);
    });

    document.addEventListener("click", function (evt) {
        if (evt.target !== document.getElementById(canvasItemId)) {
            //lg("removed keyboard handlers for "+canvas.getAttribute("id"));
            document.removeEventListener("keyup", pagingHandler);
        }
    });


    // Get sourceFile data or directly call markup processor
    if (sourceFile !== null || sourceFile !== "") {
        loadText(sourceFile);
    } else if (typeof (sourceText) !== undefined) {
        processMarkup(sourceText);
    } else {
        lg("Missing markup source file and source text for canvas '" + canvasItemId + "'");
        return;
    }
}
