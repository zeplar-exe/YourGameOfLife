import { parseBSRuleString } from "./rules";

import stepVertexShader from "./shaders/step.vert"
import stepFragmentShader from "./shaders/step.frag"
import drawVertexShader from "./shaders/draw.vert"
import drawFragmentShader from "./shaders/draw.frag"

export default class Life2D {
    stepShader;
    drawShader;
    positionBuffer;
    texcoordBuffer;
    fbo;
    matrix;

    positionLocation;
    texcoordLocation;

    birthTexture;
    surviveTexture;

    textureLoop = []
    loopIndex = 0

    width;
    height;

    constructor(gl, board) {
        this.stepShader = twgl.createProgramInfo(gl, [stepVertexShader, stepFragmentShader]);
        this.drawShader = twgl.createProgramInfo(gl, [drawVertexShader, drawFragmentShader]);

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

        this.positionLocation = gl.getAttribLocation(this.drawShader.program, "a_position");
        this.positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1,1,   1,1,   -1,-1,  -1,-1,  1,1,  1,-1 ]), gl.STATIC_DRAW)

        this.texcoordLocation = gl.getAttribLocation(this.drawShader.program, "a_texcoord");
        this.texcoordBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1,1,   1,1,   -1,-1,  -1,-1,  1,1,  1,-1 ]), gl.STATIC_DRAW)

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

        return texture
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
        const m4 = twgl.m4
        const matrix = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
        m4.scale(matrix, [gl.canvas.width, gl.canvas.height, 1], matrix);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 1, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.drawShader.program);

        gl.enableVertexAttribArray(this.positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(this.texcoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer)
        gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 0, 0);

        twgl.setUniforms(this.drawShader.program, {
            u_matrix: matrix,
            u_texture: this.textureLoop[this.loopIndex],
            u_gridSize: [this.width, this.height]
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