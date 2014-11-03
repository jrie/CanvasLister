"use strict";
window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;

var hasConsole = typeof (window.console) !== "undefined" ? true : false;

function lg(msg) {
    if (hasConsole) {
        console.log(msg);
    }
}

//canvasLister("canvasItem1", "source1.txt", null, null, "#000", "bold", "#00aa00");
//canvasLister("canvasItem2", "source1.txt", "Lithos Pro", "16", null, "#000033", "#dedede");
function canvasLister(canvasItem, sourceFile, fontFamily, fontSize, fontWeight, backgroundColor, textColor, text) {

    // The allowed attributes and there types (0 = Num, 1 = Hex, 2 = Text)
    var attributes = {
        "size": 0,
        "color": 1,
        "align": 2
    };

    var validTexts = ["left", "right", "center"];
    var validUnits = ["px", "%"];
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
    var offsetY = 20;
    var sizeX = canvas.width - (offsetX * 2);
    var sizeY = canvas.height - (offsetY * 2);

    // Check whether a sourcefile is given and if text then is provided which is required
    if (sourceFile === null) {
        if (typeof (text) === "undefined") {
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

    if (fontFamily === null) {
        fontFamily = "sans-serif";
    }

    if (fontSize === null) {
        fontSize = 11;
    }

    if (fontWeight === null) {
        fontWeight = "normal";
    }

    if (textColor === null) {
        textColor = '#000';
    }

    fontWeight = fontWeight.trim();
    fontFamily = fontFamily.trim();

    ci.font = fontWeight + ' ' + fontSize.toString() + 'px ' + fontFamily;
    ci.textAlign = "left";
    ci.fillStyle = textColor;

    var rawData = '';

    // Textloader using ajax
    function loadText() {
        var dataLoader = new XMLHttpRequest();
        dataLoader.onreadystatechange = function () {
            if (dataLoader.readyState === 4) {
                rawData = dataLoader.responseText;
                processMarkup(rawData);
            }
        };
        dataLoader.open("GET", sourceFile);
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
        lg("---parser data------------------");

        var parserObject = {};
        parserObject.data = [];
        parserObject.tags = [];
        parserObject.imageStore = [];
        parserObject.imageTagStore = [];
        parserObject.order = [];
        parserObject.tagStore = {};
        parserObject.tagFormatStore = {};
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
                imageObject.title = "";
                imageObject.description = "";
                imageObject.fg = "#000000";
                imageObject.bg = "#ffffff";
                imageObject.src = "none";
                imageObject.height = "0px";
                imageObject.width = "0px";
                imageObject.id = imageOrder;

                // Clean imageTag from format data
                formatData = formatData.replace(imageTag, '');

                // Clean imageTag from format data
                imageTag = imageTag.replace(imgReplace, '');

                // Check if we can get a title and remove it from the imageTag
                imgTitle = imageTag.match(imgTitleMatch);
                if (imgTitle !== null) {
                    imageObject.title = imgTitle[0].split("=", 2)[1];
                    imageTag = imageTag.replace(imgTitleMatch, '');
                }

                // Check if we can get a description and remove it from imageTag
                imgDescription = imageTag.match(imgDescriptionMatch);
                if (imgDescription !== null) {
                    imageObject.description = imgDescription[0].split("=", 2)[1];
                    imageTag = imageTag.replace(imgDescriptionMatch, '');
                }

                keyValues = imageTag.match(keyValueMatch);
                if (keyValues !== null) {
                    for (var keyValue = 0; keyValue < keyValues.length; keyValue += 2) {
                        imageObject[keyValues[keyValue]] = keyValues[keyValue + 1];
                    }

                    parserObject.order.push(imageOrder);
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


        parserObject.tags = formatData.match(formatTagMatch);

        var parserData = "";
        var tagOrder = 0;
        var tagLength = parserObject.tags.length;

        var startIndex = 0;
        var closingIndex = 0;
        var hasOpenTag = false;
        var openTag = 0;

        for (var tag = 0; tag < tagLength; tag++) {

            startIndex = formatData.indexOf(parserObject.tags[tag + 1]);
            closingIndex = formatData.indexOf('</>');

            //lg(startIndex+" "+closingIndex)
            /*
             if (startIndex === -1 && closingIndex === -1) {
             continue;
             }
             */

            // If we have no closing tag.. this will skip an entry/entries
            // TODO: parse as much as possible and simply add fictional closings
            if (closingIndex === -1) {
                continue;
            }

            // This matches the last format tag in the list
            if (startIndex === -1 && formatData.indexOf(parserObject.tags[tag]) === 0) {
                parserData = formatData.substr(parserObject.tags[tag].length, closingIndex - parserObject.tags[tag].length);
                parserObject.data.push(parserData);
                parserObject.order.push(tag);
                continue;
            }

            // Matches if we have resolved a encapsulated tags
            if (tagOrder === -1) {
                parserData = formatData.substring(0, formatData.indexOf(parserObject.tags[tag]));

                if (parserData === '') {
                    tag--;
                    tagOrder++;
                    continue;
                }

                parserObject.data.push(parserData);
                if (hasOpenTag) {
                    parserObject.order.push(parserObject.tags.indexOf(parserObject.tags[tag]));
                } else {
                    if (startIndex === -1 && formatData.indexOf(parserObject.tags[tag]) > 0) {
                        parserObject.order.push(openTag - 1);
                    } else {
                        parserObject.order.push(-1);
                    }
                }

                formatData = formatData.substr(parserData.length);
                tag--;
                tagOrder++;

                continue;
            }



            // No other open tag found
            if (startIndex === -1) {
                if (closingIndex !== formatData.length - 3) {
                    parserData = formatData.substring(0, closingIndex);
                } else {
                    parserData = formatData.substring(0, formatData.indexOf(parserObject.tags[tag]));
                }
                parserObject.data.push(parserData);
                parserObject.order.push(tagOrder);
                formatData = formatData.substr(closingIndex + 3);

                tagOrder--;
                tag--;

                continue;
            }

            // Tag inside a tag
            if (startIndex < closingIndex) {
                parserData = formatData.substring(parserObject.tags[tag].length, startIndex);
                formatData = formatData.substr(startIndex);
                parserObject.data.push(parserData);
                parserObject.order.push(tagOrder);

                if (!hasOpenTag) {
                    hasOpenTag = true;
                    openTag = tagOrder;
                }

                tagOrder++;
            } else {
                // Single tag element or closing, might be inside another tag
                parserData = formatData.substring(parserObject.tags[tag].length, closingIndex);
                parserObject.data.push(parserData);

                formatData = formatData.substr(closingIndex + 3);

                if (hasOpenTag) {
                    parserObject.order.push(tagOrder);
                    hasOpenTag = false;
                } else {
                    parserObject.order.push(parserObject.tags.indexOf(parserObject.tags[tag]));
                }

                while (tagOrder-- > openTag) {
                    formatData = formatData.replace('</>', '');
                    /*
                     parserObject.order.push(tagOrder);
                     parserObject.data.push('');
                     */
                }
            }
        }

        // Merge duplicated tags and rewrite order points
        tagLength = parserObject.tags.length;
        var tagOrders = parserObject.order.length;
        var currentTag = parserObject.tags[0];
        var subTag = 0;
        var orderItem = 0;
        for (var tag = 1; tag < tagLength; tag++) {
            for (subTag = tag + 1; subTag < tagLength; subTag++) {
                if (currentTag === parserObject.tags[subTag]) {
                    for (orderItem = 0; orderItem < tagOrders; orderItem++) {
                        if (subTag === parserObject.order[orderItem]) {
                            parserObject.order[orderItem] = tag;
                        }
                    }

                    parserObject.tags.splice(subTag, 1);
                    tagLength--;
                    tag--;
                }
            }

            currentTag = parserObject.tags[tag];
        }

        // Create key value store for formatting after parsing the data
        //var parserObject.tagFormatStore = {};
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
                parserObject.tagStore[tag] = false;
            }

            if (keyValues !== null) {
                permittedKeyValues = [];
                for (var keyValue = 0; keyValue < keyValues.length; keyValue += 2) {
                    if (checkKeyValuePair([keyValues[keyValue], keyValues[keyValue + 1]])) {
                        permittedKeyValues.push([keyValues[keyValue], keyValues[keyValue + 1]]);
                    }
                }

                parserObject.tagFormatStore[tag] = permittedKeyValues;
            } else {
                parserObject.tagFormatStore[tag] = [];
            }


        }

        // Create the triggers for the formatter
        // var parserObject.triggers = [];
        var triggerMatch = /[^_][\w\d\-\'\"\#]*/g;
        var triggers = [];
        var parserData = "";
        var triggerOne = "";
        var triggerTwo = "";
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
        lg(parserObject.tags);
        lg(parserObject.data);
        lg(parserObject.order);
        lg(parserObject.tagStore);
        lg(parserObject.tagFormatStore);

        if (parserObject.imageTagStore.length !== 0) {
            lg(parserObject.imageStore);
            lg(parserObject.imageTagStore);
        }

        lg(parserObject.triggers);
        lg("---object-----------------------");
        lg(parserObject);
        lg(" ");
        lg("  ");

        return parserObject;
    }

    // Markup processor
    var hasFormatCheck = /<[^/]*>.*<\/>/g;
    var tagMatchPattern = /<[^<\s]{0,}.*[<\/>]+/g;
    function processMarkup(rawData) {
        var textLinesData = rawData.trim().split('\n');

        var line = 0;
        var lines = textLinesData.length - 1;
        var stepY = 0;
        var stepX = 0;
        var hasFormat = false;
        var parserData = [];

        ci.translate(offsetX, offsetY);

        while (line < lines) {
            var lineData = textLinesData[line];

            hasFormat = hasFormatCheck.test(lineData);

            // Forcefull image detection workaround
            if (lineData.indexOf("<img") !== -1) {
                hasFormat = true;
            }

            if (hasFormat) {
                var lineTags = lineData.match(tagMatchPattern);
                //lg(lineTags);

                var current = 0;
                while (current < lineTags.length) {
                    var parserObject = simpleParse(lineTags[current]);
                    /*parserData.push();
                     lineData = lineData.replace(formatedParts[current], parserData[parserData.length - 1][2]);
                     parserData[current].splice(2, 1);
                     */
                    current++;
                }
            }

            var words = lineData.split(" ");
            var wordCount = words.length;
            var currentWord = 0;
            var word = '';
            var currentSize = 0;
            var parserItems = 0;
            var activeParser = -1;
            var wordSet = false;

            while (currentWord < wordCount) {

                word = words[currentWord];

                // Set formatting for the text
                /*
                 if (activeParser === -1) {
                 parserItems = parserData.length;

                 while (parserItems--) {
                 var parserItem = parserData[parserItems];
                 if (parserItem.length === 0) {
                 continue;
                 }

                 if (word === parserItem[2]) {
                 activeParser = parserItems;

                 //ci.font = 'normal normal normal ' + fontWeight + ' ' + fontSize.toString() + 'px ' + fontFamily;
                 //ci.textAlign = "right";
                 //ci.fillStyle = textColor;
                 switch (parserItem[0]) {

                 case 'b':
                 ci.font = 'normal normal bold ' + fontSize.toString() + 'px ' + fontFamily;
                 break;
                 case 'i':
                 ci.font = 'italic normal normal ' + fontSize.toString() + 'px ' + fontFamily;
                 break;
                 case 'bi':
                 ci.font = 'italic normal bold ' + fontSize.toString() + 'px ' + fontFamily;
                 break;
                 case 'color':
                 ci.fillStyle = parserItem[1];
                 break
                 default:
                 ci.font = fontWeight + ' ' + fontSize.toString() + 'px ' + fontFamily;
                 break;
                 }

                 break;
                 }

                 }

                 }
                 */





                var nextSize = currentSize + Math.ceil(ci.measureText(word + ' ').width);

                if (nextSize > sizeX) {
                    stepY += 18;
                    stepX = 0;
                    currentSize = 0;
                    wordSet = false;
                } else {
                    currentWord++;
                    ci.fillText(word, stepX, stepY);
                    stepX += Math.ceil(ci.measureText(word + ' ').width);
                    currentSize = stepX;
                    wordSet = true;

                }

                if (currentWord === wordCount) {
                    stepY += 18;
                    stepX = 0;
                }


                // Get out of formatting
                // parserItems is already set
                /*
                 if (wordSet && activeParser !== -1) {
                 parserItem = parserData[activeParser];
                 if (word === parserItem[3] || word.substr(0, word.length-1) === parserItem[3]) {

                 parserData.splice(activeParser, 1);

                 ci.font = fontWeight + ' ' + fontSize.toString() + 'px ' + fontFamily;
                 ci.textAlign = "left";
                 ci.fillStyle = textColor;
                 activeParser = -1;
                 }
                 }
                 */

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
