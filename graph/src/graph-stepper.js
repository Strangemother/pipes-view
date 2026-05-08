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
        this._stepState = undefined
        this._autoRunState = undefined
        this._current = undefined;
    }

    setOrigin(start) {
        this.origin = start
    }

    onStart(rows, args) {
        return rows
    }

    onStep(rows) {
        return rows
    }

    onStepComplete(currentRows, nextRows, completed) {
        return completed
    }

    onAutoStepScheduled(currentRows, nextRows, delay) {
        return delay
    }

    onAutoStepComplete(currentRows, nextRows) {
        return nextRows
    }

    onAutoStepStop(reason) {
        return reason
    }

    onNodeExecute(nodeName, node, nextNodes, input) {
        return input
    }

    onNodeComplete(nodeName, node, nextNodes, input, value) {
        return value
    }

    onNodeError(nodeName, node, nextNodes, input, error) {
        return error
    }

    onStash(nodeName, value, stash) {
        return value
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

        let startRows = this.onStart(this.rows, Array.from(arguments))
        this._stepState = undefined
        return startRows == undefined ? this.rows : startRows
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
        let executions = []

        this.rows = []
        this._nextNodes = []

        for(let row of currentRows) {
            let place = row.nodeName
            let node = this.getNodeConfig(place)
            let nextNodes = this.graph.getNextNodesDict(place) || {}
            let nextNodeNames = Object.keys(nextNodes)
            let execution = this.runTarget(place, node, nextNodes, row.input)
            executions.push(execution)

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
        this._stepState = this.createStepState(currentRows, nextRows, executions)

        let steppedRows = this.onStep(nextRows)
        return steppedRows == undefined ? nextRows : steppedRows
    }

    createStepState(currentRows, nextRows, executions) {
        let completion = Promise.allSettled(executions.map((execution) => execution.promise)).then((completed) => {
            let nextCompleted = this.onStepComplete(currentRows, nextRows, completed)
            return nextCompleted == undefined ? completed : nextCompleted
        })

        return {
            currentRows: currentRows,
            nextRows: nextRows,
            executions: executions,
            completion: completion,
        }
    }

    getCurrentStepState() {
        return this._stepState
    }

    waitForStepComplete() {
        return this._stepState?.completion || Promise.resolve([])
    }

    autoStep(delay=0) {
        this.stopAutoStep('restart')

        let state = {
            delay: delay,
            stopped: false,
            timerId: undefined,
        }

        let runNext = () => {
            if(state.stopped) {
                return Promise.resolve([])
            }

            let rows = this.step()
            let stepState = this.getCurrentStepState()
            return this.waitForStepComplete().then(() => {
                if(state.stopped || rows.length == 0) {
                    this._autoRunState = undefined
                    this.onAutoStepComplete(stepState?.currentRows || [], rows)
                    return rows
                }

                let nextDelay = this.onAutoStepScheduled(stepState?.currentRows || [], rows, state.delay)
                nextDelay = nextDelay == undefined ? state.delay : nextDelay

                return new Promise((resolve) => {
                    state.timerId = setTimeout(() => {
                        state.timerId = undefined
                        resolve(runNext())
                    }, nextDelay)
                })
            })
        }

        state.promise = runNext()
        this._autoRunState = state
        return state
    }

    stopAutoStep(reason='stopped') {
        let state = this._autoRunState
        if(state == undefined) {
            return false
        }

        state.stopped = true
        if(state.timerId != undefined) {
            clearTimeout(state.timerId)
            state.timerId = undefined
        }

        this._autoRunState = undefined
        this.onAutoStepStop(reason)
        return true
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
        let inputMode = 'value'

        if(typeof entry == 'function') {
            mergeNode = entry.mergeNode === true
            inputMode = entry.inputMode || (entry.expectsPromise === true ? 'promise' : 'value')
        } else if(entry != null && typeof entry == 'object') {
            handler = entry.handler || entry.run || entry.execute || entry.fn || entry.func || entry.value
            mergeNode = entry.mergeNode === true
            inputMode = entry.inputMode || (entry.expectsPromise === true ? 'promise' : 'value')
        }

        if(typeof handler != 'function') {
            throw new Error(`Node ${nodeName} is not callable`)
        }

        return {
            name: nodeName,
            handler: handler,
            mergeNode: mergeNode,
            inputMode: inputMode,
            entry: entry,
        }
    }

    getHandlerArgument(node, input) {
        if(node.inputMode == 'promise') {
            return input.promise
        }

        return Promise.resolve(input.promise)
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

                let stashedValue = this.onStash(nodeName, value, this.stash)
                items.push(stashedValue == undefined ? value : stashedValue)
                return value
            },
            (error) => {
                console.error('Step failed:', nodeName, error)
            }
        )
    }

    runTarget(nodeName, node, nextNodes, input) {
        this._current = nodeName
        let executeInput = this.onNodeExecute(nodeName, node, nextNodes, input)
        executeInput = executeInput == undefined ? input : executeInput
        console.log(
            'Run Node:', node.handler,
            '\nWith Promise:', executeInput?.promise || executeInput,
            '\nThen Next:', nextNodes,
            )

        /* Execute */
        let execution = this.trackPromise(
            Promise.resolve()
                .then(() => this.getHandlerArgument(node, executeInput))
                .then((handlerInput) => node.handler.call(this, handlerInput))
                .then(
                    (value) => {
                        let nextValue = this.onNodeComplete(nodeName, node, nextNodes, executeInput, value)
                        value = nextValue == undefined ? value : nextValue
                        console.log('Result:', value)
                        return value
                    },
                    (error) => {
                        let nextError = this.onNodeError(nodeName, node, nextNodes, executeInput, error)
                        error = nextError == undefined ? error : nextError
                        console.error('Result Error:', error)
                        throw error
                    }
                )
        )

        return execution
    }


}


