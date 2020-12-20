function create_program(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);

    return p;
}

function create_shader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);

    var compiled = gl.getShaderParameter(s, gl.COMPILE_STATUS);
    console.log('Shader compiled successfully: ' + compiled);
    var compilationLog = gl.getShaderInfoLog(s);
    console.log('Shader compiler log: ' + compilationLog);
    return s;
}


var vert_source = `
attribute vec4 a_position;

void main() {
  gl_Position = vec4(a_position.xy, 0.0, 1.0);
}
`;


// shader code by patu, used with permission
// https://www.shadertoy.com/view/Xd3BW2
var shadertoy_source = `
    /* 

    Worms from "Digiverse" (demoscene producion)
	
    https://www.youtube.com/watch?v=p5p_qWKrKj0
    http://www.pouet.net/prod.php?which=76719


*/


/*
	http://bit.ly/shadertoy-plugin
*/





#pragma optimize(off)





#ifdef GL_ES
#define FAR 4.
#else
#define FAR 10.
#endif

#define t iTime
#define mt iTime
#define FOV 80.0
#define FOG .4

#define PI 3.14159265
#define TAU (2*PI)
#define PHI (1.618033988749895)

vec3 light = vec3(0.0);
vec3 opRep( vec3 p, vec3 c )
{
    return mod(p,c)-0.5*c;
}

vec3 opU2( vec3 d1, vec3 d2 ) {
    if (d1.x < d2.x) return d1;
    return d2;
}

vec3 opS2( vec3 d1, vec3 d2 )
{	
    if (-d2.x > d1.x) return -d2;
    return d1;
}

float vmax(vec3 v) {
	return max(max(v.x, v.y), v.z);
}

void pR(inout vec2 p, float a) {
	p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

// Repeat around the origin by a fixed angle.
// For easier use, num of repetitions is use to specify the angle.
float pModPolar(inout vec2 p, float repetitions) {
	float angle = 2.*PI/repetitions;
	float a = atan(p.y, p.x) + angle/2.;
	float r = length(p);
	float c = floor(a/angle);
	a = mod(a,angle) - angle/2.;
	p = vec2(cos(a), sin(a))*r;
	// For an odd number of repetitions, fix cell index of the cell in -x direction
	// (cell index would be e.g. -5 and 5 in the two halves of the cell):
	if (abs(c) >= (repetitions/2.)) c = abs(c);
	return c;
}

// Box: correct distance to corners
float fBox(vec3 p, vec3 b) {
	vec3 d = abs(p) - b;
	return length(max(d, vec3(0))) + vmax(min(d, vec3(0)));
}

float fCross(vec3 p, vec3 size) {
	return min(fBox(p, size), min(fBox(p, size.zxy), fBox(p, size.yzx)));
}

// Repeat in two dimensions
vec2 pMod2(inout vec2 p, vec2 size) {
	vec2 c = floor((p + size*0.5)/size);
	p = mod(p + size*0.5,size) - size*0.5;
	return c;
}

// pasta
float spi(vec3 p, bool hole) {
    vec3 op = p;

    pR(p.yz, p.x * .4);    
    
    float y = pModPolar(p.zy, 3.);
    
    p.z -= .09 + sin(p.z) * .07;
    
    pR(p.yz, p.x * 5.);    
    
    float x = pModPolar(p.zy, 5.);
	
    p.z -= .01;
    p.z -= (.03 + x / 65. + sin(p.z * 3. + y / 34.) * .43) * .3;
	
    op.x -= y * .01 + x * .01;
    
 	float l = length(p.zy) - .01 - sin(p.z) * 0.03;
    if (hole) return l;
	return max(l, op.x - iTime * .3 + .15);
        
}

// scene
vec3 map(vec3 p) {
    vec3 op = p;
    vec3 obj = vec3(0, 1., 1.0), 
        obj2 = vec3(FAR, 2., 0.);

    vec3 orgP = p;
 
    p = opRep(orgP, vec3(.5));
    
    vec3 size = vec3(0.2, .32, .1 );
    
    #define C size *= 1.1; p = opRep(orgP, vec3(0.35) + size.y + size.z); obj = opS2(obj, vec3(fCross(p, size) + .05, 0.0, 1.));
    
    // add or remove C :)
    C C C
    
    vec3 p2 = op;
    
    p2.y -= .4;
    p2.z -= 4.8;
	
    op.yz -= vec2(.4, 4.8);
    
    if (length(op.zy) - .15 < 0.1) {
        obj.x = max(obj.x, -spi(p2, true) + .02);
        obj2.x = spi(p2, false);
    } else { 
     	obj2.x = length(op.zy) - .15;   
    }
    
    return opU2(obj, obj2);
}

vec3 trace(vec3 ro, vec3 rd) {
    vec3 t = vec3(0., -1., 0.0), d;
    for (int i = 0; i < 70; i++) {
        d = map(ro + rd * t.x);
        if (abs(d.x) < 0.001 || t.x > FAR) break;
        t.x += d.x * .7; 
    }
    t.yz = d.yz;
    return t;
}

vec3 traceRef(vec3 ro, vec3 rd) {
    vec3 t = vec3(0., 1., 0.), d;

    for (int i = 0; i < 36; i++) {
        d = map(ro + rd * t.x);
        if (abs(d.x) < 0.001 || t.x> FAR) break;
        t.x += d.x;
    }
    t.yz = d.yz;
    return t;
}

float softShadow(vec3 ro, vec3 lp, float k) {
    const int maxIterationsShad = 18;
    vec3 rd = (lp - ro);

    float shade = 1.0;
    float dist = .01;
    float end = max(length(rd), 0.001);
    float stepDist = end / float(maxIterationsShad);

    rd /= end;
    for (int i = 0; i < maxIterationsShad; i++) {
        float h = map(ro + rd * dist).x;
        shade = min(shade, smoothstep(0.0, 1.0, k * h / dist)); 
        dist += min(h, stepDist * 2.); 
        if (h < 0.001 || dist > end) break;
    }
    return min(max(shade, 0.55), 1.0);
}

vec3 getNormal(in vec3 pos) {
    vec2 eps = vec2(0.001, 0.0);
    vec3 normal = vec3(
        map(pos + eps.xyy).x - map(pos - eps.xyy).x,
        map(pos + eps.yxy).x - map(pos - eps.yxy).x,
        map(pos + eps.yyx).x - map(pos - eps.yyx).x);
    return normalize(normal);
}

float getAO(in vec3 hitp, in vec3 normal) {
    float dist = .05;
    vec3 spos = hitp + normal * dist;
    float sdist = map(spos).x;
    return clamp(sdist / dist, 0.4, 1.0);
}

vec3 getObjectColor(vec3 p, vec3 n, vec2 mat) {
    if (mat.x == 0.0) return vec3(.0, .0, .1) + vec3(0., 1., 1.) * smoothstep(0.1, .0, fract(p.y * 9.));
    if (mat.x == 2.0) return vec3(.8, .0, .4) + floor(.1 + fract(p.x * 14. - 3. * iTime));
    
    return vec3(.0);
}

vec3 doColor( in vec3 sp, in vec3 rd, in vec3 sn, in vec3 lp, vec2 mat) {
	vec3 ld = lp - sp; 
    float lDist = max(length(ld), 0.001);
    ld /= lDist; 

    float atten = 2.0 / (1.0 + lDist * 0.525 + lDist * lDist * 0.05);
	float diff = max(dot(sn, ld), .1);
    float spec = pow(max(dot(reflect(-ld, sn), -rd), 0.0), 1.0);

    vec3 objCol = getObjectColor(sp, sn, mat);

    if (mat.x == 2.) spec = 0.;
    
    return (objCol * (diff + 0.15) + vec3(.1, .1, .1) * spec * .8) * atten;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    
    vec2 uv = fragCoord.xy / iResolution.xy - .5;
    
    uv *= tan(radians (FOV) / 2.0) * 2.;
    uv.y += sin(t * 3. + cos(4.*-t)) * 0.03;
    
    float 
        sk = sin(t * .3) * 22.0,
        ck = cos(t * .3) * 22.0,
        
        mat = 0.;
        
    light = vec3(0., 1., 1.);        
    
    vec3 sceneColor = vec3(0.);
    
    vec3 
        vuv = normalize(vec3(0., 1., sin(iTime) * .3)), // up
    	ro = vec3(t * .3 , 0.4 , 5.12 ), 
        oro,
    	vrp =  vec3(t * .3 - 18. + ck, 0.4, -43. + sk ),
		
    	vpn = normalize(vrp - ro),
    	u = normalize(cross(vuv, vpn)),
    	v = cross(vpn, u),
    	vcv = (ro + vpn),
    	scrCoord = (vcv + uv.x * u * iResolution.x/iResolution.y + uv.y * v),
    	rd = normalize(scrCoord - ro);
                

    vec3 lp = light + ro;

    vec3 tr = trace(ro, rd), otr = tr;    
    
    float fog = smoothstep(FAR * FOG, 0., tr.x * 3.);
    
    ro += rd * tr.x;
    
    vec3 sn = getNormal(ro);	
    float ao = getAO(ro, sn);
    
    sceneColor += doColor(ro, rd, sn, lp, tr.yz) * 4.;
    float sh = softShadow(ro, lp, 1.);
    
    rd = reflect(rd, sn);
    
    tr = traceRef(ro + rd * .015, rd);
	ro += rd * tr.x;
    
    sn = getNormal(ro);
   
    sceneColor += doColor(ro, rd, sn, lp, tr.yz);        
    sceneColor *= sh * fog * ao;

    fragColor = vec4(clamp(sceneColor, 0.0, 1.0), 1.0);
}
`;


