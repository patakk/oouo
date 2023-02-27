import * as THREE from 'three';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

let PostProcShader;
let PoissonDiskSampling = require('poisson-disk-sampling');


const artcolors = require("./artcolors");
let map2 = artcolors.map2;
let mixcol = artcolors.mixcol;
let mixcollin = artcolors.mixcollin;
let mixsubcol = artcolors.mixsubcol;
let brightencol = artcolors.brightencol;
let saturatecol = artcolors.saturatecol;

function rybcolor(p){
    p = (p+10)%1.0;
    return map2(p);
}

let camera, scene;
let screenCamera, screenScene;
let renderer, composer;
let renderTarget;
var vShader, fShader;
let particleFragShader, particleVertShader;
let postprocFragShader, postprocVertShader;
var loaded = false;
let postprocMaterial;
var points;
var resx = 1000*1;
var resy = 1414*1;
var baseWidth = 1;
var baseHeight = 1;
var canvasWidth = 1;
var canvasHeight = 1;
var winScale = 1.;
var pg;
var canvas;
var paletteCanvas;

var seed = fxrand()*10000;

function fxrandom(a, b){
    return a + (b - a)*fxrand();
}
var wind = 0.0;
var scrollscale = 1.3;
var globalIndex = 0;
var frameCount = 0;
var particlePositions = [];
var particleColors = [];
var particleSizes = [];
var particleAngles = [];
var particleIndices = [];

var horizon = fxrandom(0.7, 0.93);

var treeGroundSpread;

var sunPos;
var sunColor;
var sunSpread;
var isDark;
var hasSun;

var backgroundColor;
var backgroundHue;

function isMobile() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };

function power(p, g) {
    if (p < 0.5)
        return 0.5 * Math.pow(2*p, g);
    else
        return 1 - 0.5 * Math.pow(2*(1 - p), g);
}

function animate() {
    if(renderer){
        points.material.uniforms.u_time.value = frameCount++;
        composer.render();
    }
    requestAnimationFrame(animate);
}

function map(x, v1, v2, v3, v4){
    return (x-v1)/(v2-v1)*(v4-v3)+v3;
}

function max(x, y){
    if(x >= y)
        return x;
    return y;
}

function min(x, y){
    if(x <= y)
        return x;
    return y;
}

function constrain(x, a, b){
    return max(a, min(x, b));
}

function radians(angle){
    return angle/360.*2*3.14159;
}


let palettesstrings = [
    'f3db53-f19ba6-a08a7f-d50a15-3c71ec-f3dd56-d40b16-3c6cf0-f19ba6-a08a7f', 
     'f46036-5b85aa-414770-372248-f55d3e-878e88-f7cb15-76bed0-9cfffa-acf39d-b0c592-a97c73-af3e4d',
     '121212-F05454-30475E-F5F5F5-F39189-BB8082-6E7582-046582',
     '084c61-db504a-e3b505-4f6d7a-56a3a6-177e89-084c61-db3a34-ffc857-323031',
     '32373b-4a5859-f4d6cc-f4b860-c83e4d-de6b48-e5b181-f4b9b2-daedbd-7dbbc3',
     'fa8334-fffd77-ffe882-388697-54405f-ffbc42-df1129-bf2d16-218380-73d2de',
     '3e5641-a24936-d36135-282b28-83bca9-ed6a5a-f4f1bb-9bc1bc-e6ebe0-36c9c6',
     'dc3000-83250b-45070a-59565d-fa6302',
     '33658a-86bbd8-758e4f-f6ae2d-f26419',
      'fe5d26-f2c078-faedca-c1dbb3-7ebc89-3d5a80-98c1d9-e0fbfc-ee6c4d-293241',
      'f3db53-f19ba6-a08a7f-d50a15-3c71ec-f3dd56-d40b16-3c6cf0-f19ba6-a08a7f', 
      'f46036-5b85aa-414770-372248-f55d3e-878e88-f7cb15-76bed0-9cfffa-acf39d-b0c592-a97c73-af3e4d',
     '084c61-db504a-e3b505-4f6d7a-56a3a6-177e89-084c61-db3a34-ffc857-323031',
 ];
 palettesstrings = [
    'f3db53-f19ba6-a08a7f-d50a15-3c71ec-f3dd56-d40b16-3c6cf0-f19ba6-a08a7f', 
    'f46036-5b85aa-414770-372248-f55d3e-878e88-f7cb15-76bed0-9cfffa-acf39d-b0c592-a97c73-af3e4d',
    '121212-F05454-30475E-F5F5F5-F39189-BB8082-6E7582-046582',
    '084c61-db504a-e3b505-4f6d7a-56a3a6-177e89-084c61-db3a34-ffc857-323031',
    '32373b-4a5859-f4d6cc-f4b860-c83e4d-de6b48-e5b181-f4b9b2-daedbd-7dbbc3',
    'fa8334-fffd77-ffe882-388697-54405f-ffbc42-df1129-bf2d16-218380-73d2de',
    '3e5641-a24936-d36135-282b28-83bca9-ed6a5a-f4f1bb-9bc1bc-e6ebe0-36c9c6',
    '304d7d-db995a-bbbbbb-222222-fdc300-664c43-873d48-dc758f-e3d3e4-00ffcd',
    '5fad56-f2c14e-f78154-4d9078-b4431c-8789c0-45f0df-c2cae8-8380b6-111d4a',
    '4C3A51-774360-B25068-FACB79-dddddd-2FC4B2-12947F-E71414-F17808-Ff4828',
    '087e8b-ff5a5f-3c3c3c-f5f5f5-c1839f-1B2430-51557E-816797-D6D5A8-ff2222',
    '4C3F61-B958A5-9145B6-FF5677-65799B-C98B70-EB5353-394359-F9D923-36AE7C-368E7C-187498',
    '99e2b4-99d4e2-f94144-f3722c-f8961e-f9844a-f9c74f-90be6d-43aa8b-4d908e-577590-277da1',
    '080708-3772ff-df2935-fdca40-e6e8e6-d8dbe2-a9bcd0-58a4b0-373f51-1b1b1e',
    '001219-005f73-0a9396-94d2bd-e9d8a6-ee9b00-ca6702-bb3e03-ae2012-9b2226',
    '5f0f40-9a031e-fb8b24-e36414-0f4c5c',
    '264653-2a9d8f-e9c46a-f4a261-e76f51',
    'd8f3dc-b7e4c7-95d5b2-74c69d-52b788-40916c-2d6a4f-1b4332-081c15',
    '03071e-370617-6a040f-9d0208-d00000-dc2f02-e85d04-f48c06-faa307-ffba08',
    '1a1423-372549-774c60-b75d69-eacdc2',
    '383b36-26408f-00b0fa-297d45-bf1f2e',
    'f75c03-820263-291720-f75c03-820263-291720-f75c03-820263-291720-04a777',
    '1655c9-f505a5-e3980e-e6b967-93a8cf-d6cdc7-6f8695-1c448e',
    '0a0a0a-1f1f1f-220001-47030a-6b020a-7e030e-89010c-00858f-f7f4f3-dad6d6',
    '054a91-3e7cb1-81a4cd-dbe4ee-f17300',
    '000000-2f4550-586f7c-b8dbd9-f4f4f9',
    '8b85c1-59a96a-ef3054-5c5552-42cafd',
    '090427-cfcdd6-c91b18-788a91-373f43',
    'dc3000-83250b-45070a-59565d-fa6302',
    '283d3b-197278-edddd4-c44536-772e25-0d3b66-faf0ca-f4d35e-ee964b-f95738',
    'fe5d26-f2c078-faedca-c1dbb3-7ebc89-3d5a80-98c1d9-e0fbfc-ee6c4d-293241',
    'c0caad-9da9a0-654c4f-b26e63-cec075-084c61-db504a-e3b505-f4c7a4-e8e1ef-d9fff8-6' +
    '64c43-873d48-dc758f-e3d3e4-00ffcd-c7ffda-c4f4c7-9bb291-3e5641-a24936-d36135-28' +
    '2b28-83bca9-4f6d7a-56a3a6-32373b-4a5859-f4d6cc-f4b860-c83e4d-ba1200-031927-9dd' +
    '1f1-508aa8-c8e0f4-b84527-d2a467-e2af51-714c04-1f3c36-88beb6-4e2649-39160e-9527' +
    '09-975341-ffbc42-df1129-bf2d16-218380-73d2de'
];

