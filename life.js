function coordinateSum(a, b) {
    return a.map((e, i) => e + b[i]);
}

function radiusCoordinates(dimCount, radius) {
    function recurse(dims, idx, radius) {
        let results = [];
        
        for (let n = -radius; n <= radius; n++) {
            let comb = dims.slice();
            comb[idx] = n;
    
            if (idx + 1 < dims.length)
                results = results.concat(recurse(comb, idx + 1, radius));
            else if (!comb.every(i => i === 0))
                results.push(comb);
        }
        
        return results;
    }
    
    return recurse(Array(dimCount).fill(0), 0, radius)
}

class AutomatonBoard {
    dimensions;
    board;
    rules;
    states;
    computedRadiusCoordinates;

    constructor(dimensions, rules=PresetAutomatonRules.Conway, states=PresetCellStates.Conway) {
        if (dimensions.length == 0)
            throw new Error("AutomatonBoard dimension must be greater than 0.");
        if (!dimensions.every(d => Number.isInteger(d) && d >= 0))
            throw new Error("Dimension metrics must be provided as integers larger than or equal to 0.")

        this.dimensions = dimensions;
        this.computedRadiusCoordinates = radiusCoordinates(this.dimensions.length, 1)
        this.board = new Uint8Array(this.getCellCount()).fill(0);

        this.rules = rules;
        this.states = states;
    }

    unravelIndex(index) {
        let coordinate = []

        this.dimensions.reverse().forEach(d => {
            coordinate.push(index % d)
            index = Math.floor(index / d)
        })

        return coordinate
    }

    ravelCoordinate(coordinate) {
        let i = 0

        for (let idx = 0; idx < this.dimensions.length; idx++) {
            let n = coordinate[idx]

            i += n * Math.pow(this.dimensions[idx], idx)
        }

        return i
    }

    getCellCount() {
        return this.dimensions.reduce((acc, val) => acc * val, 1)
    }

    getCell(i) {
        return this.board[i];
    }

    getCellByCoord(coordinate) {
        return this.getCell(this.ravelCoordinate(coordinate));
    }

    getCellState(i) {
        return this.states[this.getCell(i)];
    }

    getCellStateByCoord(coordinate) {
        return this.states[this.getCell(this.ravelCoordinate(coordinate))];
    }

    setCellStateIndex(i, stateIndex) {
        this.board[i] = stateIndex;
    }

    setCellStateIndexByCoord(coordinate, stateIndex) {
        this.board[this.ravelCoordinate(coordinate)] = stateIndex;
    }

    getCellStateNextStep(i) {
        let initialState = this.getCell(i);

        for (const rule of this.rules.filter(r => r.initialState === initialState)) {
            let coordinate = this.unravelIndex(i);
            
            if (rule.neighborCriteria.every(c => c.test(this, coordinate)))
                return rule.finalState;
        }

        return initialState
    }

    getCellStateNextStepByCoord(coordinate) {
        return this.getCellStateNextStep(this.ravelCoordinate(coordinate));
    }

    dryStep() {
        let boardLength = this.board.length;
        let newBoard = Array(boardLength);
        
        for (let i = 0; i < boardLength; i++) {
            newBoard[i] = this.getCellStateNextStep(i);
        }

        return newBoard;
    }

    step() {
        this.board = this.dryStep();
    }
}

class AutomatonCellState {
    color;

    constructor(color) {
        this.color = color;
    }
}

class AutomatonRule {
    initialState;
    neighborCriteria;
    finalState;

    constructor(initialState, neighborCriteria, finalState) {
        this.initialState = initialState;
        this.neighborCriteria = neighborCriteria;
        this.finalState = finalState;
    }
}

class AutomatonNeighborExactCritera {
    relativePosition;
    stateIndex;

    constructor(relativePosition, stateIndex) {
        this.relativePosition = relativePosition;
        this.stateIndex = stateIndex;
    }

    test(board, targetCellCoordinate) {
        let testCoordinate = coordinateSum(targetCellCoordinate, criteria.relativePosition)
        let targetCell = board.getCellByCoord(testCoordinate)

        if (targetCell === criteria.stateIndex)
            return true
    }
}

class AutomatonNeighborCountCritera {
    countPredicate;
    stateIndex;

    constructor(countPredicate, stateIndex) {
        this.countPredicate = countPredicate;
        this.stateIndex = stateIndex;
    }

    test(board, targetCellCoordinate) {
        let coordinates = board.computedRadiusCoordinates.map(c => coordinateSum(c, targetCellCoordinate))
        let neighborCount = coordinates.filter(coord => board.getCellByCoord(coord) === this.stateIndex).length;

        return this.countPredicate(neighborCount);
    }
}

PresetCellStates = {
    "Conway": [ 
        new AutomatonCellState([0, 0, 0]), // Index 0: Dead
        new AutomatonCellState([255, 255, 255]) // Index 1: Alive
    ]
};

PresetAutomatonRules = {
    "Conway": [
        new AutomatonRule(
            1, // Is alive
            [ 
                new AutomatonNeighborCountCritera(count => count < 2, 1), // Less than 2 neighbors with state 1 (live)
            ], 
            0), // Die by underpopulation
        
        new AutomatonRule(
            1, // Is alive
            [ 
                new AutomatonNeighborCountCritera(count => count === 2 || count === 3, 1), // 2 OR 3 neighbors with state 1 (live)
            ], 
            1), // Stay alive

        new AutomatonRule(
            1, // Is alive
            [ 
                new AutomatonNeighborCountCritera(count => count > 3, 1), // More than 3 neighbors with state 1 (live)
            ], 
            0), // Die by overpopulation

        new AutomatonRule(
            0, // Is dead
            [ 
                new AutomatonNeighborCountCritera(count => count === 3, 1), // Exactly 3 neighbors with state 1 (live)
            ], 
            1), // Bring alive by reproduction
    ]
};