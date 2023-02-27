attribute vec4 color;
attribute vec2 size;
attribute float angle;
attribute float index;

varying vec4 vColor;
varying vec2 vPos;
varying vec2 vSize;
varying float vAngle;
varying float vIndex;
varying float vTime;

uniform float u_time;
uniform float u_scrollscale;
uniform float u_winscale;
uniform vec2 u_resolution;

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

void main() {
    //vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    float pscale = max(size.x, size.y)*4. + 0.*5.*sin(u_time/60.*5. + .074414313*index);
    gl_PointSize = pscale * u_scrollscale * u_winscale * .5 * ((1.-.3) + 0.*2.*.3*random(mvPosition.xy+mod(u_time/100., 1.0)));
    //gl_PointSize = pscale * u_scrollscale * u_winscale * .5;
    gl_Position = projectionMatrix * mvPosition;

    // drawing animation
    //if(index/2250. > u_time)
    //    gl_PointSize = 0.;


    vColor = color;

    //vColor.r *= .5 + (1.-.5)*2.*random(mvPosition.xy+mod(u_time/100.+.366, 1.0));
    //vColor.g *= .5 + (1.-.5)*2.*random(mvPosition.xy+mod(u_time/100.+.253, 1.0));
    //vColor.b *= .5 + (1.-.5)*2.*random(mvPosition.xy+mod(u_time/100.+.112, 1.0));

    vPos = 1.-(mvPosition.xy*.5+.5)/u_resolution.xy;
    vSize = size;
    vAngle = angle + 0.*u_time/20.;
    vIndex = index;
    vTime = u_time;
}