var palettes = [];
palettesstrings.forEach(element => {
   palettes.push(element);
});

function hexToRgb(hex) {
   var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
   return result
       ? [
           parseInt(result[1], 16) / 255.,
           parseInt(result[2], 16) / 255.,
           parseInt(result[3], 16) / 255.
       ]
       : null;
}

function shuffle(array) {
    let currentIndex = array.length
    var randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(fxrand() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [
            array[currentIndex], array[randomIndex]
        ] = [
            array[randomIndex], array[currentIndex]
        ];
    }

    return array;
}

for (var k = 0; k < palettes.length; k++) {
    let text = palettes[k];
    let cols = text.split('-')
    let caca = [];
    cols.forEach((e) => {
        caca.push(hexToRgb(e))
    });
    shuffle(caca)
    var coco = [];
    caca.forEach((e, i) => {
        coco.push([
            (caca[i][0] + .1* map(fxrand(), 0, 1, -.2, .2)),
            (caca[i][1] + .1* map(fxrand(), 0, 1, -.2, .2)),
            (caca[i][2] + .1* map(fxrand(), 0, 1, -.2, .2))
        ])
    });
    palettes[k] = coco;
}

console.log(palettes)

function init(){
    noiseSeed(fxrandom(0, 100000));
    globalIndex = 0;
    scrollscale = 1.3;
    frameCount = 0;
    seed = fxrand()*10000;
    
    
    let ww = window.innerWidth || canvas.clientWidth || body.clientWidth;
    let wh = window.innerHeight|| canvas.clientHeight|| body.clientHeight;
    let mm = min(ww, wh);
    canvasWidth = mm*resx/resy-22*mm/resx;
    canvasHeight = mm-22*mm/resy;

    let ratio = resx/resy
    winScale = resx / canvasWidth;

    baseWidth = 1000;
    baseHeight = 1000/ratio;
    camera = new THREE.OrthographicCamera(-baseWidth/2*1, baseWidth/2*1, baseHeight/2*1, -baseHeight/2*1, 1, 100);
    screenCamera = new THREE.OrthographicCamera(-canvasWidth/2, canvasWidth/2, canvasHeight/2, -canvasHeight/2, 1, 100);
    camera.position.z = 10;
    screenCamera.position.z = 10;

    scene = new THREE.Scene();
    screenScene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({alpha: true});
    //renderer.setPixelRatio( 1.0 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( canvasWidth, canvasHeight );
    renderTarget = new THREE.WebGLRenderTarget(resx, resy);

    renderer.domElement.id = "cnvs"
    renderer.domElement.style.borderWidth = "0px";
    document.body.appendChild( renderer.domElement );
    repositionCanvas(renderer.domElement);
}


