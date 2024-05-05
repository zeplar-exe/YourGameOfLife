export default class AutomatonBoard {
    dimensions;
    data;

    constructor(dimensions) {
        if (dimensions.length == 0)
            throw new Error("AutomatonBoard dimension must be greater than 0.");
        if (!dimensions.every(d => Number.isInteger(d) && d >= 0))
            throw new Error("Dimension metrics must be provided as integers larger than or equal to 0.")

        this.dimensions = dimensions;
        this.data = new Uint8Array(this.getCellCount()).fill(0);
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
        return this.data[i];
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
        this.data[i] = stateIndex;
    }

    setCellStateIndexByCoord(coordinate, stateIndex) {
        this.data[this.ravelCoordinate(coordinate)] = stateIndex;
    }
}