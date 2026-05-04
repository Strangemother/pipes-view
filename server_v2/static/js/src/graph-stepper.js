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

        let currentRows = this.mergeRows(this.rows)
        let nextRows = []

        this.rows = []
        this._nextNodes = []

        for(let row of currentRows) {
            let place = row.nodeName
            let node = this.getNodeConfig(place)
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

        nextRows = this.mergeRows(nextRows)

        this.rows = nextRows
        this._nextNodes = nextRows.map((row) => row.nodeName)
        this._current = this._nextNodes[0]

        return nextRows
    }

    mergeRows(rows) {
        let mergedRows = []
        let mergeBuckets = {}

        for(let row of rows) {
            let node = this.getNodeConfig(row.nodeName)

            if(node.mergeNode !== true) {
                mergedRows.push(row)
                continue
            }

            let bucket = mergeBuckets[row.nodeName]
            if(bucket == undefined) {
                bucket = []
                mergeBuckets[row.nodeName] = bucket
                mergedRows.push(this.createRow(row.nodeName, bucket))
            }

            bucket.push(row.input)
        }

        return mergedRows.map((row) => {
            if(Array.isArray(row.input) == false) {
                return row
            }

            let mergedInput = row.input
            if(mergedInput.length <= 1) {
                return this.createRow(row.nodeName, mergedInput[0])
            }

            return this.createRow(row.nodeName, this.combineTrackedValues(mergedInput))
        })
    }

    createRow(nodeName, input) {
        return {
            nodeName: nodeName,
            input: input,
        }
    }

    getNodeConfig(nodeName) {
        let entry = this.graph.getNode(nodeName)
        let handler = entry
        let mergeNode = false

        if(typeof entry == 'function') {
            mergeNode = entry.mergeNode === true
        } else if(entry != null && typeof entry == 'object') {
            handler = entry.handler || entry.run || entry.execute || entry.fn || entry.func || entry.value
            mergeNode = entry.mergeNode === true
        }

        if(typeof handler != 'function') {
            throw new Error(`Node ${nodeName} is not callable`)
        }

        return {
            name: nodeName,
            handler: handler,
            mergeNode: mergeNode,
            entry: entry,
        }
    }

    createTrackedValue(value) {
        return this.trackPromise(Promise.resolve(value))
    }

    combineTrackedValues(inputs) {
        return this.trackPromise(Promise.all(inputs.map((input) => input.promise)))
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
            'Run Node:', node.handler,
            '\nWith Promise:', input?.promise || input,
            '\nThen Next:', nextNodes,
            )

        /* Execute */
        let execution = this.trackPromise(
            Promise.resolve().then(() => node.handler.call(this, input.promise))
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