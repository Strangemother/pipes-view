/*

The GraphExecutor extends LocalStorageGraphWalker to provide _execution_ methods.

- Call to run code setup on a node
- Each step is a call to `executeNode(name, data)`
- then it steps to the next nodes

 */

class GraphExecutor extends LocalStorageGraphWalker {
    // Walk with code execution
    constructor(conf={}) {
        super(conf)
        this.conf = conf
    }

    get taskMap() {
        return this.conf.taskMap || {}
    }

    clearExecutionState() {
        const root = document.querySelector('main') || document
        root
            .querySelectorAll('.winbox.executing, .winbox.executed')
            .forEach((element) => {
                element.classList.remove('executing', 'executed')
            })
    }

    getNodeElement(nodeName) {
        return this.getWindow(nodeName)
    }

    executeNode(nodeName, data, options={}) {
        const node = this.getNodeElement(nodeName)
        if(node == null) {
            console.warn(`No node found with name ${nodeName}`)
            return
        }

        // if(options.resetState ?? true) {
            // this.clearExecutionState()
        // }
        let flashUnit = this.getGraphExecutorHighlightElement(nodeName, node)
        flashUnit.classList.add('executing')

        let result = this.runTaskFunc(nodeName, node, data, options)
        return result;

    }

    runTaskFunc(nodeName, node, data, options) {

        let lightTimeout = options.lightTimeout == undefined? options.delay: options.lightTimeout;
        lightTimeout = lightTimeout == undefined? 400: lightTimeout

        let taskFunc = this.getTaskFunc(nodeName, node, data, options)
        // try {
        if(taskFunc == undefined){
            taskFunc = this.getDefaultTask(nodeName, node, data, options)
            console.log('Return default  Task', nodeName)

        }
        // A task wants
        //  name
        //  element
        //  node (data)
        //  given args
        //  options
        //
        let flashUnit = this.getGraphExecutorHighlightElement(nodeName, node)
        let info = {nodeName, element: node, node}
        let result = taskFunc(info, data, options)
        setTimeout(()=>{
            flashUnit.classList.remove('executing')
        }, lightTimeout)
        return result
        // } catch (err) {
        //     console.error(`Error executing task ${node} for node ${nodeName}:`, err)
        // }
    }

    getGraphExecutorHighlightElement(nodeName, node) {
        if(this.parent.getGraphExecutorHighlightElement){
            let r= this.parent.getGraphExecutorHighlightElement(nodeName, node)
            if (r != undefined) {
                return r
            }
        }
        return node;
    }

    getDefaultTask(nodeName, node, data, options) {
        if(this.parent.getTaskFunc){
            let r= this.parent.getTaskFunc(nodeName, node, data, options)
            if (r != undefined) {
                return r
            }
        }

        return this.defaultTask
    }

    defaultTask(receiver, data, options) {
        // transparent.
        return data
    }


    getTaskFunc(nodeName, node, data, options) {

        if(this.parent.getTaskFunc){
            return this.parent.getTaskFunc(nodeName, node, data, options)
        }
        // Run work
        const taskName = node // node.task || 'default'
        let taskFunc = this.taskMap[taskName] || this.taskMap['defaultTask']
        if(typeof taskFunc !== 'function') {
            console.warn(`No task function found for task ${taskName} on node ${node}`)
            // return
            taskFunc = (node,data)=>{}
        }

        return taskFunc.bind(this.taskMap)
    }

    executeAndExpected(nodeName, data, options={}) {
        const result = this.executeNode(nodeName, data, options)
        return [result, this.getOutgoingIds(nodeName)]
    }

    executeLoop(nodeName, data, options={}) {
        /* Execute the node with the data, then schedule each downstream node
        on a timer — one step per tick. Returns a controller so the caller can
        stop the chain or adjust the speed mid-run.

            const chain = executor.executeLoop('apples', myData)
            chain.setDelay(500)   // speed up to 500ms
            chain.stop()          // cancel all pending steps
        */

        // conf is shared across all branches of this chain so setDelay()
        // affects every in-flight branch immediately.
        const conf = { delay: options.delay ?? 1000 }

        // All pending timeout IDs — stop() drains this to cancel the chain.
        const timers = new Set()


        this.clearExecutionState()

        const step = (nodeName, data) => {
            const [result, nextIds] = this.executeAndExpected(nodeName, data, conf)

            if(nextIds.length === 0) {
                // Terminal node — valid end of a pipeline branch.
                return
            }

            /*
            For each outgoing connection, execute the next node with the result as input.
            Note: Parallel execution must exist.
            Therefore each result is fed into its own connections.

                a => b -> e
                     c -> d -> f
                               g

            Data between b -> e is separate from c -> d -> f -> g.

            */

            for(const nextId of nextIds) {
                // When branching, each child gets its own deep copy of result so
                // mutations in one pipeline branch cannot corrupt another.
                // Primitives are passed as-is (copy-by-value already).
                const branchData = (nextIds.length > 1 && result !== null && typeof result === 'object')
                    ? structuredClone(result)
                    : result

                const id = setTimeout(() => {
                    timers.delete(id)
                    step(nextId, branchData)
                }, conf.delay)

                timers.add(id)
            }
        }

        // Execute the entry node immediately, then let the timer drive the rest.
        step(nodeName, data)

        return {
            stop() {
                for(const id of timers) { clearTimeout(id) }
                timers.clear()
            },
            setDelay(ms) { conf.delay = ms }
        }
    }

}

