const canvas = $("#board-canvas")[0]
var board;
var tilemap;
var tilemapU8;
var mapTexture;
var tilesetTexture;

var vbo;
var vao;

const vertexShader = `
#version 300 es

precision highp float;

uniform mat4 u_matrix;
uniform ivec2 u_mapSize;

layout (location = 0) in uint aTileId;

flat out uint tileId;

void main()
{
    int i = gl_VertexID;
    float x = float(i / u_mapSize.y); //float(i & 15);
    float y = float(i % u_mapSize.y); //float((i >> 4) & 15);
    gl_Position = vec4(x, y, 0, 1);
    
    tileId = aTileId;
}`
const geometryShader = `
#version 300 es

precision highp float;

uniform mat4 u_matrix;

flat in uint tileId;
out vec2 texCoord;

layout (points) in;
layout (triangle_strip, max_vertices = 4) out;

void main() {
    // uint tileId = gs_in[0].tileId & 255u;
    float tileX = float(tileId & 15u);
    float tileY = 0.0;

    const float B = 1.0 / 256.0;
    const float S = 1.0 / 16.0;

    gl_Position = u_matrix * gl_Position;
    texCoord = vec2(tileX + B, tileY + B);
    EmitVertex();

    gl_Position = u_matrix * (gl_Position + vec4(1.0, 0.0, 0.0, 0.0));
    texCoord = vec2(tileX + S - B, tileY + B);
    EmitVertex();

    gl_Position = u_matrix * (gl_Position + vec4(0.0, 1.0, 0.0, 0.0));
    texCoord = vec2(tileX + B, tileY + S - B);
    EmitVertex();

    gl_Position = u_matrix * (gl_Position + vec4(1.0, 1.0, 0.0, 0.0));
    texCoord = vec2(tileX + S - B, tileY + S - B);
    EmitVertex();

    EndPrimitive();
}`
const fragmentShader = `
#version 300 es

precision highp float;

uniform sampler2D texture0;
flat in vec2 texCoord;
flat out vec4 FragColor;

void main()
{
    FragColor = texture(texture0, texCoord);
}`

const m4 = twgl.m4;
const gl = canvas.getContext('webgl2');

const programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);

const geometryShaderHandle = gl.createShader(gl.GEOMETRY_SHADER);
gl.shaderSource(geometryShaderHandle, geometryShader);
gl.compileShader(geometryShaderHandle);
gl.attachShader(programInfo.program, geometryShaderHandle)

function setupBoard(dimensions = [10, 10]) {
    board = new AutomatonBoard(dimensions)
    board.setCellStateIndex(0, 1)
    board.setCellStateIndex(1, 1)
    board.setCellStateIndex(2, 1)

    let tileCount = board.getCellCount()

    tilemap = new Uint32Array(tileCount)
    tilemapU8 = new Uint8Array(tilemap.buffer);

    for (let i = 0; i < tilemap.length; i++) {
        let cell = board.getCell(i)

        tilemapU8[i * 4 + 0] = cell.stateIndex
        tilemapU8[i * 4 + 1] = 0
        tilemapU8[i * 4 + 2] = 0
        tilemapU8[i * 4 + 3] = 0
    }

    mapTexture = twgl.createTexture(gl, {
        src: tilemapU8,
        width: dimensions[0],
        height: dimensions[1],
        minMag: gl.NEAREST,
    });

    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = board.states.length;
    ctx.canvas.height = 1;

    for (let i = 0; i < board.states.length; i++) {
        const state = board.states[i]

        ctx.fillStyle = `rgba(${state.color.join(", ")}, 100%)`
        ctx.fillRect(i, 0, 1, 1)
    }

    tilesetTexture = twgl.createTexture(gl, {
        src: ctx.canvas,
        minMag: gl.NEAREST,
    });

    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, board.board, gl.STATIC_DRAW, 0)

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribIPointer(0, 1, gl.UNSIGNED_BYTE, true, 0)
}

function renderBoard(time) {
    time *= 0.001;  // convert to seconds;

    gl.bindTexture(gl.TEXTURE_2D, tilesetTexture)
    gl.bindVertexArray(vao)

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const mat = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
    m4.scale(mat, [32, 32, 1], mat);

    twgl.setUniforms(programInfo, {
        u_matrix: mat,
        u_mapSize: board.dimensions
    });

    gl.useProgram(programInfo.program);
    gl.drawArrays(gl.POINTS, 0, board.getCellCount())

    requestAnimationFrame(renderBoard);
}

setupBoard()
requestAnimationFrame(renderBoard)