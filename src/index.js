import "./index.css"
import $ from "jquery"

import AutomatonBoard from "./life.js"
import Life2D from "./rulespaces/life2d/main.js"
import TestRulespace from "./rulespaces/test/main.js";

var gl;
var board;
var rulespace;
var timeOfLastUpdate = 0;
var iterationsPerSecond = 1;
var isPlaying = true;

function render(time) {
  let update;

  if ((time - timeOfLastUpdate) > (1000 / iterationsPerSecond)) {
      timeOfLastUpdate = time
      update = true
  }

  update = update && isPlaying

  if (update || rulespace.updateRequested) {
      rulespace.updateRequested = false
      rulespace.step(gl)
  }

  if (update || rulespace.drawRequested) {
      rulespace.drawRequested = false
      rulespace.draw(gl)
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
  gl = $('#board-canvas')[0].getContext('webgl2');

  function initRulespace(name) {
      return {
          "Test": new TestRulespace(gl, board),
          "Life2D": new Life2D(gl, board)
      }[name]
  }

  board = new AutomatonBoard([10, 10])
  board.setCellStateIndexByCoord([1, 2], 1)
  board.setCellStateIndexByCoord([2, 3], 1)
  board.setCellStateIndexByCoord([3, 1], 1)
  board.setCellStateIndexByCoord([3, 2], 1)
  board.setCellStateIndexByCoord([3, 3], 1)
  rulespace = initRulespace("Test")

  rulespace.draw(gl)

  requestAnimationFrame(render)
}

$(() => {
  //$('.select2-enable').select2();
  //$("#ruleset-select").select2();
  
  main()
})