function reset(){

    var rx = fxrand()*256;
    var ry = fxrand()*256;
    var pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
    //backgroundColor = [pixelData[0]/255., pixelData[1]/255., pixelData[2]/255.];
    backgroundHue = fxrand()+.7
    backgroundColor = brightencol(saturatecol(rybcolor(backgroundHue), rand(-1,1)-.9), rand(-1,1)+.2);
    backgroundColor = brightencol(backgroundColor, -.37);
    let rrb = rand(.6, .7);
    backgroundColor = [rrb*1.021,rrb*1.021,rrb];
    backgroundColor = brightencol(saturatecol(rybcolor(0), -.2), -.9);

    particlePositions = [];
    particleColors = [];
    particleSizes = [];
    particleAngles = [];
    particleIndices = [];

     //generateOONew(fxrand()*0);
     //generateOO(fxrand()*0);
     //generateOO(fxrand()*0);
     generateOOld(fxrand()*0);
     generateOOld(fxrand()*0);
     generateOOld(fxrand()*0);
 // array of sample points, themselves represented as simple arrays

    //generatePlant();

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( particlePositions, 3 ) );
    pointsGeo.setAttribute( 'color', new THREE.Float32BufferAttribute( particleColors, 4 ) );
    pointsGeo.setAttribute( 'size', new THREE.Float32BufferAttribute( particleSizes, 2 ) );
    pointsGeo.setAttribute( 'angle', new THREE.Float32BufferAttribute( particleAngles, 1 ) );
    pointsGeo.setAttribute( 'index', new THREE.Float32BufferAttribute( particleIndices, 1 ) );

    let pointsMaterial = new THREE.ShaderMaterial( {
        uniforms: {
            u_time: { value: frameCount },
            u_scrollscale: { value: scrollscale },
            u_winscale: { value: 4. },
            u_resolution: {value: [baseWidth, baseHeight]}
        },
        vertexShader: particleVertShader,
        fragmentShader: particleFragShader,
        transparent:  true,
        depthTest: false,
      });

    points = new THREE.Points( pointsGeo, pointsMaterial );
    scene.add( points );
    const sphereGeo = new THREE.SphereGeometry( 100,100,100);
    const sphereMat = new THREE.MeshBasicMaterial( { color: 0xff1111 } );
    const sphere = new THREE.Mesh( sphereGeo, sphereMat );
    sphere.rotation.x = fxrand();
    sphere.rotation.y = fxrand();
    sphere.rotation.z = fxrand();
    // scene.add( sphere );

    scene.background = new THREE.Color( backgroundColor[0], backgroundColor[1], backgroundColor[2]);

    points.material.uniforms.u_time.value = 0;
    points.material.uniforms.u_scrollscale.value = scrollscale;
    points.material.uniforms.u_winscale.value = 1;

    screenScene.background = new THREE.Color(1,0,0);
    postprocMaterial = new THREE.ShaderMaterial({ 
        uniforms: {
            'tDiffuse': {
                value: renderTarget.texture
            },
            'resolution': {
                value: [resx, resy]
            },
            'seed1': {
                value: fxrandom(.9, 1.1)
            },
            'seed2': {
                value: fxrandom(.5, 1.5)
            },
            'seed3': {
                value: fxrandom(.5, 1.5)
            },
        },
        vertexShader: postprocVertShader,
        fragmentShader: postprocFragShader,
    });
    let screenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(canvasWidth-0, canvasHeight-0),
        // new THREE.MeshBasicMaterial({map: renderTarget.texture}),
        postprocMaterial
    );
    screenScene.add(screenMesh);

    // Render the scene to the render target
    // renderer.setRenderTarget(renderTarget);
    // renderer.render(scene, camera);
    // renderer.setRenderTarget(null);
    // renderer.render(screenScene, screenCamera);

    renderRoutine();

    // composer = new EffectComposer( renderer );
    // const renderPass = new RenderPass( scene, camera );
    // postprocMaterial.uniforms.resolution.value = [canvasWidth*window.devicePixelRatio, canvasHeight*window.devicePixelRatio];
    // const postprocPass = new ShaderPass( postprocMaterial );
    // composer.addPass( renderPass );
    // composer.addPass( postprocPass );
    // composer.render();
    // renderer.render(scene, camera);
    // requestAnimationFrame(animate);
    //renderer.render( scene, camera );
    if(isFxpreview)
        fxpreview();
    //console.log('hash:', fxhash);
    //window.addEventListener( 'resize', onWindowResize );
}


function repositionCanvas(canvas){
    var win = window;
    var doc = document;
    var body = doc.getElementsByTagName('body')[0];
    var ww = win.innerWidth;
    var wh = win.innerHeight;
    
    if(isMobile()){
      //canvas.width = ww;
      //canvas.height = wh;
      //canvas.style.borderWidth = "6px";
    }
    else{
      //canvas.width = Math.min(ww, wh) - 130;
      //canvas.height = Math.min(ww, wh) - 130;
    }

    canvas.style.position = 'absolute';
    canvas.style.left = (ww - canvasWidth)/2 + 'px';
    canvas.style.top = (wh - canvasHeight)/2 + 'px'; // ovih 6 je border
    
}

function rand(v1, v2){
    return v1 + fxrand()*(v2-v1);
}

function mixhue(h1, h2, p=.5){
    if(Math.abs(h2-h1)<.5){
        return h1*p + (1-p)*h2;
    }
    else{
        return (h1+1)*p + (1-p)*h2;
    }
}



function generatePlant(off=0){

    let h1 = fxrand()*0+.25;
    let h2 = fxrand()*0+.6;
    let h3 = mixhue(h1, h2, .625);
    let palette = [
        saturatecol(brightencol(rybcolor(.52), rand(0,.1)), -rand(0,.4)),
        saturatecol(brightencol(rybcolor(.54), -rand(0.4,.6)), -rand(0,.4)),
    ]
    let ni = 144;
    let nj = 44;
    for(let j = 0; j < nj; j++){
        for(let i = 0; i < ni; i++){
            let px = map(i, 0, ni-1, 0, 1);
            let py = map(j, 0, nj-1, 1, 0);
            py = Math.pow(py, 2);
            let x = map(px, 0, 1, -baseWidth/2*.8, +baseWidth/2*.8) + rand(-3, 3);
            let y = map(py, 0, 1, -baseHeight/2*.8, +baseHeight/2*.8) + rand(-3, 3);
            let col1 = palette[0];
            let col2 = palette[1];
            let col = rybcolor(0);
            let fac = py + rand(-.3,.3);
            col[0] = col1[0]*fac + (1-fac)*col2[0];
            col[1] = col1[1]*fac + (1-fac)*col2[1];
            col[2] = col1[2]*fac + (1-fac)*col2[2];
            let angle = rand(-.4, .4)*0 - x*.0021;
            let sx = 11;
            let sy = 74;

            particlePositions.push(x, y, 0);
            particleColors.push(col[0]*.6, col[1]*.6, col[2]*.6, 1);
            particleSizes.push(sx*1.2, sy*1.2);
            particleAngles.push(angle);
            particleIndices.push(globalIndex++);
            
            particlePositions.push(x, y, 0);
            particleColors.push(col[0], col[1], col[2], 1);
            particleSizes.push(sx, sy);
            particleAngles.push(angle);
            particleIndices.push(globalIndex++);
        }
    }

    let polygons = [];
    let poly = [];
    for(let k = 0; k < 44; k++){
        let a = map(k, 0, 44, 0, 2*3.14);
        let x = 100*Math.cos(a);
        let y = 100*Math.sin(a);
        poly.push([x, y]);
    }
    polygons.push(poly);
    polygons.push(
        [
            [-100, -100],
            [+100, -100],
            [+100, +100],
            [-100, +100],
        ]
    );

    let th = 17;
    for(let pl = 0; pl < polygons.length; pl++){
        let poly = polygons[pl];
        let col;
        if(pl == 0){
            col = rybcolor(.51);
        }
        if(pl == 1){
            col = rybcolor(.2);
        }
        for(let k = 0; k < poly.length; k++){
            let x1 = poly[k][0];
            let y1 = poly[k][1];
            // let al = rand(0,10000);
            // let r = rand(100, 200);
            let x2 = poly[(k+1)%poly.length][0];
            let y2 = poly[(k+1)%poly.length][1];
    
            let x = (x1+x2)/2;
            let y = (y1+y2)/2;
            let angle = Math.atan2(y2-y1, x2-x1);
            let d = Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
            let sx = d*2;
            let sy = th;
    
    
            particlePositions.push(x, y, 0);
            particleColors.push(col[0]*.6, col[1]*.6, col[2]*.6, 1);
            particleSizes.push(sx*1.2, sy*1.2);
            particleAngles.push(angle);
            particleIndices.push(globalIndex++);
            
            particlePositions.push(x, y, 0);
            particleColors.push(col[0], col[1], col[2], 1);
            particleSizes.push(sx, sy);
            particleAngles.push(angle);
            particleIndices.push(globalIndex++);
        }
    }


}

