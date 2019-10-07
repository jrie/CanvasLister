canvasLister
=======

canvasLister is a parsing and layout engine with css like syntax for text and images on html5 canvas elements.

See the demo live here: http://jrie.github.io/CanvasLister/example.html

Usage
=======

A short guide on the feature list and syntax to create the markup, can be found "example\source.txt" or in "example\guide_and_outline.json" in the example folder, which also gives a more detailed view to the syntax and feature options and plans.


General feature overview
=======

- Setting a base font family, size and color
- Tag formats like 'b', 'i', 'bi' for bold, italic and bold italic text elements
- 'color="#hexValue"' to color text
- Font sizes in in px and %, while percentage beeing relative to the base font size set on canvaslister init
- Mixing of tags in the markup, like 'bi color="#00aa22" size="120%'
- Support for nested tags
- Filtering of image data from markup and parsing of general attributes for that image
- Floating of images if set left/right, if the images fit the width they float, but also overflow
- Image descriptions with auto height feature and text allocation


Notes and testing
=======
The project was tested working in Firefox, IE10 and Chrome, the only exception with Chrome, Chrome requires to be started with the parameter: "--allow-file-access-from-files", otherwise local Ajax requests will fail to load the source.


If you have any questions or feedback, please let me know.