class PipIndexStepper extends Stepper {

    step() {
        if(this.rows.length == 0) {
            if(this._started || this.origin == undefined) {
                return []
            }

            this.start.apply(this, arguments)
        }

        let currentRows = this.mergeRows(this.rows)
        let nextRows = []
        let executions = []

        this.rows = []
        this._nextNodes = []

        for(let row of currentRows) {
            let place = row.nodeName
            let node = this.getNodeConfig(place)
            let nextConnections = this.graph.getNextConnectionEntries(place) || []
            let nextNodes = this.getNextNodesDict(nextConnections)
            let execution = this.runTarget(place, node, nextNodes, row.input)
            executions.push(execution)

            if(nextConnections.length == 0) {
                this.stashResult(place, execution)
                continue
            }

            for(let connection of nextConnections) {
                let routedExecution = this.routeExecutionToConnection(execution, connection)
                let nextInput = this.createReceiverTrackedInput(connection, routedExecution)
                nextRows.push(this.createConnectionRow(connection, nextInput))
            }
        }

        nextRows = this.mergeRows(nextRows)

        this.rows = nextRows
        this._nextNodes = nextRows.map((row) => row.nodeName)
        this._current = this._nextNodes[0]
        this._stepState = this.createStepState(currentRows, nextRows, executions)

        let steppedRows = this.onStep(nextRows)
        return steppedRows == undefined ? nextRows : steppedRows
    }

    createRow(nodeName, input, connection=undefined) {
        let row = super.createRow(nodeName, input)
        if(connection == undefined) {
            return row
        }

        let entry = this.graph.normalizeConnectionEntry(connection)
        row.connection = connection
        row.senderPipIndex = entry?.outbound?.pipIndex
        row.receiverPipIndex = entry?.inbound?.pipIndex
        return row
    }

    createConnectionRow(connection, input) {
        let entry = this.graph.normalizeConnectionEntry(connection)
        return this.createRow(entry?.inbound?.label, input, connection)
    }

    getNextNodesDict(connections) {
        let nextNodes = {}
        for(let connection of connections) {
            let entry = this.graph.normalizeConnectionEntry(connection)
            let nextNodeName = entry?.inbound?.label
            if(nextNodeName == undefined) {
                continue
            }

            nextNodes[nextNodeName] = this.graph.getNode(nextNodeName)
        }

        return nextNodes
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
                mergedRows.push({
                    nodeName: row.nodeName,
                    mergeRows: bucket,
                })
            }

            bucket.push(row)
        }

        return mergedRows.map((row) => {
            if(Array.isArray(row.mergeRows) == false) {
                return row
            }

            if(row.mergeRows.length <= 1) {
                return row.mergeRows[0]
            }

            return this.createRow(
                row.nodeName,
                this.combineIndexedTrackedValues(row.mergeRows.map((mergeRow) => mergeRow.input))
            )
        })
    }

    combineIndexedTrackedValues(inputs) {
        return this.trackPromise(
            Promise.all(inputs.map((input) => input.promise)).then((values) => {
                return this.mergeIndexedValues(values)
            })
        )
    }

    mergeIndexedValues(values) {
        let merged = []
        let hasIndexedValue = false

        for(let value of values) {
            if(Array.isArray(value)) {
                hasIndexedValue = true
                value.forEach((slotValue, pipIndex) => {
                    if(slotValue == undefined) {
                        return
                    }

                    this.mergeIndexedSlot(merged, pipIndex, slotValue)
                })
                continue
            }

            this.mergeIndexedSlot(merged, 0, value)
        }

        if(hasIndexedValue) {
            return merged
        }

        if(merged.length == 1 && Array.isArray(merged[0]) == false) {
            return merged[0]
        }

        return merged
    }

    mergeIndexedSlot(target, pipIndex, value) {
        if(target[pipIndex] == undefined) {
            target[pipIndex] = value
            return target
        }

        if(Array.isArray(target[pipIndex])) {
            target[pipIndex].push(value)
            return target
        }

        target[pipIndex] = [target[pipIndex], value]
        return target
    }

    routeExecutionToConnection(execution, connection) {
        let entry = this.graph.normalizeConnectionEntry(connection)
        let senderPipIndex = entry?.outbound?.pipIndex

        return this.trackPromise(
            execution.promise.then((value) => {
                return this.getOutputValueForPip(value, senderPipIndex)
            })
        )
    }

    createReceiverTrackedInput(connection, execution) {
        let entry = this.graph.normalizeConnectionEntry(connection)
        let receiverPipIndex = entry?.inbound?.pipIndex

        if(receiverPipIndex == undefined) {
            return execution
        }

        return this.trackPromise(
            execution.promise.then((value) => {
                let indexedInput = []
                indexedInput[receiverPipIndex] = value
                return indexedInput
            })
        )
    }

    getOutputValueForPip(value, pipIndex) {
        if(pipIndex == undefined) {
            return value
        }

        if(Array.isArray(value) && pipIndex in value) {
            return value[pipIndex]
        }

        if(value != null && typeof value == 'object') {
            if(pipIndex in value) {
                return value[pipIndex]
            }

            let pipKey = String(pipIndex)
            if(pipKey in value) {
                return value[pipKey]
            }
        }

        return value
    }
}