import { parseBSRuleString } from "./rules";

import stepVertexShader from "./shaders/step.vert"
import stepFragmentShader from "./shaders/step.frag"
import drawVertexShader from "./shaders/draw.vert"
import drawFragmentShader from "./shaders/draw.frag"

export default class TestRulespace {
    matrix;
    width;
    height;

    stepShader;
    drawShader;

    vertexBuffer;
    indexBuffer;
    texcoordBuffer;

    birthTexture;
    surviveTexture;

    stepPositionAttributeLocation;
    stepTexcoordAttributeLocation;
    stepTextureUniformLocation;
    stepTextureSizeUniformLocation;
    stepBirthUniformLocation;
    stepSurviveUniformLocation;

    drawPositionAttributeLocation;
    drawTexcoordAttributeLocation;
    drawMatrixUniformLocation;
    drawTextureUniformLocation;

    framebuffers;
    textures;
    pong;

    createFbo(gl, width, height, data) {
        let fbo = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)

        let texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        
        return [ fbo, texture ]
    }

    constructor(gl, board) {
        this.width = board.dimensions[0]
        this.height = board.dimensions[1]

        this.matrix = twgl.m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

        this.stepShader = twgl.createProgramInfo(gl, [stepVertexShader, stepFragmentShader]);
        this.drawShader = twgl.createProgramInfo(gl, [drawVertexShader, drawFragmentShader]);

        let data = new Uint8Array(this.width * this.height * 4)

        for (let i = 0; i < board.data.length; i++) {
            let n = 0

            if ((Math.random() > 0.95)) {
                n = 255
            }

            data[i * 4] = n
            data[i * 4 + 1] = n
            data[i * 4 + 2] = n
            data[i * 4 + 3] = 255
        }

        let [fbo1, tex1] = this.createFbo(gl, this.width, this.height, data)
        let [fbo2, tex2] = this.createFbo(gl, this.width, this.height, data)

        this.framebuffers = [fbo1, fbo2]
        this.textures = [tex1, tex2]

        this.pong = true
        
        this.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1.0,  1.0, 1.0,  1.0, -1.0, -1.0, 1.0, -1.0 ]), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        this.indexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([ 0, 1, 2, 1, 2, 3 ]), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

        this.texcoordBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0 ]), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        this.stepPositionAttributeLocation = gl.getAttribLocation(this.stepShader.program, "aPosition");
        this.stepTexcoordAttributeLocation = gl.getAttribLocation(this.stepShader.program, "aTexcoord");
        this.stepTextureUniformLocation = gl.getUniformLocation(this.stepShader.program, "uTexture")
        this.stepTextureSizeUniformLocation = gl.getUniformLocation(this.stepShader.program, "uTextureSize")
        this.stepBirthUniformLocation = gl.getUniformLocation(this.stepShader.program, "uBirth")
        this.stepSurviveUniformLocation = gl.getUniformLocation(this.stepShader.program, "uSurvive")

        this.drawPositionAttributeLocation = gl.getAttribLocation(this.drawShader.program, "aPosition");
        this.drawTexcoordAttributeLocation = gl.getAttribLocation(this.drawShader.program, "aTexcoord");
        this.drawTextureUniformLocation = gl.getUniformLocation(this.drawShader.program, "uTexture")

        this.birthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.birthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 9, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
            new Uint8Array([
                0, 0, 0, 0, 
                0, 0, 0, 0, 
                255, 255, 255, 255,
                0, 0, 0, 0, 
                0, 0, 0, 0, 
                0, 0, 0, 0, 
                0, 0, 0, 0, 
                0, 0, 0, 0, 
                0, 0, 0, 0, 
            ]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null)

        this.surviveTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.surviveTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 9, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
            new Uint8Array([
                0, 0, 0, 0, 
                0, 0, 0, 0, 
                255, 255, 255, 255,
                255, 255, 255, 255,
                0, 0, 0, 0, 
                0, 0, 0, 0, 
                0, 0, 0, 0, 
                0, 0, 0, 0, 
                0, 0, 0, 0, 
            ]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null)
    }
    
    step(gl) {
        const readTexture = this.textures[this.pong ? 0 : 1];
        const writeFramebuffer = this.framebuffers[this.pong ? 1 : 0];

        gl.clearColor(0, 0, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, writeFramebuffer);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.vertexAttribPointer(this.stepPositionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.stepPositionAttributeLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer)
        gl.vertexAttribPointer(this.stepTexcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.stepTexcoordAttributeLocation);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)

        gl.viewport(0, 0, this.width, this.height)
        gl.useProgram(this.stepShader.program);

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, readTexture)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.birthTexture)
        gl.activeTexture(gl.TEXTURE2)
        gl.bindTexture(gl.TEXTURE_2D, this.surviveTexture)

        gl.uniform1i(this.stepTextureUniformLocation, 0)
        gl.uniform2f(this.stepTextureSizeUniformLocation, this.width, this.height)
        gl.uniform1i(this.stepBirthUniformLocation, 1)
        gl.uniform1i(this.stepSurviveUniformLocation, 2)
    
        gl.enable(gl.BLEND);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
    
    draw(gl) {
        const readTexture = this.textures[this.pong ? 1 : 0];

        gl.clearColor(0, 0, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.vertexAttribPointer(this.drawPositionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.drawPositionAttributeLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer)
        gl.vertexAttribPointer(this.drawTexcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.drawTexcoordAttributeLocation);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        gl.useProgram(this.drawShader.program);

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, readTexture)

        gl.uniform1i(this.drawTextureUniformLocation, 0)
    
        gl.enable(gl.BLEND);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        
        this.pong = !this.pong
    }

    dispose(gl) {
        for (let i = 0; i < this.textureLoop.length; i++) {
            gl.deleteTexture(this.textureLoop[i])
        }

        gl.deleteBuffer(this.positionBuffer)
        gl.deleteBuffer(this.texcoordBuffer)
        gl.deleteBuffer(this.indexBuffer)
        gl.deleteFrameBuffer(this.fbo)
        gl.deleteProgram(this.drawShader.program)
        gl.deleteProgram(this.stepShader.program)
    }
}