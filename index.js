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

    vec2 tileCoord = (tile.xy + texcoord) / u_tilesetSize;
    vec4 color = texture2D(u_tiles, tileCoord);
    if (color.a <= 0.1) {
      discard;
    }
    gl_FragColor = color;
  }
`;

const tileSize = 2;

const m4 = twgl.m4;
const gl = document.querySelector('#board-canvas').getContext('webgl');

var board;
var tilemapU8;
var mapTexture;

// compile shaders, link, look up locations
const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
// gl.createBuffer, bindBuffer, bufferData
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

function setupBoard(dimensions = [512, 512]) {
  gl.useProgram(programInfo.program);

  board = new AutomatonBoard(dimensions)
  board.setCellStateIndexByCoord([1, 2], 1)
  board.setCellStateIndexByCoord([2, 3], 1)
  board.setCellStateIndexByCoord([3, 1], 1)
  board.setCellStateIndexByCoord([3, 2], 1)
  board.setCellStateIndexByCoord([3, 3], 1)*

  updateTilemap()

  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = board.states.length;
  ctx.canvas.height = 1;

  for (let i = 0; i < board.states.length; i++) {
      const state = board.states[i];

      ctx.fillStyle = `rgba(${state.color.join(", ")}, 100%)`;
      ctx.fillRect(i, 0, 1, 1);
  }

  tilesetTexture = twgl.createTexture(gl, {
      src: ctx.canvas,
      width: board.states.length,
      height: 1,
      minMag: gl.NEAREST,
  });

  gl.bindTexture(gl.TEXTURE_2D, tilesetTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function updateTilemap() {
  let cellCount = board.getCellCount()
  let tilemap = new Uint32Array(cellCount)
  tilemapU8 = new Uint8Array(tilemap.buffer);

  for (let i = 0; i < cellCount; i++) {
      let cell = board.getCell(i);
      const off = i * 4;

      tilemapU8[off + 0] = cell;
  }

  mapTexture = twgl.createTexture(gl, {
    src: tilemapU8,
    width: board.dimensions[0],
    minMag: gl.NEAREST,
  });
}

// origin of scale/rotation
const originX = gl.canvas.width * 0;
const originY = gl.canvas.height * 0;

const tmat = m4.identity();
m4.scale(tmat, [
  gl.canvas.width / tileSize,
  gl.canvas.height / tileSize,
  1,
], tmat);
m4.translate(tmat, [ 
  -originX / gl.canvas.width,
  -originY / gl.canvas.height,
   0,
], tmat);

const mat = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
m4.scale(mat, [gl.canvas.width, gl.canvas.height, 1], mat);

function render(time) {
  gl.clear(gl.COLOR_BUFFER_BIT);

  twgl.setUniforms(programInfo, {
    u_matrix: mat,
    u_texMatrix: tmat,
    u_tilemap: mapTexture,
    u_tiles: tilesetTexture,
    u_tilemapSize: board.dimensions,
    u_tilesetSize: [board.states.length, 1],    
  });
  
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  
  requestAnimationFrame(render);
}

gl.useProgram(programInfo.program);
twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0, 1, 0, 1);

setupBoard()
requestAnimationFrame(render);

function step() {
  board.step()
  updateTilemap()
}

let isPlaying = false;
let stepsPerSecond = 10;
let playInterval;

function playPause() {
  isPlaying = !isPlaying;

  $("#step-button").prop("disabled", isPlaying)

  if (isPlaying) {
    playInterval = setInterval(step, 1000 / stepsPerSecond)
  } else {
    clearInterval(playInterval)
  }
}