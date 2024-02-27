function parseBSRuleString(ruleString) {
    let birthRule = new Array(9).fill(false)
    let surviveRule = new Array(9).fill(false)
    let parts = ruleString.split("/").map(p => p.replace(/\s+/g, ""))

    for (const part of parts) {
        if (part.length === 0)
            continue

        if (!(/[BS]\/\d*/.test(part)))
            throw new Error("WRONG")
        
        if (part.length === 1)
            continue

        let letter = part[0]
        let neighborsCounts = part.substring(1).split("").map(n => parseInt(n))
        let array = 0

        switch (letter) {
            case "B":
                array = birthRule
                break;
            case "S":
                array = surviveRule
                break;
            default:
                throw new Error("WRONG AGAIN");
        }

        for (const count of neighborsCounts) {
            array[count] = true
        }
    }

    return [birthRule, surviveRule]
}

const Presets = [
    {
        Name: "Conway's Game of Life",
        Author: "John Conway",
        RuleString: "B3/S23"
    },
    {
        Name: "Seeds",
        Author: "Brian Silverman",
        RuleString: "B2/S"
    }
]

for (const preset of Presets) {
    preset["PrecomputedRule"] = parseBSRuleString(preset["RuleString"])
}