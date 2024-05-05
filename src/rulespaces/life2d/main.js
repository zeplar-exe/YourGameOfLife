import { parseBSRuleString } from "./rules";

import stepVertexShader from "./shaders/step.vert"
import stepFragmentShader from "./shaders/step.frag"
import drawVertexShader from "./shaders/draw.vert"
import drawFragmentShader from "./shaders/draw.frag"

export default class Life2D {
    stepShader;
    drawShader;
    vbo;
    fbo;
    matrix;

    birthTexture;
    surviveTexture;

    textureLoop = []
    loopIndex = 0

    width;
    height;

    constructor(gl, board) {
        // setup gl
        const m4 = twgl.m4;

        this.stepShader = twgl.createProgramInfo(gl, [stepVertexShader, stepFragmentShader]);
        this.drawShader = twgl.createProgramInfo(gl, [drawVertexShader, drawFragmentShader]);
        this.matrix = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
        m4.scale(this.matrix, [gl.canvas.width, gl.canvas.height, 1], this.matrix);

        this.textureLoop = [null, null]

        let data = new Uint8Array(board.dimensions[0] * board.dimensions[1] * 4)

        for (let i = 0; i < board.data.length; i++) {
            data[i * 4] = board.data[i]
            data[i * 4 + 1] = 0
            data[i * 4 + 2] = 0
            data[i * 4 + 3] = 0
        }
    
        for (let i = 0; i < this.textureLoop.length; i++) {
            this.textureLoop[i] = gl.createTexture();
            
            gl.bindTexture(gl.TEXTURE_2D, this.textureLoop[i]);
           
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, board.dimensions[0], board.dimensions[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        }
    
        this.fbo = gl.createFramebuffer()
        this.vbo = gl.createBuffer()

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
        gl.bufferData(gl.ARRAY_BUFFER, [ -1,-1,   -1,-1,   1,-1,  1,-1,  -1,1,  1, 1 ], gl.STATIC_DRAW)

        this.width = board.dimensions[0]
        this.height = board.dimensions[1]

        this.birthTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, this.birthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 9, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([
            0, 0, 0, 0, 
            0, 0, 0, 0, 
            0, 0, 0, 0, 
            1, 1, 1, 1,
            0, 0, 0, 0, 
            0, 0, 0, 0, 
            0, 0, 0, 0, 
            0, 0, 0, 0, 
            0, 0, 0, 0
        ]))

        this.surviveTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, this.birthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 9, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([
            0, 0, 0, 0, 
            0, 0, 0, 0, 
            1, 1, 1, 1, 
            1, 1, 1, 1,
            0, 0, 0, 0, 
            0, 0, 0, 0, 
            0, 0, 0, 0, 
            0, 0, 0, 0, 
            0, 0, 0, 0
        ]))
    }
    
    step(gl) {
        const current = this.textureLoop[this.loopIndex];
        const next = this.textureLoop[(this.loopIndex + 1) % this.textureLoop.length];
    
        gl.useProgram(this.stepShader.program)

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, next, 0)

        twgl.setUniforms(this.stepShader.program, {
            uMatrix: this.matrix,
            uPrevious: current,
            uPhysicalCellSize: [1 / this.width, 1 / this.height],
            uBirth: this.birthTexture,
            uSurvive: this.surviveTexture
        });

        gl.disable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        this.loopIndex = (this.loopIndex + 1) % this.textureLoop.length;
    }
    
    draw(gl) {
        gl.useProgram(this.drawShader.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)

        gl.clearColor(0, 1, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        twgl.setUniforms(this.drawShader.program, {
            uMatrix: this.matrix,
            uTexture: this.textureLoop[this.loopIndex]    
        });
    
        gl.enable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    dispose(gl) {
        for (let i = 0; i < this.textureLoop.length; i++) {
            gl.deleteTexture(this.textureLoop[i])
        }

        gl.deleteBuffer(this.vbo)
        gl.deleteFrameBuffer(this.fbo)
        gl.deleteProgram(this.drawShader.program)
        gl.deleteProgram(this.stepShader.program)
    }
}