function centerPoission(pts, pw, ph){
    let npts = [];
    for(let k = 0; k < pts.length; k++){
        npts.push([pts[k][0]-pw/2, pts[k][1]-ph/2]);
    }
    return npts;
}

function getImagePixelValueSomehow(x, y){
    return 1;
}

function generateOONew(off){

    let palette = [
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.9), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), rand(-.9,.6)), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), rand(-.9,.6)), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), rand(-.9,.6)), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.9), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.9), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.9), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.9), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.3), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.3), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.3), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.3), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), +.4)
    ]

    // palette = [
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.5), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.3), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.1), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.5), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.3), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.1), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.5), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.3), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.1), 

    //     brightencol(saturatecol(rybcolor(.66), .3), -.0), 
    //     brightencol(saturatecol(rybcolor(.67), .3), -.3), 
    //     brightencol(saturatecol(rybcolor(.68), .3), -.6),

    //     brightencol(saturatecol(rybcolor(.22), .3), .0), 
    //     brightencol(saturatecol(rybcolor(.22), .3), -.1), 
    //     brightencol(saturatecol(rybcolor(.22), .3), -.2), 
    //     brightencol(saturatecol(rybcolor(.22), .3), -.3), 
        
    //     brightencol(saturatecol(rybcolor(.0), .3), -.0), 
    //     brightencol(saturatecol(rybcolor(.0), .3), -.2), 
    //     brightencol(saturatecol(rybcolor(.0), .3), -.6), 
    // ]
    
    palette = [
        brightencol(saturatecol(rybcolor(.1)+off, -.1), -.5),  

        brightencol(saturatecol(rybcolor(.66+off), .3), -.0), 

        brightencol(saturatecol(rybcolor(.22+off), .3), .0),  
        
        brightencol(saturatecol(rybcolor(.0), .3), -.0), 

        brightencol(saturatecol(rybcolor(.0), -1), -0.4), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.5), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.6), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.7), 

        brightencol(saturatecol(rybcolor(.0), -1), -0.4), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.5), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.6), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.7), 

        brightencol(saturatecol(rybcolor(.0), -1), -0.4), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.5), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.6), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.7), 
    ]

    let qa = Math.floor(fxrand()*palettes.length);
    palette = palettes[qa];
    console.log(qa);

    // palette = [];
    // let N = 20;
    // for(let k = 0; k < N; k++){
    //     let col = rybcolor(map(k, 0, N, 0, .4)+off);
    //     col = saturatecol(col, rand(-.85, 1));
    //     col = brightencol(col, rand(-.2, .3));
    //     palette.push(col);
    // }

    let fax = rand(111, 888)*1.3;
    let fay = rand(111, 888)*1.3;
    let r = 500;
    let totalangle = 5*3.14;
    let dalpha = 2.3/r;
    let amount = Math.round(totalangle/dalpha)*2;
    let startingamount = globalIndex;
    for(let alpha = 0; alpha < totalangle; alpha += dalpha){
        let colorChangeFreq = 3 + 4*(-1 + 2*power(noise(globalIndex*.004), 4));
        colorChangeFreq = constrain(colorChangeFreq, .01, 2)*.0001*2;
        //let rrr = 12*r*(-.5+noise(alpha*(.1+.027*r/1200), 1, 31.12));
        let frq = map(power(noise(globalIndex*.001, 1, 22.55), 3), 0, 1, .01, .2);
        let rrr = 12*r*(-.5+noise(alpha*frq, 1, 31.12));
        let x = rrr*Math.cos(alpha/rrr*fax)*1;
        let y = rrr*Math.sin(alpha/rrr*fay)*resy/resx*1;

        // if(x > baseWidth/2-100 || y > baseHeight/2-100 || x < -baseWidth/2-100 || y< -baseHeight/2-100)
        //     continue;

        let dist = Math.sqrt(x*x+y*y)/Math.sqrt(baseWidth*baseWidth/4+baseHeight*baseHeight/4);

        let pr = map(Math.pow(dist, 3), 0, 1, 1, 1)*3;
        
        particlePositions.push(x, y, 0);
        let dimu = .77;
        particlePositions.push(x, y, 0);
        let rr = rand(.9, .99);
        let col = rybcolor(alpha/3.14);
        col = saturatecol(col, -.1-.73*dist);
        col = brightencol(col, .1+.73*dist);
        col = palette[Math.floor(power(noise(globalIndex*colorChangeFreq), 3)*palette.length)%palette.length];
            col = saturatecol(col, .08*(-.5+power(noise(globalIndex*3.1 + .04*r+x*.008+baseWidth,.04*r+y*.008+baseHeight,391.31),3)));
            col = brightencol(col, .08*(-.5+power(noise(globalIndex*3.1 + .04*r+x*.008+baseWidth,.04*r+y*.008+baseHeight,223.55),3)));
        // particleSizes.push(2*size[0], 2*size[1]);
        let nzy = 1.1 + 1*(-.5+power(noise(globalIndex*2.2,333.31),3));
        
        // if(globalIndex>160000 && globalIndex<161000){
        //     col = rybcolor(map(globalIndex,160000, 161000, 0, 1));
        // }
        if(fxrand() < -1./100){
            particleColors.push(col[0], col[1], col[2], 1);
            // particleColors.push(col[0], col[1], col[2], 1);
            particleSizes.push(2, 40*rand(15, 40));
            // particleSizes.push(2, 40*rand(15, 40));
        }
        else{
            if((globalIndex-startingamount) < .2*amount){
                col = saturatecol(col, -.4);
                particleColors.push(col[0]*dimu, col[1]*dimu, col[2]*dimu, .99);
                particleColors.push(col[0], col[1], col[2], .99);
                particleSizes.push(2*22*pr, 2*2.2*18*pr*nzy);
                particleSizes.push(2*19*pr, 2*2.*18*pr*nzy);
            }
            else if((globalIndex-startingamount) < .9*amount){
                // col = brightencol(col, rand(-.44, .44));
                col = saturatecol(col, -.4);
                particleColors.push(col[0]*dimu, col[1]*dimu, col[2]*dimu, .99);
                particleColors.push(col[0], col[1], col[2], .99);
                particleSizes.push(9*pr, 1*18*pr*nzy);
                particleSizes.push(5*pr, .8*18*pr*nzy);
            }
            else if((globalIndex-startingamount) < 11140000){
                col = brightencol(col, rand(-.44, .44));
                particleColors.push(col[0]*dimu, col[1]*dimu, col[2]*dimu, .99);
                particleColors.push(col[0], col[1], col[2], .99);
                particleSizes.push(3*pr, .6*18*pr*nzy);
                particleSizes.push(2*pr, .4*18*pr*nzy);
            }
            // col = saturatecol(col, -.4);
            // particleColors.push(col[0]*dimu, col[1]*dimu, col[2]*dimu, 1);
            // particleColors.push(col[0], col[1], col[2], 1);
            // particleSizes.push(9*pr, 1*18*pr*nzy);
            // particleSizes.push(5*pr, .8*18*pr*nzy);
        }

        // particleAngles.push(alpha + 42*rand(-.05, .05));
        let aangle = (Math.round(alpha/3)*3) + 3*rand(-.05, .05);
        particleAngles.push(alpha + 0*rand(-.05, .05));
        particleAngles.push(alpha + 0*rand(-.05, .05));
        particleIndices.push(globalIndex++);
        particleIndices.push(globalIndex++);
    }
    console.log(globalIndex);
}


