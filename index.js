const canvas = $("#board-canvas")[0]
var board;
var tilemap;
var tilemapU8;
var mapTexture;
var tileTexture;

const vs = `
  attribute vec4 position;
  //attribute vec4 texcoord; - since position is a unit square just use it for texcoords

  uniform mat4 u_matrix;
  uniform mat4 u_texMatrix;

  varying vec2 v_texcoord;

  void main() {
    gl_Position = u_matrix * position;
    v_texcoord = (u_texMatrix * position).xy;
  }
`;

const fs = `
  precision highp float;

  uniform sampler2D u_tilemap;
  uniform sampler2D u_tileset;
  uniform vec2 u_tilemapSize;
  uniform vec2 u_tilesetSize;

  varying vec2 v_texcoord;

  void main() {
    vec2 tilemapCoord = floor(v_texcoord);
    vec2 texcoord = fract(v_texcoord);
    vec2 tileFoo = fract((tilemapCoord + vec2(0.5, 0.5)) / u_tilemapSize);
    vec4 tile = floor(texture2D(u_tilemap, tileFoo) * 256.0);

    //vec2 tileCoord = (tile.xy + texcoord) / u_tilesetSize;
    vec4 color = texture2D(u_tileset, vec2(1, 0)); //texture2D(u_tileset, tileCoord);

    if (color.a <= 0.1) {
      discard;
    }

    gl_FragColor = color;
  }
`;

const m4 = twgl.m4;
const gl = canvas.getContext('webgl');

const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    position: {
        numComponents: 2,
        data: [
            0, 0,
            1, 0,
            0, 1,

            0, 1,
            1, 0,
            1, 1,
        ],
    },
});

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

    tileTexture = twgl.createTexture(gl, {
        src: ctx.canvas,
        minMag: gl.NEAREST,
    });
}

function renderBoard(time) {
    time *= 0.001;  // convert to seconds;

    const mat = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
    m4.scale(mat, [gl.canvas.width, gl.canvas.height, 1], mat);

    const tmat = m4.identity();

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    twgl.setUniforms(programInfo, {
        u_matrix: mat,
        u_texMatrix: tmat,
        u_tilemap: mapTexture,
        u_tileset: tileTexture,
        u_tilemapSize: board.dimensions,
        u_tilesetSize: [ board.states.length, 1 ]
    });

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(renderBoard);
}

setupBoard()
requestAnimationFrame(renderBoard)