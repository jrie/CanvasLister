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


    // Setting default values for background color, font family, size, color and if not provided in init
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

    ci.font = fontWeight.trim() + ' ' + fontSize.toString() + 'px ' + fontFamily.trim();
    ci.textAlign = "left";
    ci.fillStyle = textColor;

    var textRawData = '';
    var dataLoaded = false;

    // Textloader using ajax
    function loadText() {
        var dataLoader = new XMLHttpRequest();
        dataLoader.onreadystatechange = function () {
            if (dataLoader.readyState === 4) {
                textRawData = dataLoader.responseText;
                processMarkup(textRawData);
            }
        };
        dataLoader.open("GET", sourceFile);
        dataLoader.send();
    }

    var startMatch = /<[^\/][a-z0-9\s\=\"\#\'\*]*>/g;
    var imgMatch = /<img[^<]*/g;
    
    function simpleParse(formatData) {
        lg("--------------------------------");
        
        var parserObject = {};
        parserObject.data = [];
        parserObject.tags = [];
        parserObject.images = [];
        parserObject.order = [];
        parserObject.keyValueStore = {};
        
        // Preprocess and remove image from formatting data
        var imageData = formatData.match(imgMatch);
        if (imageData !== null) {
            parserObject.images = imageData;
            for (var img = 0; img < imageData.length; img++) {
                formatData = formatData.replace(imageData[img], '');
                parserObject.order.push(-3);
            }
        }
        
        
        parserObject.tags = formatData.match(startMatch);

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
            if (startIndex === -1 && closingIndex === -1) {
                continue;
            }

            // If we have no closing tag.. this will skip an entry, but not brake something
            // parse as much as possible
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
                    if ( startIndex === -1 && formatData.indexOf(parserObject.tags[tag]) > 0) {
                        parserObject.order.push(openTag-1);
                    } else {
                        parserObject.order.push(-1);
                    }
                    //parserObject.order.push(-1);
                }
                //parserObject.order.push(tagOrder);
                
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
                if (startIndex > 0) {
                    parserData = formatData.substring(parserObject.tags[tag].length, startIndex);
                    formatData = formatData.substr(startIndex);
                    parserObject.data.push(parserData);
                    parserObject.order.push(tagOrder);
                    if (!hasOpenTag) {
                        hasOpenTag = true;
                        openTag = tagOrder;
                    }
                    tagOrder++;
                    
                }
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
                }
            }
        }

        // Merge duplicated tags and rewrite order points
        tagLength = parserObject.tags.length;
        var tagOrders = parserObject.order.length;

        for (var tag = 0; tag < tagLength; tag++) {
            var currentTag = parserObject.tags[tag];
 
            for (var subTag = tag+1; subTag < tagLength; subTag++) {
                if (currentTag === parserObject.tags[subTag]) {
                    for (var item = 0; item < tagOrders; item++) {
                        if (subTag === parserObject.order[item]) {
                            parserObject.order[item] = tag;
                        }
                    }
                    
                    parserObject.tags.splice(subTag, 1);
                    tagLength--;
                    tag--;
                }
            }
        }
        
        lg(parserObject.data);
        lg(parserObject.order);
        lg("--------------------------------");
        
        
        // Create key value store for formatting after parsing the data
        //parserObject.keyValueStore
        var keyValueMatch = /[a-z\=\"\#0-9]*/g;
        
        
        
        return parserObject;
    }

    // Markup processor
    var hasFormatCheck = /<[^/]*>.*<\/>/g;
    var commandPattern = /<[^/].*[<\/>]+/g;
    function processMarkup(textRawData) {
        var textLinesData = textRawData.trim().split('\n');

        var line = 0;
        var lines = textLinesData.length - 1;
        var stepY = 0;
        var stepX = 0;
        var hasFormat = false;
        var parserData = [];

        ci.translate(offsetX, offsetY);

        while (line < lines) {
            parserData = [];
            var lineData = textLinesData[line];


            hasFormat = hasFormatCheck.test(lineData);
            
            // Forcefull image detection workaround
            if(lineData.indexOf("<img") !== -1) {
                hasFormat = true;
            }
            
            if (hasFormat) {
                var lineCommands = lineData.match(commandPattern);
                //lg(lineCommands);

                var current = 0;
                while (current < lineCommands.length) {
                    var parserObject = simpleParse(lineCommands[current]);
                    //lg(parserObject);
                    /*parserData.push();
                     lineData = lineData.replace(formatedParts[current], parserData[parserData.length - 1][2]);
                     parserData[current].splice(2, 1);
                     */
                    current++;
                }

                //lg(parserData);

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
                if (activeParser === -1) {
                    parserItems = parserData.length;

                    while (parserItems--) {
                        var parserItem = parserData[parserItems];
                        if (parserItem.length === 0) {
                            continue;
                        }

                        if (word === parserItem[2]) {
                            //lg(parserItem);
                            activeParser = parserItems;

                            //ci.font = 'normal normal normal ' + fontWeight.trim() + ' ' + fontSize.toString() + 'px ' + fontFamily.trim();
                            //ci.textAlign = "right";
                            //ci.fillStyle = textColor;
                            switch (parserItem[0]) {

                                case 'b':
                                    ci.font = 'normal normal bold ' + fontSize.toString() + 'px ' + fontFamily.trim();
                                    break;
                                case 'i':
                                    ci.font = 'italic normal normal ' + fontSize.toString() + 'px ' + fontFamily.trim();
                                    break;
                                case 'bi':
                                    ci.font = 'italic normal bold ' + fontSize.toString() + 'px ' + fontFamily.trim();
                                    break;
                                case 'color':
                                    ci.fillStyle = parserItem[1];
                                    break
                                default:
                                    ci.font = fontWeight.trim() + ' ' + fontSize.toString() + 'px ' + fontFamily.trim();
                                    break;
                            }

                            break;
                        }

                    }

                }





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

                 ci.font = fontWeight.trim() + ' ' + fontSize.toString() + 'px ' + fontFamily.trim();
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