function generateOO(off){

    let pw = baseWidth - 160;
    let ph = baseHeight - 160;
    var pds = new PoissonDiskSampling({
        shape: [pw, ph],
        minDistance: 1,
        maxDistance: 15,
        tries: 20,
        distanceFunction: function (p) {
            return getImagePixelValueSomehow(p[0], p[1]); // value between 0 and 1
        }
    });
    var poissonpts = centerPoission(pds.fill(), pw, ph);
    console.log(poissonpts.length);
    let qa = Math.floor(fxrand()*palettes.length);
    console.log(Math.floor(fxrand()*palettes.length));
    let palette = palettes[qa];
    palette = palettes[3];

    let fax = rand(111, 888)*1.3*0+1;
    let fay = rand(111, 888)*1.3*0+1;
    let r = 33;
    let dr = 3;
    let p0 = poissonpts[0];
    for(let k = 0; k < poissonpts.length; k++){
        let p = map(k, 0, poissonpts.length-1, 0, 1);
        let colorChangeFreq = 3 + 4*(-1 + 2*power(noise(globalIndex*.004), 4));
        colorChangeFreq = constrain(colorChangeFreq, .01, 2)*.0001*2;
        let x = poissonpts[k][0];
        let y = poissonpts[k][1];

        // if(x > baseWidth/2-100 || y > baseHeight/2-100 || x < -baseWidth/2-100 || y< -baseHeight/2-100)
        //     continue;

        let dist = Math.sqrt(x*x+y*y)/Math.sqrt(baseWidth*baseWidth/4+baseHeight*baseHeight/4);

        let pr = map(Math.pow(dist, 3), 0, 1, 3, 3)*2;
        pr = 1 + 1*power(noise(x*0.01, y*0.01, 381.1), 3)*p;
        
        particlePositions.push(x, y, 0);
        let dimu = .77;
        particlePositions.push(x, y, 0);
        let paletteIdx = Math.floor(power(noise(globalIndex*colorChangeFreq), 3)*palette.length)%palette.length;
        let col = palette[paletteIdx];
        col = saturatecol(col, .08*(-.5+power(noise(globalIndex*3.1 + .04*r+x*.008+baseWidth,.04*r+y*.008+baseHeight,391.31),3)));
        col = brightencol(col, .08*(-.5+power(noise(globalIndex*3.1 + .04*r+x*.008+baseWidth,.04*r+y*.008+baseHeight,223.55),3)));
        // particleSizes.push(2*size[0], 2*size[1]);
        let nzy = 1.1 + 1*(-.5+power(noise(globalIndex*2.2,333.31),3));
        
        col = saturatecol(col, -.4);
        particleColors.push(col[0]*dimu, col[1]*dimu, col[2]*dimu, 1);
        particleColors.push(col[0], col[1], col[2], 1);
        particleSizes.push(7*pr, 1*18*pr*nzy);
        particleSizes.push(5*pr, .8*18*pr*nzy);

        let alpha = fxrand()*6.28;
        let di = Math.sqrt((y-p0[1])*(y-p0[1]) + (x-p0[0])*(x-p0[0]));
        di = Math.round(di/30);
        alpha = Math.atan2(y-p0[1], x-p0[0]) + 3.14/4 - 3.14/2*(di%2);
        particleAngles.push(alpha + 0*rand(-.05, .05));
        particleAngles.push(alpha + 0*rand(-.05, .05));
        particleIndices.push(globalIndex++);
        particleIndices.push(globalIndex++);
    }
    console.log(globalIndex);
}


