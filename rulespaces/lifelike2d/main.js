var stepShader;
var drawShader;
var fbo;

const textureLoop = []
let loopIndex = 0

function setup(gl, board) {
    // setup gl
    $.get("shaders/step.vert", vert => {
        $.get("shaders/step.frag", frag => {
            stepShader = twgl.createProgramInfo(gl, [vert, frag]);
        })
    })

    $.get("shaders/draw.vert", vert => {
        $.get("shaders/draw.frag", frag => {
            drawShader = twgl.createProgramInfo(gl, [vert, frag]);
        })
    })

    for (let i = 0; i < textureLoop.length; i++) {
        textureLoop[i] = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, currentTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, board.dimensions[0], board.dimensions[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, 
            [/*where data?*/]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }

    fbo = gl.createFrameBuffer();
}

function step(gl) {
    const current = textureLoop[loopIndex];
    const next = textureLoop[(loopIndex + 1) % textureLoop.length];

    gl.useProgram(stepShader.program)
    bindUniformsAndAttributes

    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    loopIndex = (this._currentIndex + 1) % textureLoop.length;
}

function draw(gl) {
    twgl.setUniforms(programInfo, {
        uMatrix: mat,
        uTilemap: textureLoop[loopIndex]    
    });

    shader.use();
    shader.bindUniformsAndAttributes();

    gl.enable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}