import { parseBSRuleString } from "./rules";

import stepVertexShader from "./shaders/step.vert"
import stepFragmentShader from "./shaders/step.frag"
import drawVertexShader from "./shaders/draw.vert"
import drawFragmentShader from "./shaders/draw.frag"

export default class Life2D {
    stepShader;
    drawShader;
    vertexBuffer;
    texcoordBuffer;
    fbo;
    matrix;

    positionLocation;
    texcoordLocation;

    birthTexture;
    surviveTexture;

    gridTexture

    width;
    height;

    constructor(gl, board) {
        this.stepShader = twgl.createProgramInfo(gl, [stepVertexShader, stepFragmentShader]);
        this.drawShader = twgl.createProgramInfo(gl, [drawVertexShader, drawFragmentShader]);

        let data = new Uint8Array(board.dimensions[0] * board.dimensions[1] * 4)

        for (let i = 0; i < board.data.length; i++) {
            data[i * 4] = board.data[i]
            data[i * 4 + 1] = 0
            data[i * 4 + 2] = 0
            data[i * 4 + 3] = 0
        }
    
        this.gridTexture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, this.gridTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, board.dimensions[0], board.dimensions[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        gl.bindTexture(gl.TEXTURE_2D, null)
    
        this.fbo = gl.createFramebuffer()

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.gridTexture, 0);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error("Framebuffer is not complete");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        this.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1,1,   1,1,   -1,-1,  -1,-1,  1,1,  1,-1 ]), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        this.texcoordBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1,1,   1,1,   -1,-1,  -1,-1,  1,1,  1,-1 ]), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        this.positionLocation = gl.getAttribLocation(this.drawShader.program, "aPosition");
        this.texcoordLocation = gl.getAttribLocation(this.drawShader.program, "aTexcoord");

        this.width = board.dimensions[0]
        this.height = board.dimensions[1]

        this.birthTexture = this.createRuleTexture(gl, [0, 0, 0, 1, 0, 0, 0, 0, 0])
        this.surviveTexture = this.createRuleTexture(gl, [0, 0, 1, 1, 0, 0, 0, 0, 0])
    }

    createRuleTexture(gl, rule) {
        let texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture);

        let textureData = []

        rule.forEach(r => {
            textureData.push(...[r, r, r, r])
        });

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 9, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(textureData))

        gl.bindTexture(gl.TEXTURE_2D, null)

        return texture
    }
    
    step(gl) {
        let current = 0

        gl.useProgram(this.stepShader.program)

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.gridTexture, 0)

        twgl.setUniforms(this.stepShader.program, {
            uMatrix: this.matrix,
            uGrid: current,
            uPhysicalCellSize: [1 / this.width, 1 / this.height],
            uBirth: this.birthTexture,
            uSurvive: this.surviveTexture
        });

        gl.disable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
    
    draw(gl) {
        const m4 = twgl.m4
        const matrix = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
        m4.scale(matrix, [gl.canvas.width, gl.canvas.height, 1], matrix);

        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 1, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.drawShader.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer)

        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(this.texcoordLocation);
        gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.gridTexture)

        twgl.setUniforms(this.drawShader.program, {
            uMatrix: matrix,
            uTexture: this.gridTexture,
            uGridSize: [this.width, this.height]
        });
    
        gl.enable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    dispose(gl) {
        for (let i = 0; i < this.textureLoop.length; i++) {
            gl.deleteTexture(this.textureLoop[i])
        }

        gl.deleteBuffer(this.positionBuffer)
        gl.deleteFrameBuffer(this.fbo)
        gl.deleteProgram(this.drawShader.program)
        gl.deleteProgram(this.stepShader.program)
    }
}