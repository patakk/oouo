
class Color{
    constructor(r, g, b, a){
        if(a)
            this.a = a;
        else
            a = 1.;
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

function lerpcol(c1, c2, p){
    return new Color(
        c1.r + p*(c2.r-c1.r),
        c1.g + p*(c2.g-c1.g),
        c1.b + p*(c2.b-c1.b),
        1.
    );
}

function addcol(c1, c2){
    return new Color(c1.r+c2.r, c1.g+c2.g, c1.b+c2.b, 1.);
}

function scalecol(c, sc){
    return new Color(c.r*sc, c.g*sc, c.b*sc, c.a);   
}

function saturatecol([r, g, b], sat){
    var cin = new Color(r, g, b, 1);
    if(Math.abs(sat) < .004)
        return [r, g, b];

    if((cin.r == 0) && (cin.g == 0) && (cin.b == 0))
        return [r, g, b];

    var clerp = new Color(cin.r, cin.g, cin.b, cin.a);

    if(sat > 0.0){
        var mx = max(max(cin.r, cin.g), cin.b);
        var maxsat = scalecol(clerp, 1./mx);
        clerp = lerpcol(clerp, maxsat, sat)
    }
    if(sat < 0.0){
        var avg = (cin.r + cin.g + cin.b) / 3.;
        var gray = new Color(avg, avg, avg, 1.);
        clerp = lerpcol(clerp, gray, -sat);
    }
    return [clerp.r, clerp.g, clerp.b];
}

function map2(ang){
    var r = step2(ang);
    var g = step2(ang-120/360);
    var b = step2(ang-240/360);
    return ryb2rgb(r, g, b);
}

function step2(ang){
    var out = 0.0;
    var sc = 0.0;

    deg = ang*360;

    while (deg<0.0) { deg+=360.0;}
    while (deg>360.0) { deg-=360.0;}

    if (deg<=60.0) {
        out=1.0;
    }
    else if ( (deg>60.0)&&(deg<=120.0) ) {
        sc=(deg-60.0)/60.0;
        out=1.0-2.0*sc/Math.sqrt(1.0+3.0*sc*sc);
    }
    else if ( (deg>120.0) && (deg<=240.0) ) {
        out=0.0;
    }
    else if ( (deg>240.0) && (deg<=300.0) ) {
        sc=(deg-240.0)/60.0;
        out=2.0*sc/Math.sqrt(1.0+3.0*sc*sc);
    }
    else if ( (deg>300.0) && (deg<=360.0) ) {
        out=1.0;
    }

    return out;
}

function ryb2rgb(r, y, b){
    var rin = r;
    var yin = y;
    var bin = b;

    var CG000 = new Color(0.0,0.0,0.0); //Black
    //var CG100 = new Color(1.0,0.0,0.0); //Red
    var CG100 = new Color(.9,0.1,0.0); // MODIFIED RED
    var CG010 = new Color(0.9,0.9,0.0); //Yellow = RGB Red+Green.  Still a bit high, but helps Yellow compete against Green.  Lower gives murky yellows.
    var CG001 = new Color(0.0,0.36,1.0); //Blue: Green boost of 0.36 helps eliminate flatness of spectrum around pure Blue
    //var CG011 = new Color(0.0,0.9,0.2); //Green: A less intense green than {0,1,0}, which tends to dominate
    var CG011 = new Color(0.0,0.8,0.3); // MODIFIED GREEN
    var CG110 = new Color(1.0,0.6,0.0); //Orange = RGB full Red, 60% Green
    var CG101 = new Color(0.6,0.0,1.0); //Purple = 60% Red, full Blue
    var CG111 = new Color(1.0,1.0,1.0); //White

    var C00 = addcol(scalecol(CG000, 1.-rin), scalecol(CG100, rin));
    var C01 = addcol(scalecol(CG001, 1.-rin), scalecol(CG101, rin));
    var C10 = addcol(scalecol(CG010, 1.-rin), scalecol(CG110, rin));
    var C11 = addcol(scalecol(CG011, 1.-rin), scalecol(CG111, rin));

    var C0 = addcol(scalecol(C00, 1.-yin), scalecol(C10, yin));
    var C1 = addcol(scalecol(C01, 1.-yin), scalecol(C11, yin));

    var C = addcol(scalecol(C0, 1.-bin), scalecol(C1, bin));

    return [C.r, C.g, C.b];
}

function rgb2ryb(r, g, b){
    var rin = r;
    var gin = g;
    var bin = b;
    
    var CG000 = new Color(0.0,0.0,0.0); //Black
    var CG100 = new Color(0.891,0.0,0.0); //Red
    var CG010 = new Color(0.0,0.714,0.374); //Green = RYB Yellow + Blue
    var CG001 = new Color(0.07,0.08,0.893); //Blue:
    var CG011 = new Color(0.0,0.116,0.313); //Cyan = RYB Green + Blue.  Very dark to make the rest of the function work correctly
    var CG110 = new Color(0.0,0.915,0.0); //Yellow
    var CG101 = new Color(0.554,0.0,0.1); //Magenta =RYB Red + Blue.  Likewise dark.
    var CG111 = new Color(1.0,1.0,1.0); //White

    var C00 = addcol(scalecol(CG000, 1.-rin), scalecol(CG100, rin));
    var C01 = addcol(scalecol(CG001, 1.-rin), scalecol(CG101, rin));
    var C10 = addcol(scalecol(CG010, 1.-rin), scalecol(CG110, rin));
    var C11 = addcol(scalecol(CG011, 1.-rin), scalecol(CG111, rin));

    var C0 = addcol(scalecol(C00, 1.-gin), scalecol(C10, gin));
    var C1 = addcol(scalecol(C01, 1.-gin), scalecol(C11, gin));

    var C = addcol(scalecol(C0, 1.-bin), scalecol(C1, bin));

    C = saturate([C.r, C.g, C.b], .5);

    return C;
}

function mixcol(c1, c2, blend){
    return new Color(
        Math.sqrt((1.-blend)*(c1.r*c1.r) + blend*(c2.r*c2.r)),
        Math.sqrt((1.-blend)*(c1.g*c1.g) + blend*(c2.g*c2.g)),
        Math.sqrt((1.-blend)*(c1.b*c1.b) + blend*(c2.b*c2.b)),
        (1.0-blend)*c1.a + blend*c2.a,
    );
}

function mixcollin(c1, c2, blend){
    return new Color(
        (1.-blend)*c1.r + blend*c2.r,
        (1.-blend)*c1.r + blend*c2.r,
        (1.-blend)*c1.r + blend*c2.r,
        (1.0-blend)*c1.a + blend*c2.a,
    );
}

function invcol(c){
    return new Color(1-c.r, 1-c.g, 1.-c.g, c.a);
}

function brightencol([r, g, b], br){
    var c = new Color(r, g, b, 1);
    if(br == 0){
        return [r, g, b];
    }

    if(br > 0){
        var rez = mixcol(c, new Color(1,1,1,1), br);
        return [rez.r, rez.g, rez.b];
    }

    if(br < 0){
        var rez = mixcol(c, new Color(0,0,0,1), -br);
        return [rez.r, rez.g, rez.b];
    }
}

function distcolor(c1, c2){
    return Math.sqrt((c1.r-c2.r)*(c1.r-c2.r) + (c1.g-c2.g)*(c1.g-c2.g) + (c1.b-c2.b)*(c1.b-c2.b)) / Math.sqrt(3);
}

function mixsubcol(c1, c2, p){
    var c = invcol(c1);
    var d = invcol(c2);

    var f = new Color(
        max(0, 1. - c.r - d.r),
        max(0, 1. - c.g - d.g),
        max(0, 1. - c.b - d.b),
        1.
    )

    var cd = distcolor(c1, c2);
    cd = 4*p*(1.-p)*cd;

    return mixcollin(mixcollin(c1, c2, p), f, cd);
}