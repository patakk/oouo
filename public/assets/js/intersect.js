
class myVec{
    constructor(x, y, z=0){
        this.x = x;
        this.y = y;
        this.z = z;
    }

    dist(vec){
        return Math.sqrt((this.x-vec.x)*(this.x-vec.x) + (this.y-vec.y)*(this.y-vec.y) + (this.z-vec.z)*(this.z-vec.z))
    }

    angleBetween(vec) {
        const dotmagmag = this.dot(vec) / (this.mag() * vec.mag());
        // Mathematically speaking: the dotmagmag variable will be between -1 and 1
        // inclusive. Practically though it could be slightly outside this range due
        // to floating-point rounding issues. This can make Math.acos return NaN.
        //
        // Solution: we'll clamp the value to the -1,1 range
        let angle;
        angle = Math.acos(Math.min(1, Math.max(-1, dotmagmag)));
        angle = angle * Math.sign(this.cross(vec).z || 1);
        return angle;
    }
    
    cross(v) {
        const x = this.y * v.z - this.z * v.y;
        const y = this.z * v.x - this.x * v.z;
        const z = this.x * v.y - this.y * v.x;
        return new myVec(x, y, z);
    }

    dot(vec) {
        return this.x * (vec.x || 0) + this.y * (vec.y || 0) + this.z * (vec.z || 0);
    }

    mag(){
        return Math.sqrt((this.x)*(this.x) + (this.y)*(this.y) + (this.z)*(this.z))
    }

    div(val){
        return myVec(this.x/val, this.y/val, this.z/val);
    }

    normalize(){
        return this.div(this.mag());
    }
}

function subVec(v1, v2){
    return new myVec(v1.x-v2.x, v1.y-v2.y, v1.z-v2.z);
}

function addVec(v1, v2){
    return new myVec(v1.x+v2.x, v1.y+v2.y, v1.z+v2.z);
}


function issamepoint(p1, p2) {
    return p1.dist(p2) < 0.1;
}

function radians(val){
    return val/180*Math.PI;
}

function findLineIntersection(u, w, v, z) {
    var uw = subVec(w, u);
    var vz = subVec(z, v);
    var uv = subVec(v, u);
    let beta = uw.angleBetween(vz);
    if (beta < radians(0.1))
        return false;
    let alfa = uw.angleBetween(uv);

    var vz_ = subVec(z, v);
    vz_.normalize();
    var mmag = -uv.mag() * sin(alfa) / sin(beta);
    if (mmag < 0 || mmag > vz.mag())
        return false;
    vz_.mult(mmag);
    var res = addVec(v, vz_);
    return res;
}


function onSegment(p, q, r) {
    if (q.x <= max(p.x, r.x) && q.x >= min(p.x, r.x) &&
        q.y <= max(p.y, r.y) && q.y >= min(p.y, r.y))
        return true;

    return false;
}

function triorientation(p, q, r) {
    // See https://www.geeksforgeeks.org/orientation-3-ordered-points/
    // for details of below formula.
    var val = (q.y - p.y) * (r.x - q.x) -
        (q.x - p.x) * (r.y - q.y);

    if (val == 0) return 0;  // collinear

    return (val > 0) ? 1 : 2; // clock or counterclock wise
}

function doLinesIntersect(p1, q1, p2, q2) {
    // Find the four orientations needed for general and
    // special cases
    var o1 = triorientation(p1, q1, p2);
    var o2 = triorientation(p1, q1, q2);
    var o3 = triorientation(p2, q2, p1);
    var o4 = triorientation(p2, q2, q1);

    // General case
    if (o1 != o2 && o3 != o4)
        return true;

    // Special Cases
    // p1, q1 and p2 are collinear and p2 lies on segment p1q1
    if (o1 == 0 && onSegment(p1, p2, q1)) return true;

    // p1, q1 and q2 are collinear and q2 lies on segment p1q1
    if (o2 == 0 && onSegment(p1, q2, q1)) return true;

    // p2, q2 and p1 are collinear and p1 lies on segment p2q2
    if (o3 == 0 && onSegment(p2, p1, q2)) return true;

    // p2, q2 and q1 are collinear and q1 lies on segment p2q2
    if (o4 == 0 && onSegment(p2, q1, q2)) return true;

    return false; // Doesn't fall in any of the above cases
}


function isinside(point, poly) {
    let wn = 0;

    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        let pi = poly[i];
        let pj = poly[j];

        if (pj.y <= point.y) {
            if (pi.y > point.y) {
                if (isLeft(pj, pi, point) > 0) {
                    wn++;
                }
            }
        } else {
            if (pi.y <= point.y) {
                if (isLeft(pj, pi, point) < 0) {
                    wn--;
                }
            }
        }
    }
    return wn != 0;
};

function isLeft(P0, P1, P2) {
    let res = ((P1.x - P0.x) * (P2.y - P0.y)
        - (P2.x - P0.x) * (P1.y - P0.y));
    return res;
}