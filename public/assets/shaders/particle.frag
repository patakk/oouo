
varying vec4 vColor;
varying vec2 vPos;
varying vec2 vSize;
varying float vAngle;
varying float vIndex;
varying float vTime;


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


void main() {
    vec2 xyclip = 2.*(gl_PointCoord.xy - .5);
    vec2 xyrot;
    vec2 uv = gl_PointCoord.xy;
    xyrot.x = xyclip.x * cos(vAngle) - xyclip.y * sin(vAngle);
    xyrot.y = xyclip.x * sin(vAngle) + xyclip.y * cos(vAngle);
    vec2 xyrotc = xyrot;


    float ratio = vSize.x/vSize.y;
    float ms = max(vSize.x, vSize.y);
    float mms = min(vSize.x, vSize.y);

    xyrot.y *= ms/vSize.y;
    xyrot.x *= ms/vSize.x;

    float aaa = smoothstep(.3, .4, fbm3(vec2(vIndex*.003141), vIndex*.003141));
    float f1 = 5.*(-.5 + fbm3(xyrot.xy*vec2(1.,1.)*1.1, vIndex+0.*vPos.x+0.*vPos.y+1.31));
    float f2 = 5.*(-.5 + fbm3(xyrot.xy*vec2(1.,1.)*1.1, vIndex+0.*vPos.x+0.*vPos.y));

    float dist = length(xyrot);
    float alpha = 1. - smoothstep(0.45, 0.5, dist);

    xyrot.x += f1*3.1*xyrotc.y;
    xyrot.y += f2*3.1*xyrotc.y;
    float lwo = .45 - .62*fbm3(uv*vec2(14., 6.), vIndex);
    alpha = smoothstep(-.46, -lwo, xyrot.x) * smoothstep(.46, lwo, xyrot.x) * smoothstep(-.46, -lwo, xyrot.y) * smoothstep(.46, lwo, xyrot.y);


    float fa = fbm3(xyrot.xy*vSize.x*vec2(9., 1.)*.2, 0.*random(vec2(vIndex*2.01, 21.31)))*2.-1.;
    // fa = .5 + .45*sin(xyrot.x*vSize.x*3.);

    // fa = smoothstep(.47, .53, fa);

    float distn = length(xyrot);
    float alphan = 1. - smoothstep(0.45, 0.5, distn);
    //gl_FragColor = vec4( vColor.rgb+fa*.2, alpha*vColor.a*(.75+.25*fa) );
    gl_FragColor = vec4( vColor.rgb+fa*.2, alpha*vColor.a );
    // gl_FragColor = vec4( smoothstep(-.05, .05, sin(xyrot.x*vSize.x*3.)), 0., 0., alpha*vColor.a );
    // gl_FragColor = vec4( 1., 1., 1., alpha );
    //gl_FragColor = vec4( vec3(xyrotc.xy, 0.), 1. );
    //gl_FragColor = vec4( fa, uv.y, 0., fa );
}