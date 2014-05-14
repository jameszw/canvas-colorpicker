(function() {

    var ENTER = 13;

    /*
     * Demo
     */
    function Demo(config) {
        this.config = config;

        this.el = document.getElementById(this.config.id);
        this.colorPicker = this.config.colorPicker;

        this.colorDisplay = new ColorDisplay(this.el.getElementsByClassName("color")[0]);
        
        this.hexDisplay = new HexDisplay(this.el.getElementsByClassName("hex")[0],
                                         this.colorPicker);

        this.hslPanel = new ColorPanel(this.el.getElementsByClassName("hsl")[0], 
                                       this.colorPicker, ["h", "s", "l"]); 

        this.hslPanel.onInputSubmit = function() {
            var h = this.inputs["h"].value,
                s = this.inputs["s"].value,
                l = this.inputs["l"].value;
            this.colorPicker.setHSL(h, s, l);
        };

        this.rgbPanel = new ColorPanel(this.el.getElementsByClassName("rgb")[0],
                                       this.colorPicker, ["r", "g", "b"]);

        this.rgbPanel.onInputSubmit = function() {
            var r = this.inputs["r"].value,
                g = this.inputs["g"].value,
                b = this.inputs["b"].value;
            this.colorPicker.setRGB(r, g, b);
        };

        this.attachEventListeners();
    }

    Demo.prototype.attachEventListeners = function() {
        var self = this;

        this.colorPicker.canvas.addEventListener(CanvasColorPicker.COLOR_PICKED, function(e) {
            var detail = e.detail,
                rgb = detail.rgb,
                hsl = detail.hsl,
                r = rgb[0], g = rgb[1], b = rgb[2],
                h = hsl[0], s = hsl[1], l = hsl[2];

            self.colorDisplay.setRGB(r, g, b);
            self.hexDisplay.setRGB(r, g, b);
            self.hslPanel.setColor({h: h, s: s, l: l});
            self.rgbPanel.setColor({r: r, g: g, b: b});
        }, false);
    };

    window.Demo = Demo;


    /*
     * ColorDisplay
     */
    function ColorDisplay(el) {
        this.el = el;
    }

    ColorDisplay.prototype.setRGB = function(r, g, b) {
        this.el.style["backgroundColor"] = rgbToHex(r, g, b);
    };

    /* 
     * HexDisplay
     */
    function HexDisplay(el, colorPicker) {
        this.el = el;
        this.colorPicker = colorPicker;
        this.input = this.el.getElementsByTagName("input")[0];

        this.attachEventListeners();
    }

    HexDisplay.prototype.attachEventListeners = function() {
        var self = this;

        this.input.addEventListener("keyup", function(e) {
            if (e.keyCode === ENTER) {
                self.inputToPicker();
            }
        }, false);
    };

    HexDisplay.prototype.inputToPicker = function() {
        var value = this.input.value;
        if (value.charAt(0) == '#') {
            value = value.substring(1);
        }

        var rgb = hexToRgb(value);

        this.colorPicker.setRGB(rgb[0], rgb[1], rgb[2]);
    };

    HexDisplay.prototype.setRGB = function(r, g, b) {
        this.input.value = rgbToHex(r, g, b);
    };

    /*
     * HslPanel
     */
    function ColorPanel(el, colorPicker, components) {
        this.el = el;
        this.colorPicker = colorPicker;

        this.inputs = {};
        for (var i = 0; i < components.length; i++) {
            var comp = components[i]; 

            this.inputs[comp] = this.getInput(comp);
        }

        this.attachEventListeners();
    }

    ColorPanel.prototype.getInput = function(className) {
        var c = this.el.getElementsByClassName(className)[0];
        var input = c.getElementsByTagName("input")[0]; 

        return input;
    };

    ColorPanel.prototype.attachEventListeners = function() {
        var self = this;

        this.el.addEventListener("keyup", function(e) {
            var keyCode = e.which || e.keyCode;

            if (keyCode === ENTER) {
                var comp = self.getComponentForInput(e.target);

                if (comp != null && self.onInputSubmit != null) {
                    self.onInputSubmit();
                }
            }
        });
    };

    ColorPanel.prototype.getComponentForInput = function(input) {
        for (var key in this.inputs) {
            if (this.inputs[key] == input) {
                return key;
            }
        }
        return null;
    };

    ColorPanel.prototype.setColor = function(values) {
        for (var key in values) {
            var input = this.inputs[key];

            if (input != null) {
                input.value = Math.round(values[key]);
            }
        }
    };

    /*
     * Helpers
     */
    function toHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + toHex(r) + toHex(g) + toHex(b);
    }

    function hexToRgb(hex) {
        var n = parseInt(hex, 16);
        var r = (n >> 16) & 255;
        var g = (n >> 8) & 255;
        var b = n & 255;

        return [r, g, b];
    }

})();
