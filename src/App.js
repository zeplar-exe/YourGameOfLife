import "./index.css";
import "./layout.css";
import "./explorer.css"

import Life2D from "./rulespaces/life2d/main.js";

import React, { useCallback, useEffect, useLayoutEffect } from "react";
import { getFps } from "./util.js";
import PanZoom from "@sasza/react-panzoom";

function App() {
  var gl;

  const panZoomRef = React.useRef()
  const rulespaceRef = React.useRef()

  const isPlayingRef = React.useRef(true)
  const timeOfLastUpdateRef = React.useRef(0)
  const stepsPerIterationRef = React.useRef(1)
  const generationsPerSecondRef = React.useRef(5)
  const iterationFailsafeRef = React.useRef(5000)
  const refreshRateRef = React.useRef(60)

  getFps().then(fps => refreshRateRef.current = fps)

  const [isPlaying, setIsPlaying] = React.useState(true)
  const [realIterations, setRealIterations] = React.useState(0)
  const [generations, setGenerations] = React.useState(0)

  const [randomness, setRandomness] = React.useState(0.75)
  const [boardSize, setBoardSize] = React.useState([500, 500])

  const canvasRef = React.useRef()

  function playPause() {
    setIsPlaying(!isPlaying)
    isPlayingRef.current = !isPlayingRef.current
  }

  function step() {
    rulespaceRef.current.step(gl);
    rulespaceRef.current.draw(gl);
  }

  function generationRateChanged(e) {
    generationsPerSecondRef.current = Math.min(0, e.target.value)

    if (generationsPerSecondRef.current > refreshRateRef.current) {
        stepsPerIterationRef.current = Math.ceil(generationsPerSecondRef.current / refreshRateRef.current);
    }
  }

  function failsafeChanged(e) {
    iterationFailsafeRef.current = Math.min(1000, e.target.value);
  }

  function render(time) {
    let update;
    let timeElapsed = time - timeOfLastUpdateRef.current;

    if (timeElapsed > iterationFailsafeRef.current)
        playPause()

    if (timeElapsed > 1000 / generationsPerSecondRef.current) {
      timeOfLastUpdateRef.current = time;
      update = true;
    }

    update = update && isPlayingRef.current;

    if (update || rulespaceRef.current.updateRequested) {
      rulespaceRef.current.updateRequested = false;
      rulespaceRef.current.step(gl);
    }

    if (update || rulespaceRef.current.drawRequested) {
      rulespaceRef.current.drawRequested = false;
      rulespaceRef.current.draw(gl);
    }

    if (update) {
      setRealIterations(Math.round(Math.min(stepsPerIterationRef.current * (1000 / timeElapsed), generationsPerSecondRef.current)));

      for (let i = 1; i < stepsPerIterationRef.current; i++) {
        rulespaceRef.current.step(gl);
        rulespaceRef.current.draw(gl);
      }

      setGenerations(generations + stepsPerIterationRef.current)
    }

    requestAnimationFrame(render);
  }

  function initRulespace(name, board) {
    let c = {
      Life2D: Life2D,
    }[name];

    return new c(gl, board)
  }

  function startGame() {
    let already = !!gl
    gl = canvasRef.current.getContext("webgl2")

    let board = {
        width: boardSize[0],
        height: boardSize[1],
        data: Array(boardSize[0] * boardSize[1]),
    };

    for (let i = 0; i < board.width * board.height; i++) {
      board.data[i] = Math.random() > randomness ? 0 : 1
    }

    rulespaceRef.current = initRulespace("Life2D", board);
    rulespaceRef.current.draw(gl);

    if (!already)
      requestAnimationFrame(render);
  }

  useEffect(() => {
    console.log("ef")
    if (canvasRef.current) {
        console.log("can")
        startGame()
    }
  }, [])

  return (
    <div className={"grid-container"}>
      <div className={"topbar"}>
        <button id="step-button" disabled={isPlaying} onClick={step}>Step</button>
        <button onClick={playPause}>PlayPause</button>
        <button onClick={startGame}>Restart</button>
        <div id="title-input-container">
          <input
            id="title-input"
            type="text"
            defaultValue="Your Game of Life"
            onChange={(e) => document.title = e.target.value}
          ></input>
        </div>
        <label htmlFor="iter-input">Maximum Generations/Second</label>
        <input
          id="iter-input"
          type="number"
          step="1"
          min="1"
          disabled={isPlaying}
          defaultValue={generationsPerSecondRef.current}
          onChange={generationRateChanged}
        ></input>
        <span id="real-iter">Real Generaions/Second: {realIterations}</span>
        <span>Generations: {generations}</span>
        <label htmlFor="iter-failsafe">Iteration Failsafe</label>
        <input
          id="iter-failsafe"
          type="number"
          step="1"
          min="1"
          disabled={isPlaying}
          defaultValue={iterationFailsafeRef.current}
          onChange={failsafeChanged}
        ></input>
        <span>Refresh Rate: {refreshRateRef.current}</span>
        <br/>
        <label for="rand">Initial Randomness</label>
        <input name="rand" defaultValue={randomness} onChange={(e) => { setRandomness(parseFloat(e.target.value)) }}></input>
      </div>
      <div className={"main"}>
      <PanZoom ref={panZoomRef}>
        <canvas id="board-canvas" ref={canvasRef} width={1000} height={1000}></canvas>
      </PanZoom>
      </div>
      <div className={"sidebar-left"}>
        <div id="rulset-explorer">
            <select id="ruleset-select">
            <option value="LifeLike2D">Lifelike 2D</option>
            </select>
            <div id="rulset-explorer-view"></div>
        </div>
      </div>
      <div className={"sidebar-right"}></div>
    </div>
  );
}

export default App