function generateOOld(off){


    let palette = [
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.9), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), rand(-.9,.6)), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), rand(-.9,.6)), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), rand(-.9,.6)), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.9), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.9), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.9), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.9), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.3), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.3), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.3), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), -.3), 
        saturatecol(rybcolor(power(fxrand(), .5)+off), +.4)
    ]

    // palette = [
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.5), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.3), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.1), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.5), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.3), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.1), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.5), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.3), 
    //     brightencol(saturatecol(rybcolor(.1), -.1), -.1), 

    //     brightencol(saturatecol(rybcolor(.66), .3), -.0), 
    //     brightencol(saturatecol(rybcolor(.67), .3), -.3), 
    //     brightencol(saturatecol(rybcolor(.68), .3), -.6),

    //     brightencol(saturatecol(rybcolor(.22), .3), .0), 
    //     brightencol(saturatecol(rybcolor(.22), .3), -.1), 
    //     brightencol(saturatecol(rybcolor(.22), .3), -.2), 
    //     brightencol(saturatecol(rybcolor(.22), .3), -.3), 
        
    //     brightencol(saturatecol(rybcolor(.0), .3), -.0), 
    //     brightencol(saturatecol(rybcolor(.0), .3), -.2), 
    //     brightencol(saturatecol(rybcolor(.0), .3), -.6), 
    // ]
    
    palette = [
        brightencol(saturatecol(rybcolor(.1)+off, -.1), -.5),  

        brightencol(saturatecol(rybcolor(.66+off), .3), -.0), 

        brightencol(saturatecol(rybcolor(.22+off), .3), .0),  
        
        brightencol(saturatecol(rybcolor(.0), .3), -.0), 

        brightencol(saturatecol(rybcolor(.0), -1), -0.4), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.5), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.6), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.7), 

        brightencol(saturatecol(rybcolor(.0), -1), -0.4), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.5), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.6), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.7), 

        brightencol(saturatecol(rybcolor(.0), -1), -0.4), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.5), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.6), 
        brightencol(saturatecol(rybcolor(.0), -1), -0.7), 
    ]

    let qa = Math.floor(fxrand()*palettes.length);
    palette = palettes[qa];
    console.log(qa);

    // palette = [];
    // let N = 20;
    // for(let k = 0; k < N; k++){
    //     let col = rybcolor(map(k, 0, N, 0, .4)+off);
    //     col = saturatecol(col, rand(-.85, 1));
    //     col = brightencol(col, rand(-.2, .3));
    //     palette.push(col);
    // }

    let fax = rand(111, 888)*1.3;
    let fay = rand(111, 888)*1.3;
    for(let r = 4; r < 300; r += 4){
        for(let alpha = 0; alpha < 2*3.14; alpha += 2.3/r){
            let colorChangeFreq = 3 + 4*(-1 + 2*power(noise(globalIndex*.004), 4));
            colorChangeFreq = constrain(colorChangeFreq, .01, 2)*.0001*2;
            let rrr = r + 6*r*(-.5+noise(alpha*(.3+.027*r/100), r, 31.12));
            let x = rrr*Math.cos(alpha/rrr*fax)*1;
            let y = rrr*Math.sin(alpha/rrr*fay)*resy/resx*1;

            // if(x > baseWidth/2-100 || y > baseHeight/2-100 || x < -baseWidth/2-100 || y< -baseHeight/2-100)
            //     continue;

            let dist = Math.sqrt(x*x+y*y)/Math.sqrt(baseWidth*baseWidth/4+baseHeight*baseHeight/4);

            let pr = map(Math.pow(dist, 3), 0, 1, 3, 3)*2;
            
            particlePositions.push(x, y, 0);
            let dimu = .77;
            particlePositions.push(x, y, 0);
            let rr = rand(.9, .99);
            let col = rybcolor(alpha/3.14);
            col = saturatecol(col, -.1-.73*dist);
            col = brightencol(col, .1+.73*dist);
            col = palette[Math.floor(power(noise(globalIndex*colorChangeFreq), 3)*palette.length)%palette.length];
             col = saturatecol(col, .08*(-.5+power(noise(globalIndex*3.1 + .04*r+x*.008+baseWidth,.04*r+y*.008+baseHeight,391.31),3)));
             col = brightencol(col, .08*(-.5+power(noise(globalIndex*3.1 + .04*r+x*.008+baseWidth,.04*r+y*.008+baseHeight,223.55),3)));
            // particleSizes.push(2*size[0], 2*size[1]);
            let nzy = 1.1 + 1*(-.5+power(noise(globalIndex*2.2,333.31),3));
            
            // if(globalIndex>160000 && globalIndex<161000){
            //     col = rybcolor(map(globalIndex,160000, 161000, 0, 1));
            // }
            if(fxrand() < -1./100){
                particleColors.push(col[0], col[1], col[2], 1);
                // particleColors.push(col[0], col[1], col[2], 1);
                particleSizes.push(2, 40*rand(15, 40));
                // particleSizes.push(2, 40*rand(15, 40));
            }
            else{
                if(globalIndex < 10){
                    col = saturatecol(col, -.4);
                    particleColors.push(col[0]*dimu, col[1]*dimu, col[2]*dimu, .4);
                    particleColors.push(col[0], col[1], col[2], .4);
                    particleSizes.push(22*pr, 2.2*18*pr*nzy);
                    particleSizes.push(19*pr, 2.*18*pr*nzy);
                }
                else if(globalIndex < 170000*1.){
                    // col = brightencol(col, rand(-.44, .44));
                    col = saturatecol(col, -.4);
                    particleColors.push(col[0]*dimu, col[1]*dimu, col[2]*dimu, .6);
                    particleColors.push(col[0], col[1], col[2], .6);
                    particleSizes.push(9*pr, 1*18*pr*nzy);
                    particleSizes.push(5*pr, .8*18*pr*nzy);
                }
                else if(globalIndex < 11140000){
                    col = brightencol(col, rand(-.44, .44));
                    particleColors.push(col[0]*dimu, col[1]*dimu, col[2]*dimu, .99);
                    particleColors.push(col[0], col[1], col[2], .99);
                    particleSizes.push(3*pr, .6*18*pr*nzy);
                    particleSizes.push(2*pr, .4*18*pr*nzy);
                }
                // col = saturatecol(col, -.4);
                // particleColors.push(col[0]*dimu, col[1]*dimu, col[2]*dimu, 1);
                // particleColors.push(col[0], col[1], col[2], 1);
                // particleSizes.push(9*pr, 1*18*pr*nzy);
                // particleSizes.push(5*pr, .8*18*pr*nzy);
            }

            // particleAngles.push(alpha + 42*rand(-.05, .05));
            let aangle = (Math.round(alpha/3)*3) + 3*rand(-.05, .05);
            particleAngles.push(alpha + 0*rand(-.05, .05));
            particleAngles.push(alpha + 0*rand(-.05, .05));
            particleIndices.push(globalIndex++);
            particleIndices.push(globalIndex++);
        }
    }
    console.log(globalIndex);
}


