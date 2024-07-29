import "./index.css"
import "./layout.css"

import $ from "jquery"

import AutomatonBoard from "./life.js"
import Life2D from "./rulespaces/life2d/main.js"
import TestRulespace from "./rulespaces/test/main.js";

var gl;
var board;
var rulespace;
var timeOfLastUpdate = 0;
var generationsPerSecond = 30;
var stepsPerIteration = 1
var iterationFailsafe = 5000
var isPlaying = true;

function render(time) {
  let update;
  let timeElapsed = time - timeOfLastUpdate

  if (timeElapsed > iterationFailsafe)
    isPlaying = false

  if (timeElapsed > (1000 / generationsPerSecond)) {
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

  if (update) {
    $("#real-iter").text(Math.round(Math.min(stepsPerIteration * (1000 / timeElapsed), generationsPerSecond)))

    for (let i = 1; i < stepsPerIteration; i++) {
      rulespace.step(gl)
      rulespace.draw(gl)
    }
  }

  requestAnimationFrame(render)
}

window.playPause = function() {
  isPlaying = !isPlaying;

  $("#step-button").prop("disabled", isPlaying)
  $("#iter-input").prop("disabled", isPlaying)
  $("#iter-failsafe").prop("disabled", isPlaying)
}

window.step = function() {
  rulespace.step(gl)
  rulespace.draw(gl)
}

window.generationRateChanged = function() {
  generationsPerSecond = $("#iter-input").val()

  if (generationsPerSecond > 60) {
    stepsPerIteration = Math.ceil(generationsPerSecond / 60)
  }
}

window.failsafeChanged = function() {
  iterationFailsafe = $("#iter-failsafe").val()
}

function main() {
  gl = $('#board-canvas')[0].getContext('webgl2');

  function initRulespace(name) {
      return {
          "Test": new TestRulespace(gl, board),
          "Life2D": new Life2D(gl, board)
      }[name]
  }

  board = new AutomatonBoard([500, 500])
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
  main()
})