/*
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
  board.setCellStateIndexByCoord([3, 3], 1)

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
*/

import "./index.css"
import $ from "jquery"

import AutomatonBoard from "./life.js"
import LifeLike2D from "./rulespaces/lifelike2d/main.js"

function render(time) {
    let update

    if (time - lastUpdate < (1000 / iterationsPerSecond)) {
        lastUpdate = time
        update = true
    }

    update = update && isPlaying

    if (update || rulespace.updateRequested) {
        rulespace.updateRequested = false
        rulespace.step()
    }

    if (update || rulespace.drawRequested) {
        rulespace.drawRequested = false
        rulespace.draw()
    }

    requestAnimationFrame(render)
}

function playPause() {
    isPlaying = !isPlaying;

    $("#step-button").prop("disabled", isPlaying)

    if (isPlaying) {
        playInterval = setInterval(step, 1000 / stepsPerSecond)
    } else {
        clearInterval(playInterval)
    }
}

function main() {
    const gl = $('#board-canvas')[0].getContext('webgl');
    var board
    var rulespace
    var lastUpdate
    var iterationsPerSecond
    var isPlaying = false;

    function initRulespace(name) {
        return {
            "LifeLike2D": new LifeLike2D(gl, board)
        }[name]
    }

    board = new AutomatonBoard([50, 50])
    board.setCellStateIndexByCoord([1, 2], 1)
    board.setCellStateIndexByCoord([2, 3], 1)
    board.setCellStateIndexByCoord([3, 1], 1)
    board.setCellStateIndexByCoord([3, 2], 1)
    board.setCellStateIndexByCoord([3, 3], 1)
    rulespace = initRulespace("LifeLike2D")

    $("#ruleset-select").select2();
    requestAnimationFrame(render)
}

$(main)