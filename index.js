const canvas = $("#board-canvas")[0]
var board;
var tilemap;
var tilemapU8;
var mapTexture;

const tileDrawWidth = 32
const tileDrawHeight = 32

const vs = `
  attribute vec4 position;
  //attribute vec4 texcoord; - since position is a unit square just use it for texcoords

  uniform mat4 u_matrix;
  uniform mat4 u_texMatrix;

  varying vec2 v_texcoord;

  void main() {
    gl_Position = u_matrix * position;
    // v_texcoord = (u_texMatrix * texccord).xy;
    v_texcoord = (u_texMatrix * position).xy;
  }
`;

const fs = `
  precision highp float;

  uniform sampler2D u_tilemap;
  uniform sampler2D u_tiles;
  uniform vec2 u_tilemapSize;
  uniform vec2 u_tilesetSize;

  varying vec2 v_texcoord;

  void main() {
    vec2 tilemapCoord = floor(v_texcoord);
    vec2 texcoord = fract(v_texcoord);
    vec2 tileFoo = fract((tilemapCoord + vec2(0.5, 0.5)) / u_tilemapSize);
    vec4 tile = floor(texture2D(u_tilemap, tileFoo) * 256.0);

    float flags = tile.w;
    float xflip = step(128.0, flags);
    flags = flags - xflip * 128.0;
    float yflip = step(64.0, flags);
    flags = flags - yflip * 64.0;
    float xySwap = step(32.0, flags);
    if (xflip > 0.0) {
      texcoord = vec2(1.0 - texcoord.x, texcoord.y);
    }
    if (yflip > 0.0) {
      texcoord = vec2(texcoord.x, 1.0 - texcoord.y);
    }
    if (xySwap > 0.0) {
      texcoord = texcoord.yx;
    }

    vec2 tileCoord = (tile.xy + texcoord) / u_tilesetSize;
    vec4 color = texture2D(u_tiles, tileCoord);
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

function setupBoard(dimensions=[100, 100]) {
    board = new AutomatonBoard(dimensions)

    let tileCount = board.getCellCount()

    tilemap = new Uint32Array(tileCount)
    tilemapU8 = new Uint8Array(tilemap.buffer);

    for (let i = 0; i < tilemap.length; i++) {
        const off = i * 4;
        let cell = board.getCell(i)

        tilemapU8[off + 0] = cell.stateIndex
        tilemapU8[off + 1] = 0
        tilemapU8[off + 2] = 0
        tilemapU8[off + 3] = 0
    }

    mapTexture = twgl.createTexture(gl, {
        src: tilemapU8,
        width: dimensions[0],
        height: dimensions[1],
        minMag: gl.NEAREST,
    });
}

function renderBoard(time) {
    time *= 0.001;  // convert to seconds;

    const mat = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
    const tmat = m4.identity();

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    twgl.setUniforms(programInfo, {
        u_matrix: mat,
        u_texMatrix: tmat,
        u_tilemap: mapTexture
        //u_tilesetSize: [tilesAcross, tilesDown],
    });

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(renderBoard);
}

setupBoard()
requestAnimationFrame(renderBoard)