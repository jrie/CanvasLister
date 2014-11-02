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
function canvasLister_simpleParse(canvasItem, sourceFile, fontFamily, fontSize, fontWeight, backgroundColor, textColor, text) {

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



    var formatPattern = /<[^/]*>.*?<\/>/g;
    var commandPattern = /<[^/].*?>/g;
    var closeMatch = /<\/>/;

    function simpleParse(format, lineData) {
        var rawLine = lineData.replace(format, '');
        rawLine = rawLine.substr(0, rawLine.search(closeMatch));

        var rawWords = rawLine.split(" ");

        if (format.length <= 4) {
            var rawFormat = format.replace('<', '').replace('>', '');
            return [rawFormat, false, rawLine, rawWords[0], rawWords[rawWords.length - 1]];
        } else {
            if (format.indexOf("<img") !== -1) {
                var multiStore = format.replace('<img ', '').replace('</>', '').replace('">', '" ').trim().split('" ');
                var keyValue = [];
                var kvItems = multiStore.length;
                var imgObject = {};
                while (kvItems--) {
                    var keyValue = multiStore[kvItems].replace(/["]/g, '').split("=");
                    imgObject[keyValue[0]] = keyValue[1];
                }
                return ["img", imgObject];
                
            } else {
                var keyValue = format.replace('<', '').replace('>', '').replace(/["]/g, '').split("=");
            }
            
            if (keyValue[0] === 'color') {
                return [keyValue[0], keyValue[1].replace('"', ''), rawLine, rawWords[0], rawWords[rawWords.length - 1]];
            }
            
            //lg(keyValue);
            return [];
        }
    }

    // Markup processor
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


            hasFormat = formatPattern.test(lineData);
            if (hasFormat) {
                var formatedParts = lineData.match(formatPattern);
                var lineCommands = lineData.match(commandPattern);
                lg(formatedParts);
                //lg(lineCommands);

                var current = 0;
                while (current < lineCommands.length) {
                    var format = lineCommands[current];
                    //lg(format);
                    parserData.push(simpleParse(format, formatedParts[current]));
                    lineData = lineData.replace(formatedParts[current], parserData[parserData.length - 1][2]);
                    parserData[current].splice(2, 1);
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
                
                
                              


                var nextSize = currentSize + Math.ceil(ci.measureText(word+' ').width);

                if (nextSize > sizeX) {
                    stepY += 18;
                    stepX = 0;
                    currentSize = 0;
                    wordSet = false;
                } else {
                    currentWord++;
                    ci.fillText(word, stepX, stepY);
                    stepX += Math.ceil(ci.measureText(word+' ').width);
                    currentSize = stepX;
                    wordSet = true;
                    
                }

                if (currentWord === wordCount) {
                    stepY += 18;
                    stepX = 0;
                }
                

                // Get out of formatting
                // parserItems is already set
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
