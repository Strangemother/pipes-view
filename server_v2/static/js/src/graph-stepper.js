/*

Duplicating this guys algorithm:
    https://github.com/Strangemother/python-hyperway#-stepper

- A stepper runs itself.
- lives indepdentatly

 */


class Stepper {

    constructor(graph) {
        this.graph = graph
        this.origin = undefined
        this.rows = []
        this.stash = {}
        this._nextNodes = []
        this._started = false
        this._current = undefined;
    }

    setOrigin(start) {
        this.origin = start
    }

    start() {
        if(this.origin == undefined) {
            return []
        }

        this.rows = [
            this.createRow(
                this.origin,
                this.createTrackedValue(this.normalizeInput(Array.from(arguments)))
            )
        ]
        this._nextNodes = [this.origin]
        this._current = this.origin
        this._started = true

        return this.rows
    }

    step() {
        if(this.rows.length == 0) {
            if(this._started || this.origin == undefined) {
                return []
            }

            this.start.apply(this, arguments)
        }

        let currentRows = this.rows
        let nextRows = []

        this.rows = []
        this._nextNodes = []

        for(let row of currentRows) {
            let place = row.nodeName
            let node = this.graph.getNode(place)
            let nextNodes = this.graph.getNextNodesDict(place) || {}
            let nextNodeNames = Object.keys(nextNodes)
            let execution = this.runTarget(place, node, nextNodes, row.input)

            if(nextNodeNames.length == 0) {
                this.stashResult(place, execution)
                continue
            }

            for(let nextNodeName of nextNodeNames) {
                nextRows.push(this.createRow(nextNodeName, execution))
            }
        }

        this.rows = nextRows
        this._nextNodes = nextRows.map((row) => row.nodeName)
        this._current = this._nextNodes[0]

        return nextRows
    }

    createRow(nodeName, input) {
        return {
            nodeName: nodeName,
            input: input,
        }
    }

    createTrackedValue(value) {
        return this.trackPromise(Promise.resolve(value))
    }

    trackPromise(promise) {
        let tracked = {
            promise: undefined,
            settled: false,
            fulfilled: false,
            rejected: false,
            value: undefined,
            error: undefined,
        }

        tracked.promise = Promise.resolve(promise).then(
            (value) => {
                tracked.settled = true
                tracked.fulfilled = true
                tracked.value = value
                return value
            },
            (error) => {
                tracked.settled = true
                tracked.rejected = true
                tracked.error = error
                throw error
            }
        )

        return tracked
    }

    normalizeInput(args) {
        if(args.length == 0) {
            return undefined
        }

        if(args.length == 1) {
            return args[0]
        }

        return args
    }

    stashResult(nodeName, execution) {
        execution.promise.then(
            (value) => {
                let items = this.stash[nodeName]
                if(items == undefined) {
                    items = []
                    this.stash[nodeName] = items
                }

                items.push(value)
                return value
            },
            (error) => {
                console.error('Step failed:', nodeName, error)
            }
        )
    }

    runTarget(nodeName, node, nextNodes, input) {
        this._current = nodeName
        console.log(
            'Run Node:', node,
            '\nWith Promise:', input?.promise || input,
            '\nThen Next:', nextNodes,
            )

        /* Execute */
        let execution = this.trackPromise(
            Promise.resolve().then(() => node.call(this, input.promise))
        )

        execution.promise.then(
            (value) => {
                console.log('Result:', value)
                return value
            },
            (error) => {
                console.error('Result Error:', error)
            }
        )

        return execution
    }


}