function windowResized() {
    if(renderer){
        
        var ww = window.innerWidth || canvas.clientWidth || body.clientWidth;
        var wh = window.innerHeight|| canvas.clientHeight|| body.clientHeight;

        canvasWidth = resx;
        canvasHeight = resy;

        var ww = window.innerWidth || canvas.clientWidth || body.clientWidth;
        var wh = window.innerHeight|| canvas.clientHeight|| body.clientHeight;

        baseWidth = resx-22;
        baseHeight = resy-22;

        winScale = ww / baseWidth;
        
        if(ww < resx+16 || wh < resy+16 || true){
            var mm = min(ww, wh);
            canvasWidth = mm*resx/resy-22*mm/resx;
            canvasHeight = mm-22*mm/resy;
            //baseWidth = mm-16-16;
            //baseHeight = mm-16-16;
        }

        winScale = canvasWidth / resx;
        camera.left = -canvasWidth/2 / winScale;
        camera.right = +canvasWidth/2 / winScale;
        camera.top = +canvasHeight/2 / winScale;
        camera.bottom = -canvasHeight/2 / winScale;
        camera.updateProjectionMatrix();

        renderer.setPixelRatio( window.devicePixelRatio );
        //renderer.setPixelRatio( 1.0000 );
        renderer.setSize( canvasWidth, canvasHeight );
    
        renderer.domElement.id = "cnvs";
        //renderer.domElement.style.position = "absolute";
        //renderer.domElement.style.left = "0px";
        //renderer.domElement.style.top = "0px";
        repositionCanvas(renderer.domElement);

    
        // points.material.uniforms.u_time.value = 0;
        // points.material.uniforms.u_scrollscale.value = scrollscale;
        // //console.log(winScale);
        // points.material.uniforms.u_winscale.value = winScale*window.devicePixelRatio;

        // const composer = new EffectComposer( renderer );
        // const renderPass = new RenderPass( scene, camera );
        // PostProcShader.uniforms.resolution.value = [canvasWidth*window.devicePixelRatio, canvasHeight*window.devicePixelRatio];
        // const postprocPass = new ShaderPass( PostProcShader );
        // composer.addPass( renderPass );
        // composer.addPass( postprocPass );
        // composer.render();
        //renderer.render( scene, camera );
    }
    else{
        reset();
    }
}  

function mouseClicked(){
    //reset();
}

function scroll(event) {
    //event.preventDefault();
    //scrollscale = scrollscale + event.deltaY * -0.002;
    //scrollscale = Math.min(Math.max(.125, scrollscale), 6);
  }
  
function renderRoutine(){
    
    const renderScale = 1;
    let outx = resx*renderScale;
    let outy = resy*renderScale;
    console.log(outx, outy);
    let newrenderTarget = new THREE.WebGLRenderTarget(outx, outy);

    ///******///

    let v1 = 0;
    let coco = 0;
    while(v1 < globalIndex){
        coco++;
        if(coco == 32)
            break;
        console.log('rendering', v1, v1+30000);
        let nparticlePositions = [];
        let nparticleColors = [];
        let nparticleSizes = [];
        let nparticleAngles = [];
        let nparticleIndices = [];
        for(let k = v1; k < Math.min(globalIndex, v1+30000); k++){
            nparticlePositions.push(particlePositions[k*3+0], particlePositions[k*3+1], particlePositions[k*3+2]);
            nparticleColors.push(particleColors[k*4+0], particleColors[k*4+1], particleColors[k*4+2], particleColors[k*4+3]);
            nparticleSizes.push(particleSizes[k*2+0], particleSizes[k*2+1]);
            nparticleAngles.push(particleAngles[k]);
            nparticleIndices.push(particleIndices[k]);
        }
        
        scene.remove(scene.children[0]); 
        const pointsGeo = new THREE.BufferGeometry();
        console.log(particlePositions.length, nparticlePositions.length);
        pointsGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( nparticlePositions, 3 ) );
        pointsGeo.setAttribute( 'color', new THREE.Float32BufferAttribute( nparticleColors, 4 ) );
        pointsGeo.setAttribute( 'size', new THREE.Float32BufferAttribute( nparticleSizes, 2 ) );
        pointsGeo.setAttribute( 'angle', new THREE.Float32BufferAttribute( nparticleAngles, 1 ) );
        pointsGeo.setAttribute( 'index', new THREE.Float32BufferAttribute( nparticleIndices, 1 ) );

        let pointsMaterial = new THREE.ShaderMaterial( {
            uniforms: {
                u_time: { value: frameCount },
                u_scrollscale: { value: scrollscale },
                u_winscale: { value: 4. },
                u_resolution: {value: [baseWidth, baseHeight]}
            },
            vertexShader: particleVertShader,
            fragmentShader: particleFragShader,
            transparent:  true,
            depthTest: false,
        });

        points = new THREE.Points( pointsGeo, pointsMaterial );
        scene.add( points );
        points.material.uniforms.u_winscale.value = renderScale;
    ///******///
        if(coco>1){
             scene.background = null;
            //  renderer.setClearColor( 0xffffff, 0 );
             renderer.autoClear = false;
        }
        
        // scene.scale.y = -1;
        renderer.setRenderTarget(newrenderTarget);
        renderer.render(scene, camera);

        v1 += 30000;
    }
    
    renderer.setRenderTarget(null);
    // screenScene.scale.y = -1;
    postprocMaterial.uniforms.resolution.value = [outx, outy];
    postprocMaterial.uniforms.tDiffuse.value = newrenderTarget.texture;
    renderer.render(screenScene, screenCamera);
}

