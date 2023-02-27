
function shuffle(array) {
    let currentIndex = array.length
    var randomIndex;

  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(fxrand() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }


function hex2rgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16)/255.,
      parseInt(result[2], 16)/255.,
      parseInt(result[3], 16)/255.
    ] : null;
}

function hsl2rgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    var ltns = .299*r + .587*g + .114*b;
    r = min(1., max(0., r * l / ltns));
    g = min(1., max(0., g * l / ltns));
    b = min(1., max(0., b * l / ltns));

    return [r, g, b];
}

function hsv2rgb(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [r, g, b];
}

function rgb2hsl(r, g, b){
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

function rgb2hsv(r, g, b) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc;
    rabs = r;
    gabs = g;
    babs = b;
    v = Math.max(rabs, gabs, babs),
    diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v) {
            h = bb - gg;
        } else if (gabs === v) {
            h = (1 / 3) + rr - bb;
        } else if (babs === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return [h, s, v];
}



/**
 * Converts RGB color to CIE 1931 XYZ color space.
 * https://www.image-engineering.de/library/technotes/958-how-to-convert-between-srgb-and-ciexyz
 * @param  {string} hex
 * @return {number[]}
 */
 function rgbToXyz(rgb) {
    const r = rgb[0];
    const g = rgb[1];
    const b = rgb[2];
    const X =  0.4124 * r + 0.3576 * g + 0.1805 * b
    const Y =  0.2126 * r + 0.7152 * g + 0.0722 * b
    const Z =  0.0193 * r + 0.1192 * g + 0.9505 * b
    // For some reason, X, Y and Z are multiplied by 100.
    return [X, Y, Z].map(_ => _ * 100)
}

/**
 * Undoes gamma-correction from an RGB-encoded color.
 * https://en.wikipedia.org/wiki/SRGB#Specification_of_the_transformation
 * https://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color
 * @param  {number}
 * @return {number}
 */
function sRGBtoLinearRGB(color) {
    // Send this function a decimal sRGB gamma encoded color value
    // between 0.0 and 1.0, and it returns a linearized value.
    if (color <= 0.04045) {
        return color / 12.92
    } else {
        return Math.pow((color + 0.055) / 1.055, 2.4)
    }
}

/**
 * Converts hex color to RGB.
 * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 * @param  {string} hex
 * @return {number[]} [rgb]
 */
function hexToRgb(hex) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (match) {
        match.shift()
        return match.map(_ => parseInt(_, 16))
    }
}

/**
 * Converts CIE 1931 XYZ colors to CIE L*a*b*.
 * The conversion formula comes from <http://www.easyrgb.com/en/math.php>.
 * https://github.com/cangoektas/xyz-to-lab/blob/master/src/index.js
 * @param   {number[]} color The CIE 1931 XYZ color to convert which refers to
 *                           the D65/2° standard illuminant.
 * @returns {number[]}       The color in the CIE L*a*b* color space.
 */
// X, Y, Z of a "D65" light source.
// "D65" is a standard 6500K Daylight light source.
// https://en.wikipedia.org/wiki/Illuminant_D65
const D65 = [95.047, 100, 108.883]
function xyzToLab([x, y, z]) {
  [x, y, z] = [x, y, z].map((v, i) => {
    v = v / D65[i]
    return v > 0.008856 ? Math.pow(v, 1 / 3) : v * 7.787 + 16 / 116
  })
  const l = 116 * y - 16
  const a = 500 * (x - y)
  const b = 200 * (y - z)
  return [l, a, b]
}

/**
 * Converts Lab color space to Luminance-Chroma-Hue color space.
 * http://www.brucelindbloom.com/index.html?Eqn_Lab_to_LCH.html
 * @param  {number[]}
 * @return {number[]}
 */
function labToLch([l, a, b]) {
    const c = Math.sqrt(a * a + b * b)
    const h = abToHue(a, b)
    return [l, c, h]
}

/**
 * Converts a and b of Lab color space to Hue of LCH color space.
 * https://stackoverflow.com/questions/53733379/conversion-of-cielab-to-cielchab-not-yielding-correct-result
 * @param  {number} a
 * @param  {number} b
 * @return {number}
 */
function abToHue(a, b) {
    if (a >= 0 && b === 0) {
        return 0
    }
    if (a < 0 && b === 0) {
        return 180
    }
    if (a === 0 && b > 0) {
        return 90
    }
    if (a === 0 && b < 0) {
        return 270
    }
    let xBias
    if (a > 0 && b > 0) {
        xBias = 0
    } else if (a < 0) {
        xBias = 180
    } else if (a > 0 && b < 0) {
        xBias = 360
    }
    return radiansToDegrees(Math.atan(b / a)) + xBias
}

function radiansToDegrees(radians) {
    return radians * (180 / Math.PI)
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180
}

/**
 * Saturated colors appear brighter to human eye.
 * That's called Helmholtz-Kohlrausch effect.
 * Fairchild and Pirrotta came up with a formula to
 * calculate a correction for that effect.
 * "Color Quality of Semiconductor and Conventional Light Sources":
 * https://books.google.ru/books?id=ptDJDQAAQBAJ&pg=PA45&lpg=PA45&dq=fairchild+pirrotta+correction&source=bl&ots=7gXR2MGJs7&sig=ACfU3U3uIHo0ZUdZB_Cz9F9NldKzBix0oQ&hl=ru&sa=X&ved=2ahUKEwi47LGivOvmAhUHEpoKHU_ICkIQ6AEwAXoECAkQAQ#v=onepage&q=fairchild%20pirrotta%20correction&f=false
 * @return {number}
 */
function getLightnessUsingFairchildPirrottaCorrection([l, c, h]) {
    const l_ = 2.5 - 0.025 * l
    const g = 0.116 * Math.abs(Math.sin(degreesToRadians((h - 90) / 2))) + 0.085
    return l + l_ * g * c
}

function getPerceivedLightness(rgb) {
    return getLightnessUsingFairchildPirrottaCorrection(labToLch(xyzToLab(rgbToXyz(rgb))))
}