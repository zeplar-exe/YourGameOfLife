import "./index.css";
import "./layout.css";
import "./explorer.css"

import Life2D from "./rulespaces/life2d/main.js";

import React, { useCallback, useEffect, useLayoutEffect } from "react";
import { getFps } from "./util.js";
import PanZoom from "@sasza/react-panzoom";

function App() {
  var gl;
  var rulespace;

  const panZoomRef = React.useRef()

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

  const canvasRef = React.useRef()

  function playPause() {
    setIsPlaying(!isPlaying)
    isPlayingRef.current = !isPlayingRef.current
  }

  function step() {
    rulespace.step(gl);
    rulespace.draw(gl);
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

    if (update || rulespace.updateRequested) {
      rulespace.updateRequested = false;
      rulespace.step(gl);
    }

    if (update || rulespace.drawRequested) {
      rulespace.drawRequested = false;
      rulespace.draw(gl);
    }

    if (update) {
      setRealIterations(Math.round(Math.min(stepsPerIterationRef.current * (1000 / timeElapsed), generationsPerSecondRef.current)));

      for (let i = 1; i < stepsPerIterationRef.current; i++) {
        rulespace.step(gl);
        rulespace.draw(gl);
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

  useEffect(() => {
    if (canvasRef.current) {
        gl = canvasRef.current.getContext("webgl2")

        let board = {
            width: 500,
            height: 500,
            data: Array(500 * 500).fill(0).map(() =>
              Math.random() > 0.85 ? 0 : 1
            ),
        };

        rulespace = initRulespace("Life2D", board);
        rulespace.draw(gl);
    
        requestAnimationFrame(render);
    }
  }, [])

  return (
    <div className={"grid-container"}>
      <div className={"topbar"}>
        <button id="step-button" disabled={isPlaying} onClick={step}>Step</button>
        <button onClick={playPause}>PlayPause</button>
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