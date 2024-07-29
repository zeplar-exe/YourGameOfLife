import React from "react"

function Life2DProps() {
    const birthRule = React.useState([
        0, 0, 1, 0, 0, 0, 0, 0, 0
    ])
    const surviveRule = React.useState([
        0, 0, 1, 1, 0, 0, 0, 0, 0
    ])

    function copy() {

    }

    function paste() {

    }

    return (
        <div>
            <div>
                <button onClick={copy}>Copy Rulestring</button>
                <button onClick={paste}>Paste Rulestring</button>

                Let's copy that one COGL on the internet with the rows of buttons for each number of neighbors
            </div>
        </div>
    )
}

export default Life2DProps