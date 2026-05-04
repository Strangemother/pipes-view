/*

Duplicating this guys algorithm:
    https://github.com/Strangemother/python-hyperway#-stepper

- A stepper runs itself.
- lives indepdentatly

 */


class Stepper {

    constructor(graph) {
        this.graph = graph
        this._current = undefined;
    }

    setOrigin(start) {
        this.origin = start
    }

    start() {
        this._current = this._current || this.origin
        this.step.apply(this, arguments)
    }

    step() {
        /* Perform an auto step of the internals */
        let place = this._current

        let node = this.graph.getNode(place)
        let nextNodes = this.graph.getNextNodesDict(place)
        this._nextNodes = Object.keys(nextNodes)
        this.runTarget(place, node, nextNodes, Array.from(arguments))
    }

    runTarget(nodeName, node, nextNodes, args) {
        this._current = nodeName
        console.log(
            'Run Node:', node,
            '\nWith Args:', args,
            '\nThen Next:', nextNodes,
            )

        /* Execute */
        let res = node.apply(this, args)
        console.log('Result:', res)
    }


}