import $ from "jquery"

import { parseBSRuleString } from "./rules";

import stepVertexShader from "./shaders/step.vert"
import stepFragmentShader from "./shaders/step.frag"
import drawVertexShader from "./shaders/draw.vert"
import drawFragmentShader from "./shaders/draw.frag"

export default class LifeLike2D {
    stepShader;
    drawShader;
    fbo;

    textureLoop = []
    loopIndex = 0

    width;
    height;

    constructor(gl, board) {
        // setup gl
        this.stepShader = twgl.createProgramInfo(gl, [stepVertexShader, stepFragmentShader]);
        this.drawShader = twgl.createProgramInfo(gl, [drawVertexShader, drawFragmentShader]);
    
        for (let i = 0; i < this.textureLoop.length; i++) {
            this.textureLoop[i] = gl.createTexture();
    
            gl.bindTexture(gl.TEXTURE_2D, currentTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, board.dimensions[0], board.dimensions[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, 
                [/*where data?*/]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        }
    
        this.fbo = gl.createFramebuffer();
        gl.bindFrameBuffer(gl.FRAMEBUFFER, this.fbo)

        this.width = board.dimensions[0]
        this.height = board.dimensions[1]
    }
    
    step(gl) {
        const current = this.textureLoop[this.loopIndex];
        const next = this.textureLoop[(this.loopIndex + 1) % this.textureLoop.length];

        gl.bindFrameBuffer(gl.FRAMEBUFFER, this.fbo)
        gl.viewport(0, 0, this.width, this.height)

        gl.framebufferTexture2D(gl.FRAMEBUFFER, g.COLOR_ATTACHMENT0, gl.TEXTURE_2D, next, 0)
    
        twgl.setUniforms(stepShader.program, {
            uMatrix: mat,
            uPrevious: current,
            uCellSize: [2, 2]
        });
    
        gl.useProgram(this.stepShader.program)
    
        gl.disable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
        loopIndex = (this.loopIndex + 1) % this.textureLoop.length;
    }
    
    draw(gl) {
        twgl.setUniforms(drawShader.program, {
            uMatrix: mat,
            uTexture: textureLoop[loopIndex]    
        });
    
        drawShader.use();
    
        gl.enable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    dispose(gl) {
        for (let i = 0; i < this.textureLoop.length; i++) {
            gl.deleteTexture(this.textureLoop[i])
        }

        gl.deleteFrameBuffer(this.fbo)
        gl.deleteProgram(this.drawShader.program)
        gl.deleteProgram(this.stepShader.program)
    }
}