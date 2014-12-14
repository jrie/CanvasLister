canvas lister
=======

"Canvas lister" is work-in-progress with the idea to load custom markup data in form of img declerations and text, convert & display this information on a HTML5 canvas element with a styling syntax similar to CSS.

Note: The project was mainly tested in Firefox, but does run in IE10 and Chrome, the only exception with Chrome (if not installed online) is the exception that Chrome requires to be started with the parameter: "--allow-file-access-from-files", otherwise a (perhaps local) Ajax request to load the source markup files will fail.

There are several versions, explanation starting from initial to current development version. The canvasLister.html file includes examples of the usage of canvasLister and the source files have example markup which in addition also loads the images present. A short guide on the feature list and syntax to create the markup, can be found in form of the "formattingGuide.json".

The "canvasLister_simpleParse.js" version [first testing version, does not read nested markup tags]

Which was written to only support single tag format elements, including a very simple parser, but already displays the information on a canvas in a styled fashion. Nested tags are not supported by this version, but supports basic customization like:
- General default font family, size and color
- Tag formats like 'b', 'i', 'bi' for bold, italic and bolditalic typo and 'color="#hexValue"' to color text parts, please note that those can't be nested into each other with this version.
More information can be found in the "source1.txt" - which gets loaded and demos the basic version features.


The "canvasLister_improvedParse.js" version

This version has a better tag parser and allows nesting of tags and formatting. Its using "source2.txt" and supports in addition to the simpleParse version:
- Font sizes in in px and %, the latter one relative to the base font size set in the startup parameters
- Mixing of tags, so there can be markups like 'bi color="#00aa22" size="120%'
- Filtering of image data from markup and also parsing of general attributes for that image, display of image is not implemented in this version so
- More accurate spacing when switching font sizes in a textline 


The "canvasLister_phantom.js" version

Its named phantom version because of a repeated iteration over the actual content to allow looking at complete lines to allow "justification" of text data. Working nice with the formatting of "source2.txt".


The "canvasLister_phantom_image.js" and "canvasLister_phantom_pagination.js" versions [hands on version(s)]

These versions introduce better parsing, and usage of images or pagination respectively. If you need image support and pagination, you should use canvasLister_phantom_v2.js which is also recommended


The "canvasLister_phantom_v2.js" version [development version - recommended to use]

This version combines the basic image support and pagination and in addition does allow dynamic canvas resizing in width by pressing plus/minus on the keyboard or numpad as well as generating alternative texts and title attribute from the markup onto the canvas, if no title is provided, which should be an attempt to work better with screenreaders.


If you have any questions or feedback, please let me know!