function save(){

    const renderScale = 4;
    let outx = resx*renderScale;
    let outy = resy*renderScale;
    console.log(outx, outy);
    let newrenderTarget = new THREE.WebGLRenderTarget(outx, outy);
    let newrenderTarget2 = new THREE.WebGLRenderTarget(outx, outy);

    ///******///

    
    scene.background = new THREE.Color( backgroundColor[0], backgroundColor[1], backgroundColor[2]);
    let v1 = 0;
    let coco = 0;
    while(v1 < globalIndex){
        coco++;
        if(coco == 32)
            break;
        console.log('rendering', v1, v1+10000);
        let nparticlePositions = [];
        let nparticleColors = [];
        let nparticleSizes = [];
        let nparticleAngles = [];
        let nparticleIndices = [];
        for(let k = v1; k < Math.min(globalIndex, v1+10000); k++){
            nparticlePositions.push(particlePositions[k*3+0], particlePositions[k*3+1], particlePositions[k*3+2]);
            nparticleColors.push(particleColors[k*4+0], particleColors[k*4+1], particleColors[k*4+2], particleColors[k*4+3]);
            nparticleSizes.push(particleSizes[k*2+0], particleSizes[k*2+1]);
            nparticleAngles.push(particleAngles[k]);
            nparticleIndices.push(particleIndices[k]);
        }
        
        scene.remove(scene.children[0]); 
        const pointsGeo = new THREE.BufferGeometry();
        console.log(particlePositions.length, nparticlePositions.length);
        pointsGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( nparticlePositions, 3 ) );
        pointsGeo.setAttribute( 'color', new THREE.Float32BufferAttribute( nparticleColors, 4 ) );
        pointsGeo.setAttribute( 'size', new THREE.Float32BufferAttribute( nparticleSizes, 2 ) );
        pointsGeo.setAttribute( 'angle', new THREE.Float32BufferAttribute( nparticleAngles, 1 ) );
        pointsGeo.setAttribute( 'index', new THREE.Float32BufferAttribute( nparticleIndices, 1 ) );

        let pointsMaterial = new THREE.ShaderMaterial( {
            uniforms: {
                u_time: { value: frameCount },
                u_scrollscale: { value: scrollscale },
                u_winscale: { value: 4. },
                u_resolution: {value: [baseWidth, baseHeight]}
            },
            vertexShader: particleVertShader,
            fragmentShader: particleFragShader,
            transparent:  true,
            depthTest: false,
        });

        points = new THREE.Points( pointsGeo, pointsMaterial );
        scene.add( points );
        points.material.uniforms.u_winscale.value = renderScale;
    ///******///
        if(coco>1){
             scene.background = null;
            //  renderer.setClearColor( 0xffffff, 0 );
             renderer.autoClear = false;
        }
        
        // scene.scale.y = -1;
        renderer.setRenderTarget(newrenderTarget);
        renderer.render(scene, camera);
        renderer.autoClear = false;

        v1 += 10000;
    }
    
    renderer.setRenderTarget(newrenderTarget2);
    screenScene.scale.y = -1;
    postprocMaterial.uniforms.resolution.value = [outx, outy];
    postprocMaterial.uniforms.tDiffuse.value = newrenderTarget.texture;
    renderer.render(screenScene, screenCamera);

    const width = newrenderTarget2.width;
    const height = newrenderTarget2.height;
    const pixels = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(newrenderTarget2, 0, 0, width, height, pixels);

    const fakeCanvas = document.createElement('canvas');
    fakeCanvas.width = width;
    fakeCanvas.height = height;
    const context = fakeCanvas.getContext('2d');
    const imageData = context.createImageData(width, height);
    imageData.data.set(pixels);
    context.putImageData(imageData, 0, 0); // because flipping

    // Generate a data URL for the canvas as a PNG image
    const dataURL = fakeCanvas.toDataURL('image/png');

    // Create an <a> element with download attribute and click it programmatically to download the PNG file
    const link = document.createElement('a');
    link.download = 'render_' + fxhash + '.png';
    link.href = dataURL;
    link.click();
}

function keyDown(event){
    if(event.key == 's'){
        console.log('saving...');
        save();
    }
}
  
window.onresize = windowResized;
window.onresize = windowResized;
window.onclick = mouseClicked;
window.onkeydown = keyDown;
window.onwheel = scroll;

function loadShadersAndData(){
    
    let loader = new THREE.FileLoader();
    const s1 = new Promise((resolve, reject) => {
        loader.load('./assets/shaders/particle.frag', resolve, undefined, reject);
    });
    const s2 = new Promise((resolve, reject) => {
        loader.load('./assets/shaders/particle.vert', resolve, undefined, reject);
    });
    const s3 = new Promise((resolve, reject) => {
        loader.load('./assets/shaders/postproc.frag', resolve, undefined, reject);
    });
    const s4 = new Promise((resolve, reject) => {
        loader.load('./assets/shaders/postproc.vert', resolve, undefined, reject);
    });
      
    Promise.all([s1, s2, s3, s4]).then(([frag1, vert1, frag2, vert2]) => {
        particleFragShader = frag1;
        particleVertShader = vert1;
        postprocFragShader = frag2;
        postprocVertShader = vert2;
        init();
        reset();
    })
    .catch((err) => {
        console.error(err);
    });
    
}

var paletteImg = new Image();
paletteImg.src = './assets/colorPalette2.png';
paletteImg.onload = function () {
    paletteCanvas = document.createElement('canvas');
    paletteCanvas.width = paletteImg.width;
    paletteCanvas.height = paletteImg.height;
    paletteCanvas.getContext('2d').drawImage(paletteImg, 0, 0, paletteImg.width, paletteImg.height);
    loadShadersAndData();
}

const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;

let perlin_octaves = 4; 
let perlin_amp_falloff = 0.5; 

const scaled_cosine = i => 0.5 * (1.0 - Math.cos(i * Math.PI));
let perlin;


var noise = function(x, y = 0, z = 0) {
  if (perlin == null) {
    perlin = new Array(PERLIN_SIZE + 1);
    for (let i = 0; i < PERLIN_SIZE + 1; i++) {
      perlin[i] = fxrand();
    }
  }

  if (x < 0) {
    x = -x;
  }
  if (y < 0) {
    y = -y;
  }
  if (z < 0) {
    z = -z;
  }

  let xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
  let xf = x - xi;
  let yf = y - yi;
  let zf = z - zi;
  let rxf, ryf;

  let r = 0;
  let ampl = 0.5;

  let n1, n2, n3;

  for (let o = 0; o < perlin_octaves; o++) {
    let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

    rxf = scaled_cosine(xf);
    ryf = scaled_cosine(yf);

    n1 = perlin[of & PERLIN_SIZE];
    n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
    n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
    n1 += ryf * (n2 - n1);

    of += PERLIN_ZWRAP;
    n2 = perlin[of & PERLIN_SIZE];
    n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
    n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
    n2 += ryf * (n3 - n2);

    n1 += scaled_cosine(zf) * (n2 - n1);

    r += n1 * ampl;
    ampl *= perlin_amp_falloff;
    xi <<= 1;
    xf *= 2;
    yi <<= 1;
    yf *= 2;
    zi <<= 1;
    zf *= 2;

    if (xf >= 1.0) {
      xi++;
      xf--;
    }
    if (yf >= 1.0) {
      yi++;
      yf--;
    }
    if (zf >= 1.0) {
      zi++;
      zf--;
    }
  }
  return r;
};

var noiseDetail = function(lod, falloff) {
  if (lod > 0) {
    perlin_octaves = lod;
  }
  if (falloff > 0) {
    perlin_amp_falloff = falloff;
  }
};

var noiseSeed = function(seed) {
  const lcg = (() => {
    const m = 4294967296;
    const a = 1664525;
    const c = 1013904223;
    let seed, z;
    return {
      setSeed(val) {
        z = seed = (val == null ? fxrand() * m : val) >>> 0;
      },
      getSeed() {
        return seed;
      },
      rand() {
        z = (a * z + c) % m;
        return z / m;
      }
    };
  })();

  lcg.setSeed(seed);
  perlin = new Array(PERLIN_SIZE + 1);
  for (let i = 0; i < PERLIN_SIZE + 1; i++) {
    perlin[i] = lcg.rand();
  }
};