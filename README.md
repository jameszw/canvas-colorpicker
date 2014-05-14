Canvas Color Picker
===================

A simple JavaScript color picker using `canvas`.

## Usage

Include `canvas-colorpicker.min.js` in your html (this file can be found under the
`build/` directory):

    <script src="canvas-colorpicker.min.js"></script>

After the DOM is ready, call the constructor, passing in the parent element ID 
of the color picker:

    var colorPicker = new CanvasColorPicker({
        id: "colorpicker",
        size: 300
    });

If an ID isn't supplied, a container element will be automatically created for 
the color picker.

## Options

`id`

The ID of the parent element of the color picker's `canvas` element.

`size`

The width/height dimensions of the color picker's `canvas` element.


## Methods

`setRGB(red, green, blue)`

Sets the color picker's color to the specified RGB value. A
`CanvasColorPicker.COLOR_PICKED` event is dispatched after the color is set
(see below).

`setHSL(hue, saturation, lightness)`

Sets the color picker's color to the specified HSLvalue. A
`CanvasColorPicker.COLOR_PICKED` event is dispatched after the color is set
(see below).
`getColor()`

Returns an object containing two object properties `rgb` and `hsl`.

    var color = canvasColorPicker.getColor();
    color.rgb;  // an array of RGB values, i.e. [144, 100, 80]
    color.hsl;  // an array of HSL values, i.e. [300, 80, 50]

`getRGB()`

Shorthand for `getColor().rgb`.

`getHSL()`

Shorthand for `getColor().hsl`.

## Events

`CanvasColorPicker.COLOR_PICKED`

This event is dispatched whenever a color is picked or set in the picker. To
listen for this event, add an event listener to the color's `canvas` property.

The picked color is returned with the event in both RGB and HSL formats. These
values can be found under the event's `detail` property, with the property names 
`rgb` and `hsl`.

Example usage:

    canvasColorPicker.canvas.addEventListener(CanvasColorPicker.COLOR_PICKED, function(e) {
        var detail = e.detail;

        // Get the picked color
        var rgb = detail.rgb;   // an array containing rgb values
        var hsl = detail.hsl;   // an array containing hsl values
    });


## License
