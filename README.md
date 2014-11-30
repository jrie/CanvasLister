canvas lister
=======

"Canvas lister" is work-in-progress with the idea to load markup data and convert/display this information on a HTML5 canvas element with styling as well as basic text alignment inside the canvas drawing area.

Note: The project was tested in Firefox, IE10 and Chrome to be working, with the exception that Chrome requires to be started with the parameter: "--allow-file-access-from-files", otherwise the Ajax request to load the source markup files will brake. Parsing of simple chained tags has been fixed in all versions.

There are several versions, explanation starting from initial to current development version

The "canvasLister_simpleParse.js" version [first testing version]

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

Its named phantom version because of a repeated iteration over the actual content to allow looking at complete lines to allow "justification" of text data. This is the recommended version if you want to have the justification feature, which looks pretty nice while working very nicely with the formatting of "source2.txt".


The "canvasLister_phantom_image.js" and "canvasLister_phantom_pagination.js" versions [hands on version(s)]

These version introduced a better parsing, which had been broken earlier but is now fixed in all versions including from the improved parse version. Also this versions started a implementation for first draft image support according to the feature list or pagination of the content which should be later available in a combined version after image processing, layouting and scaling features are done properly.

If you have any questions or feedback, please let me know!
