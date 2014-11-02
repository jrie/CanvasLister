canvas lister
=======

"Canvas lister" is work-in-progress with the idea to load markup data and convert/display this information on a HTML5 canvas element with styling as well as basic text alignment inside the canvas drawing area.

Currently there are two versions.

The "Canvas Lister SimpleParse" version [rough testing version]

Which was written to only support single tag format elements, including a very "stupid" parser, but already displays the information on a canvas in a styled fashion. Nested tags are not supported by this version, but supports basic customization like:
- General default font family, size and color
- Tag formats like 'b', 'i', 'bi' for bold, italic and bolditalic typo and 'color="#hexValue"' to color text parts, please note that those can't be nested into each other with this version.
More information can be found in the "source1.txt" - which gets loaded and demos the basic version features.


The "Canvas Lister" version [work in progress version]

This version has a better tag parser and allows nesting of tags. And is now the somehow smarter one. But does not yet have the "messy way of applying styles to the elements, which had of how the parser results are prepared, ordered and such. This version is using "source2.txt".

Note: The project was only tested in Firefox. If you want to test it, in Chrome, please start Chrome with the parameter: "--allow-file-access-from-files", otherwise the Ajax request to load the source markup files will brake. But it simply might not work in this browser yet like it might not work in IE.

If you have any questions or feedback, please let me know :)


