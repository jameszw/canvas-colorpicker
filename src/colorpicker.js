(function() {

    /*
     * ColorPicker
     */
    function ColorPicker(config) {
        // TODO: more flexible creation of canvas based on id
        // TODO set canvas width/height
        this.config = config;

        this.el = document.getElementById(this.config.id);

        this.canvas = document.createElement("canvas");
        this.canvas.setAttribute("width", this.config.size);
        this.canvas.setAttribute("height", this.config.size);
        this.el.appendChild(this.canvas);

        this.ctx = this.canvas.getContext("2d");

        Sprite.apply(this, [this.ctx, 0, 0, this.canvas.width, this.canvas.height]);

        this.huePicker = new HuePicker(this.ctx, 0, 0, 
                                       this.canvas.width, this.canvas.height);

        var side = this.canvas.width / 2,
            pos = this.centerX - side / 2;

        this.colorSquare = new ColorSquare(this.ctx, pos, pos, side, side);

        this.attachEventListeners();
    };

    ColorPicker.COLOR_PICKED = "colorPicked";

    ColorPicker.prototype.draw = function() {
        this.huePicker.draw();
        this.colorSquare.draw();
    };

    ColorPicker.prototype.attachEventListeners = function() {
        // With `self`, we don't need to worry about browser support for
        // Function.prototype.bind.
        var self = this;
        var isDragging = false;

        // Only 2 objects to worry about.
        this.interactables = [this.huePicker, this.colorSquare];

        this.canvas.addEventListener('mousedown', function(e) {
            isDragging = true;
            self.onInteraction(e);
        }, false);

        this.canvas.addEventListener('mousemove', function(e) {
            if (isDragging == true) {
                // Only allow interaction when the mouse is being dragged.
                self.onInteraction(e);
            }
        }, false);

        this.canvas.addEventListener("mouseup", function() {
            isDragging = false;
        }, false);

        this.canvas.addEventListener(HuePicker.HUE_PICKED, function(e) {
            var extra = e.detail;
            if (extra != null && extra.hsl != null) {
                // Update colorSquare with new hue.
                self.colorSquare.draw(extra.hsl[0]);
            }
        }, false);

        this.canvas.addEventListener(ColorSquare.SQUARE_PICKED, function(e) {
            // Simply relay this event under a new event name for outside use.
            var ev = new CustomEvent(ColorPicker.COLOR_PICKED, {
                detail: e.detail
            });

            self.canvas.dispatchEvent(ev);
        }, false);
    };

    ColorPicker.prototype.setRGB = function(r, g, b) {
        this.huePicker.setRGB(r, g, b);
        this.colorSquare.setRGB(r, g, b);
    };

    ColorPicker.prototype.setHSL = function(h, s, l) {
        this.huePicker.setHSL(h, s, l);
        this.colorSquare.setHSL(h, s, l);
    };

    ColorPicker.prototype.getCanvasPositionForEvent = function(e) {
        var x = e.clientX - this.canvas.offsetLeft
                    + document.body.scrollLeft + document.documentElement.scrollLeft;
        var y = e.clientY - this.canvas.offsetTop
                    + document.body.scrollTop + document.documentElement.scrollTop;
        return {
            top: y,
            left: x
        };
    };

    ColorPicker.prototype.onInteraction = function(e) {
        var pos = this.getCanvasPositionForEvent(e),
            x = pos.left,
            y = pos.top;

        for (var i = 0; i < this.interactables.length; i++) {
            var sprite = this.interactables[i];

            if (sprite.containsPoint(x, y)) {
                sprite.pickPoint(x, y);
            }
        }
    };

    window.ColorPicker = ColorPicker;


    /*
     * Sprite
     */
    function Sprite(ctx, x, y, w, h) {
        this.ctx = ctx;

        // x-, y-coords denote absolute top-left position within the canvas.
        x = (x == null) ? 0 : x;
        y = (y == null) ? 0 : y;
        this.width = w;
        this.height = h;

        // Simple emulation of OOP through direct assignment of properties.
        // Full-fledged OOP would require deep copying/cloning of class
        // prototype chains, but for this project, our needs are simple enough
        // where that may be overkill.
        this.containsPoint = function(x, y) {
            return (x >= this.x && x < (this.x + this.width)) &&
                   (y >= this.y && y < (this.y + this.height));
        };

        this.getCanvasColorAtPoint = function(x, y) {
            var imgData = this.ctx.getImageData(x, y, 1, 1),
                rgbData = imgData.data,
                rgb = [rgbData[0], rgbData[1], rgbData[2]],
                hsl = rgbToHsl.apply(this, rgb);

            return {
                rgb: rgb,
                hsl: hsl
            };
        };

        this.drawArea = function(startX, startY, width, height) {
            var self = this;

            var sx = isNaN(startX) ? 0 : startX,
                sy = isNaN(startY) ? 0 : startY,
                w  = isNaN(width)  ? this.width : width,
                h  = isNaN(height) ? this.height : height;

            // Defining variables here to make the effect of hoisting clearer. 
            var imgData = this.ctx.getImageData(sx, sy, w, h);
            var rgbData = imgData.data;

            var x, y, rgb;
            
            // `i` is the index counter for rgbData
            var i;

            for (x = sx; x < (sx + w); x++) {
                for (y = sy; y < (sy + h); y++) {
                    // Convert x-y coords to index number
                    i = ((y - sy)* w + (x - sx)) * 4;

                    // Don't think this should happen...
                    if (i < 0 || i > (rgbData.length - 4)) {
                        continue;
                    }

                    if (this.containsPoint(x, y) !== true) {
                        // Make this pixel transparent
                        rgbData[i + 3] = 0; 
                    } else {
                        rgb = this.rgbAtPoint(x, y);

                        rgbData[i]   = rgb[0];
                        rgbData[i+1] = rgb[1];
                        rgbData[i+2] = rgb[2];
                        rgbData[i+3] = 255;
                    }
                }
            }

            this.ctx.putImageData(imgData, sx, sy);
        };

        this.setPosition = function(x, y) {
            // Weird things happen at non-integer coords
            this.x = Math.round(x);
            this.y = Math.round(y);
            this.centerX = this.x + Math.round(this.width / 2);
            this.centerY = this.y + Math.round(this.height / 2);
        };

        this.setPosition(x, y);
    };

    /*
     * HuePicker
     */
    function HuePicker() {
        Sprite.apply(this, arguments);

        this.outerRadius = this.width / 2;
        this.innerRadius = this.outerRadius - this.width / 10;

        // A small optimization where we can just calculate these values here
        // as opposed to every iteration in the loop.
        this.outerR2 = Math.pow(this.outerRadius, 2);
        this.innerR2 = Math.pow(this.innerRadius, 2);

        var p = this.innerRadius + (this.outerRadius - this.innerRadius)/2;
        this.marker = new Marker(this.ctx, this.centerX + p, this.centerY);

        // Overriding of parent class properties has to be done in constructor due 
        // to the way inheritance is handled now (not using prototype).
        this.containsPoint = function(x, y) {
            var r2 = Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2);

            return r2 >= this.innerR2 && r2 <= this.outerR2;
        };
    };

    HuePicker.HUE_PICKED = "huePicked";

    HuePicker.prototype.draw = function() {
        this.drawArea(this.x, this.y, this.width, this.height);
        this.marker.draw();
    };

    HuePicker.prototype.rgbAtPoint = function(x, y) {
        var hue = Math.atan2(y - this.centerY, x - this.centerX) * 180/Math.PI;

        hue = hue.toFixed(2);

        return hslToRgb(hue, 100, 50);
    };

    HuePicker.prototype.updateMarker = function(x, y) {
        // Redraw area of marker's old position.
        // The marker's x-y coords denote the center, not the top-left position.
        // We need to calculate it then.
        // Also, add a bit of extra "padding" pixels to include the bits from arc's
        // anti-aliasing.
        var padding = 4,
            markerPos = this.marker.getTopLeft(),
            markerLeft = markerPos.left - padding,
            markerTop = markerPos.top - padding;

        this.drawArea(markerLeft, markerTop,
                      this.marker.width + 2*padding, 
                      this.marker.height + 2*padding);

        // Update marker to new position and redraw.
        this.marker.setPosition(x, y);
        this.marker.draw();
    };

    HuePicker.prototype.pickPoint = function(x, y, skipEvent) {
        x = Math.round(x);
        y = Math.round(y);

        this.updateMarker(x, y);

        if (skipEvent !== true) {
            var data = {
                'detail': this.getCanvasColorAtPoint(x, y)
            };

            var ev = new CustomEvent(HuePicker.HUE_PICKED, data);

            this.ctx.canvas.dispatchEvent(ev);
        }
    };

    HuePicker.prototype.setRGB = function(r, g, b) {
        var hsl = rgbToHsl(r, g, b);

        this.setHSL.apply(this, hsl);
   };

    HuePicker.prototype.setHSL = function(h, s, l) {
        var rads = h * Math.PI / 180,
            // Position marker at the center of the picker's band.
            r = this.innerRadius + (this.outerRadius - this.innerRadius)/2,
            x = r * Math.cos(rads) + this.centerX, 
            y = r * Math.sin(rads) + this.centerY;

        this.pickPoint(x, y, true);
    };

    /*
     * ColorSquare
     */
    function ColorSquare() {
        Sprite.apply(this, arguments);

        this.hue = 0;

        this.marker = new Marker(this.ctx, 
            this.x + this.width / 2, this.y + this.height / 2);

        this.updateMarker = HuePicker.prototype.updateMarker;
    };

    ColorSquare.SQUARE_PICKED = "squarePicked";

    ColorSquare.prototype.draw = function(hue, skipEvent) {
        this.hue = hue == null ? this.hue : hue;
        this.drawArea(this.x, this.y, this.width, this.height);
        this.marker.draw();

        if (skipEvent !== true) {
            this.pickMarkerColor();
        }
    };
    ColorSquare.prototype.rgbAtPoint = function(x, y) {
        var sat = ((x - this.x) / this.width) * 100;
        var light = 100 - ((y - this.y) / this.height) * 100;

        return hslToRgb(this.hue, sat, light);
    };

    ColorSquare.prototype.pickPoint = function(x, y, skipEvent) {
        x = Math.round(x);
        y = Math.round(y);

        this.updateMarker(x, y);

        if (skipEvent !== true) {
            this.pickMarkerColor();
        }
    };

    ColorSquare.prototype.pickMarkerColor = function() {
        var color = this.getCanvasColorAtPoint(this.marker.x, this.marker.y);
        var data = {
                'detail': color
            };

        var ev = new CustomEvent(ColorSquare.SQUARE_PICKED, data);

        this.ctx.canvas.dispatchEvent(ev);
    };

    ColorSquare.prototype.setRGB = function(r, g, b) {
        var hsl = rgbToHsl(r, g, b);

        this.setHSL.apply(this, hsl);
    };

    ColorSquare.prototype.setHSL = function(h, s, l) {
        var x = (s / 100) * this.width + this.x;
        var y = ((100 - l) / 100) * this.height + this.y;

        this.draw(h, true);
        this.pickPoint(x, y);
    };

    /*
     * Marker
     */
    function Marker() {
        var args = Array.prototype.slice.call(arguments);

        // Set default width, height
        var side = 10;

        args[3] = args[3] == null ? side : args[3];
        args[4] = args[4] == null ? side : args[4];

        Sprite.apply(this, args);

        this.lineWidth = 1;
    };

    Marker.prototype.draw = function() {
        // The x-y coords were set to the center of the marker.
        var r = this.width / 2;

        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, r, 0, 2*Math.PI);
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, r + 1, 0, 2*Math.PI);
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.stroke();

    };

    Marker.prototype.getTopLeft = function() {
        return {
            left: this.x - this.width / 2,
            top:  this.y - this.height / 2
        };
    };

    /*
     * Helpers
     */
    function rgbToHsl(r, g, b){
        r /= 255, g /= 255, b /= 255;

        var max = Math.max(r, g, b), 
            min = Math.min(r, g, b),
            h, s, 
            l = (max + min) / 2;

        if (max == min) {
            h = s = 0; 
        } else {
            var d = max - min;

            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            if (max == r) {
                h = (g - b) / d + (g < b ? 6 : 0); 
            } else if (max == g) {
                h = (b - r) / d + 2; 
            } else if (max == b) {
                h = (r - g) / d + 4; 
            }

            h /= 6;
        }

        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    function hslToRgb(h, s, l) {
        var r, g, b;
        var p, q;

        h /= 360;
        s /= 100;
        l /= 100;

        function hue2rgb(hp, hq, ht){
            if (ht < 0) {
                ht += 1;
            }
            if (ht > 1) {
                ht -= 1;
            }
            if (ht < 1/6) {
                return hp + (hq - hp) * 6 * ht;
            }
            if (ht < 1/2) { 
                return hq;
            }
            if (ht < 2/3) {
                return hp + (hq - hp) * (2/3 - ht) * 6;
            }
            return hp;
        }

        if (s == 0) {
            r = g = b = l; 
        } else {
            q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

})();
