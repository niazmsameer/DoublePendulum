const twgl = require("twgl.js");

// Simulation constants

/**
 * Rod length
 */
const r = 0.3;

/**
 * Gravity scale
 */
const g = 0.5;

/**
 * @type {WebGL2RenderingContext}
 */
var gl;

var lt = performance.now();
var dt = 0;

/**
 * Simulation state
 */
const state = {
    ballA: {
        rotation: 0.4,
        linearAcceleration: 0,
        angularVelocity: 0,
        angularAcceleration: 0,
        netTorque: 0,
        netForce: 0
    },
    ballB: {
        rotation: Math.PI,
        linearAcceleration: 0,
        angularVelocity: 0,
        angularAcceleration: 0,
        netTorque: 0,
        netForce: 0
    }
};

const graphics = {
    /**
     * @type {twgl.ProgramInfo}
     */
    pointShader: null,
    /**
     * @type {twgl.BufferInfo}
     */
    buffer: null,
    uniforms: {
        u_PointSize: 10
    }
};

function computeForce() {
    // const max1 = (g * Math.sin(Math.PI - state.ballA.rotation));
    // const may1 = (g * Math.cos(Math.PI - state.ballA.rotation)) - g;

    // Ball A: 0
    // Ball B: Pi

    // TODO: * 2

    const max1 = (2 * g * parseFloat(Math.sin(Math.PI - state.ballA.rotation).toFixed(3))) - (g * parseFloat(Math.sin(Math.PI - state.ballB.rotation).toFixed(3)));
    const may1 = (-2 * g * parseFloat(Math.cos(Math.PI - state.ballA.rotation).toFixed(3))) + (g * parseFloat(Math.cos(Math.PI - state.ballB.rotation).toFixed(3))) + g;

    const direction1 = max1 < 0 ? -1 : 1;

    const max2 = -1 * (-1 * g * Math.sin(Math.PI - state.ballB.rotation).toFixed(3));
    const may2 = (g * Math.cos(Math.PI - state.ballB.rotation).toFixed(3)) - g;

    const direction2 = max2 < 0 ? -1 : 1;

    console.log(Math.cos(Math.PI - state.ballB.rotation).toFixed(3));

    state.ballA.netForce = Math.sqrt(Math.pow(max1, 2) + Math.pow(may1, 2)) * direction1;
    state.ballB.netForce = Math.sqrt(Math.pow(max2, 2) + Math.pow(may2, 2)) * direction2;

    console.log("MAX1 " + max1);
    console.log("MAY1 " + may1);
    console.log("MAX2 " + max2);
    console.log("MAY2 " + may2);
    console.log(state.ballA.netForce);
}

function computeLinearAcceleration() {
    state.ballA.linearAcceleration = state.ballA.netForce;
    state.ballB.linearAcceleration = state.ballB.netForce;
}

function computeAngularAcceleration() {
    state.ballA.angularAcceleration = state.ballA.linearAcceleration / r;
    state.ballB.angularAcceleration = state.ballB.linearAcceleration / r;
}

function computeAngularVelocity()  {
    state.ballA.angularVelocity += state.ballA.angularAcceleration * dt;
    state.ballB.angularVelocity += state.ballB.angularAcceleration * dt;
}

function computeRotation() {
    // Get delta for calculating inertia
    const oldA = state.ballA.rotation;

    state.ballA.rotation += state.ballA.angularVelocity * dt;

    const da = state.ballA.rotation - oldA;
    state.ballB.rotation -= da;

    state.ballB.rotation += state.ballB.angularVelocity * dt;

    // Clamp
    if (state.ballA.rotation >= 360) {
        state.ballA.rotation -= 360;
    }

    if (state.ballB.rotation >= 360) {
        state.ballB.rotation -= 360;
    }
}

function update() {
    computeForce();
    computeLinearAcceleration();
    computeAngularAcceleration();
    computeAngularVelocity();
    computeRotation();

    draw();
}

// Graphics

function drawLine(fromX, fromY, toX, toY) {
    const positions = new Float32Array(400);

    positions[0] = fromX;
    positions[1] = fromY;
    positions[2] = toX;
    positions[3] = toY;

    twgl.setAttribInfoBufferFromArray(gl, graphics.buffer.attribs.position, positions);
    twgl.setBuffersAndAttributes(gl, graphics.pointShader, graphics.buffer);
    twgl.setUniforms(graphics.pointShader, graphics.uniforms);

    gl.drawArrays(gl.LINES, 0, 2);
}

function drawCircle(x, y, radius, detail) {
    const fullCircle = Math.PI * 2;
    const positions = new Float32Array(400);

    var offset = 0;

    for (var i = 0; i < detail; i++) {
        positions[offset] = radius * Math.sin(fullCircle / detail * i) + x; offset++;
        positions[offset] = radius * Math.cos(fullCircle / detail * i) + y; offset++;
    }

    twgl.setAttribInfoBufferFromArray(gl, graphics.buffer.attribs.position, positions);
    twgl.setBuffersAndAttributes(gl, graphics.pointShader, graphics.buffer);
    twgl.setUniforms(graphics.pointShader, graphics.uniforms);

    gl.drawArrays(gl.LINE_LOOP, 0, detail);
}

function drawArrow(fromX, fromY, toX, toY) {
    drawLine(fromX, fromY, toX, toY);

    // TODO: Draw arrow head

    // // Vector normalization
    // const magnitude = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    // const directionX = (fromX - toX) / magnitude; // Direction towards beginning of arrow
    // const directionY = (fromY - toY) / magnitude;



    // const positions = new Float32Array(400);
}

function draw() {
    dt = (performance.now() - lt) / 1000;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0.5, 0.5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(graphics.pointShader.program);

    const ballAX = r * Math.sin(state.ballA.rotation);
    const ballAY = r * Math.cos(state.ballA.rotation);
    const ballBX = r * Math.sin(state.ballB.rotation) + ballAX;
    const ballBY = r * Math.cos(state.ballB.rotation) + ballAY;

    drawLine(0, 0, ballAX, ballAY);
    drawCircle(ballAX, ballAY, 0.04, 10);
    drawLine(ballAX, ballAY, ballBX, ballBY);
    drawCircle(ballBX, ballBY, 0.04, 10);

    // Visualisations
    drawArrow(ballAX, ballAY, ballAX - (state.ballA.netForce * 0.1), ballAY);
    drawArrow(ballBX, ballBY, ballBX - (state.ballB.netForce * 0.1), ballBY);

    lt = performance.now();

    requestAnimationFrame(update);
}

function init() {
    gl = document.getElementById("main").getContext("webgl2");

    if (!gl) {
        console.error("Failed to initialise WebGL 2 rendering context. Your browser may not support WebGL 2.");
        alert("Failed to initialise WebGL 2 rendering context. Your browser may not support WebGL 2.");
    }

    console.log("WebGL version: " + gl.getParameter(gl.VERSION));
    console.log("GLSL version: " + gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
    console.log("Vendor: " + gl.getParameter(gl.VENDOR));

    graphics.pointShader = twgl.createProgramInfo(
        gl, [
        document.getElementById("vertex-shader").innerHTML.trim(),
        document.getElementById("fragment-shader").innerHTML.trim()]
    );

    graphics.buffer = twgl.createBufferInfoFromArrays(gl, {
        position: { numComponents: 2, data: new Float32Array(400) }
    });

    requestAnimationFrame(update);
}

init();