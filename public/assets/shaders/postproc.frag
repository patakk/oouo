#include <common>

uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float seed1;
uniform float seed2;
uniform float seed3;

varying vec2 vUv;

//uniform float sigma;     // The sigma value for the gaussian function: higher value means more blur
                        // A good value for 9x9 is around 3 to 5
                        // A good value for 7x7 is around 2.5 to 4
                        // A good value for 5x5 is around 2 to 3.5
                        // ... play around with this based on what you need :)

//uniform float blurSize;  // This should usually be equal to
                        // 1.0f / texture_pixel_width for a horizontal blur, and
                        // 1.0f / texture_pixel_height for a vertical blur.

const float pi = 3.14159265f;

const float numBlurPixelsPerSide = 4.0f;


float randomNoise(vec2 p) {
  return fract(16791.414*sin(7.*p.x+p.y*73.41));
}

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float noise (in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float noise3 (in vec2 _st, in float t) {
    vec2 i = floor(_st+t);
    vec2 f = fract(_st+t);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 5

float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float fbm3 ( in vec2 _st, in float t) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise3(_st, t);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}


float fff(vec2 st, float seed){

    vec2 q = vec2(0.);
    q.x = fbm3( st + 0.1, seed*.11);
    q.y = fbm3( st + vec2(1.0), seed*.11);
    vec2 r = vec2(0.);
    r.x = fbm3( st + 1.0*q + vec2(1.7,9.2)+ 0.15*seed*0.11, seed*.11);
    r.y = fbm3( st + 1.0*q + vec2(8.3,2.8)+ 0.126*seed*0.11, seed*.11);
    float f = fbm3(st+r, seed*.11);
    float ff = (f*f*f+0.120*f*f+.5*f);

    return ff;
}

vec4 blur(vec2 coor, float blurSize, vec2 direction){
    float sigma = 3.0;
    // Incremental Gaussian Coefficent Calculation (See GPU Gems 3 pp. 877 - 889)
    vec3 incrementalGaussian;
    incrementalGaussian.x = 1.0f / (sqrt(2.0f * pi) * sigma);
    incrementalGaussian.y = exp(-0.5f / (sigma * sigma));
    incrementalGaussian.z = incrementalGaussian.y * incrementalGaussian.y;
    
    vec4 avgValue = vec4(0.0f, 0.0f, 0.0f, 0.0f);
    float coefficientSum = 0.0f;
    
    // Take the central sample first...
    avgValue += texture2D(tDiffuse, coor.xy) * incrementalGaussian.x;
    coefficientSum += incrementalGaussian.x;
    incrementalGaussian.xy *= incrementalGaussian.yz;
    
    // Go through the remaining 8 vertical samples (4 on each side of the center)
    for (float i = 1.0f; i <= numBlurPixelsPerSide; i++) { 
        avgValue += texture2D(tDiffuse, coor.xy - i * blurSize * 
                            direction) * incrementalGaussian.x;         
        avgValue += texture2D(tDiffuse, coor.xy + i * blurSize * 
                            direction) * incrementalGaussian.x;         
        coefficientSum += 2. * incrementalGaussian.x;
        incrementalGaussian.xy *= incrementalGaussian.yz;
    }
    
    return avgValue / coefficientSum;
}

void main() {

    vec2 xy = gl_FragCoord.xy;
    vec2 uv = xy / resolution;
    
    float qq = pow(2.*abs(uv.x-.5), 2.)*.84;

    qq = pow(length((uv - .5)*vec2(.72,1.))/length(vec2(.5)), 2.) * .94;

    vec2 dir = uv - .5;
    dir = vec2(dir.y, -dir.x);
    dir = dir / length(dir);

    vec4 texelB = blur(uv, qq*.3*1./resolution.x, dir);
    vec4 texel = texture2D( tDiffuse, vUv );
    vec4 texelx = texture2D( tDiffuse,  vUv + vec2(+1.0, +0.0) / 1000. );
    vec4 texely = texture2D( tDiffuse,  vUv + vec2(+0.0, +1.0) / 1000. );

    vec3 diffx = texelx.rgb - texel.rgb;
    vec3 diffy = texely.rgb - texel.rgb;

    float dx = (diffx.r+diffx.g+diffx.b)/3.;
    float dy = (diffy.r+diffy.g+diffy.b)/3.;

    vec3 source = vec3(-3., 1., .3);
    source = source/length(source);
    vec3 de = vec3(uv.x, uv.y, 0.0) - source;
    float dedis = 1./length(de);
    float ddot = dot(vec3(dx, dy, 0.), source)*2.;

    vec3 diff = abs(diffx) + abs(diffy);
    float ddiff = (diff.r+diff.g+diff.b)/3.;

    //float lum = texelB.r * 0.3 + texelB.g * 0.59 + texelB.b * 0.11;
    //lum = pow(lum, 0.15);
    //vec4 texelGray = vec4(vec3( lum ), 1.0);
    //texelGray = texelGray*0.5 + texelB*0.5;

    //vec4 texel = texture2D( tDiffuse, (xy+vec2(+0.0, +0.0)) / resolution );
    //vec4 texel0 = texture2D( tDiffuse, vec2(.5) );

    //vec4 res = texelB*(1.-qq) + texelGray*qq + .0*(-.5+rand(xy*.1));
    // texelB.r = pow(texelB.r, seed1);
    //texelB.g = pow(texelB.g, seed2);
    //texelB.b = pow(texelB.b, seed3);
    //float pp = (texelB.x+texelB.y+texelB.z)/3.;
    //texelB.x = texel.x + .2*(pp-texel.x);
    //texelB.y = texel.y + .2*(pp-texel.y);
    //texelB.z = texel.z + .2*(pp-texel.z);

    float rat = resolution.x/resolution.y;

    float avcx = fbm3(vUv.xy*vec2(rat, 1.)*222., 13.41);
    float avcy = fbm3(vUv.xy*vec2(rat, 1.)*222., 22.55);
    float avc = noise(vec2(avcx, avcy)*13.);

    vec4 res = texel + .08*(-.5+rand(uv*11.1)) * avc;
    res = res + smoothstep(.88, .999, pow(rand(uv*13.1), 3.))*.2*avc;
    res = res + avc*.02;
    res.rgb += ddiff*vec3(1.,.5,.5)*1.15;
    // res.rgb = res.rgb +.08;
    
    ////// MARGIN
    float margx = 7./1000. + 1.5/1800.*(-.5 + smoothstep(0., 1., fff(vUv*382.1 + 281.3131,seed1+25.61 )));
    float margy = 7./1000. + 1.5/1800.*(-.5 + smoothstep(0., 1., fff(vUv*382.1/rat + 114.5255,seed1+35.12 )));
    if(rat > 1.){
        margy *= rat;
    }
    else if(rat < 1.){
        margx /= rat;
    }
    float margin = 1.0;
    float dd = 2. / 1800.;
    float smmth = 0.00;
    vec3 borderColor = vec3(0.,0.,0.);
    margin *= smmth + (1.-smmth)*smoothstep(margx-dd, margx+dd, vUv.x);
    margin *= smmth + (1.-smmth)*smoothstep(margy-dd, margy+dd, vUv.y);
    margin *= smmth + (1.-smmth)*smoothstep((1.-margx)+dd, (1.-margx)-dd, vUv.x);
    margin *= smmth + (1.-smmth)*smoothstep((1.-margy)+dd, (1.-margy)-dd, vUv.y);
    res.rgb = res.rgb*margin + borderColor*(1.-margin);
    //////

    gl_FragColor = vec4( ddot,ddot,ddot, 1.0 );
    gl_FragColor = vec4( ddiff,ddiff,ddiff, 1.0 );
    gl_FragColor = vec4( res.rgb, 1.0 );

    // gl_FragColor = vec4( avc, avc, avc, 1.0 );
    //gl_FragColor = vec4( texel.rgb, 1.0 );

}