var frag_source = `
#ifdef GL_ES
precision highp float;
#endif
    
    varying vec4 v_color;
    
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec2 iMouse;

    #define HW_PERFORMANCE 0
    ` + shadertoy_source + `
    void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
    }
`;


$(function () {
    let is_mobile = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) is_mobile = true;})(navigator.userAgent||navigator.vendor||window.opera);
    var is_mac_like = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
 
    $("#intro_gif").removeClass("d-none").addClass("d-block");
    return;

    var canvas = document.getElementById('intro');
    var gl = canvas.getContext('webgl');

    var vertexShader = create_shader(gl, gl.VERTEX_SHADER, vert_source);
    var fragmentShader = create_shader(gl, gl.FRAGMENT_SHADER, frag_source);
    var program = create_program(gl, vertexShader, fragmentShader);
    var timeLocation = gl.getUniformLocation(program, "iTime");
    var resolutionLocation = gl.getUniformLocation(program, "iResolution");
    var mouseLocation = gl.getUniformLocation(program, "iMouse");
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    var positions = [
        -1, -1,
        -1, 1,
        1, 1,
        1, 1,
        1, -1,
        -1, -1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    function render(time) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        var size = 2,
            type = gl.FLOAT,
            normalize = false,
            stride = 0,
            offset = 0;
        gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset)

        gl.uniform1f(timeLocation, time * 0.001);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform2f(mouseLocation, 0.0, 0.0);
        // // draw  
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);

        setTimeout(() => {
            requestAnimationFrame(render);
        }, 1000 / 60)

    }
    requestAnimationFrame(render);
})