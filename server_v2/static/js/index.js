/*

In this new verson

+ Nodes are optional

*/

class DemoStepper extends Stepper {
    constructor(graph) {
        super(graph)
        this.events = []
    }

    getNodeElements() {
        if(typeof document == 'undefined') {
            return []
        }

        return Array.from(document.querySelectorAll('[data-graph-node]'))
    }

    getNodeElement(nodeName) {
        if(typeof document == 'undefined') {
            return null
        }

        return document.querySelector(`[data-graph-node="${nodeName}"]`)
    }

    setNodeState(nodeName, nextState) {
        let element = this.getNodeElement(nodeName)
        if(element == null) {
            return
        }

        element.classList.remove('graph-node-execute', 'graph-node-complete')
        if(nextState != undefined) {
            element.classList.add(nextState)
        }
    }

    resetNodeStates() {
        this.getNodeElements().forEach((element) => {
            element.classList.remove('graph-node-execute', 'graph-node-complete')
        })
    }

    onStart(rows, args) {
        this.resetNodeStates()
        this.events = []
        return rows
    }

    onNodeExecute(nodeName, node, nextNodes, input) {
        this.events.push({ type: 'execute', nodeName: nodeName, nextNodes: Object.keys(nextNodes) })
        this.setNodeState(nodeName, 'graph-node-execute')
        return input
    }

    onNodeComplete(nodeName, node, nextNodes, input, value) {
        this.events.push({ type: 'complete', nodeName: nodeName, value: value })
        this.setNodeState(nodeName, 'graph-node-complete')
        return value
    }

    onStash(nodeName, value, stash) {
        this.events.push({ type: 'stash', nodeName: nodeName, value: value })
        return value
    }
}

class DemoGraph extends Graph {
    getStepperClass() {
        return DemoStepper
    }
}

class DemoPipIndexStepper extends PipIndexStepper {
    constructor(graph) {
        super(graph)
        this.events = []
    }

    getNodeElements() {
        if(typeof document == 'undefined') {
            return []
        }

        return Array.from(document.querySelectorAll('[data-graph-node]'))
    }

    getNodeElement(nodeName) {
        if(typeof document == 'undefined') {
            return null
        }

        return document.querySelector(`[data-graph-node="${nodeName}"]`)
    }

    setNodeState(nodeName, nextState) {
        let element = this.getNodeElement(nodeName)
        if(element == null) {
            return
        }

        element.classList.remove('graph-node-execute', 'graph-node-complete')
        if(nextState != undefined) {
            element.classList.add(nextState)
        }
    }

    resetNodeStates() {
        this.getNodeElements().forEach((element) => {
            element.classList.remove('graph-node-execute', 'graph-node-complete')
        })
    }

    onStart(rows, args) {
        this.resetNodeStates()
        this.events = []
        return rows
    }

    onNodeExecute(nodeName, node, nextNodes, input) {
        this.events.push({ type: 'execute', nodeName: nodeName, nextNodes: Object.keys(nextNodes) })
        this.setNodeState(nodeName, 'graph-node-execute')
        return input
    }

    onNodeComplete(nodeName, node, nextNodes, input, value) {
        this.events.push({ type: 'complete', nodeName: nodeName, value: value })
        this.setNodeState(nodeName, 'graph-node-complete')
        return value
    }

    onStash(nodeName, value, stash) {
        this.events.push({ type: 'stash', nodeName: nodeName, value: value })
        return value
    }
}

class DemoPipIndexGraph extends Graph {
    constructor(data) {
        super(data)
        this.dataType = 'pipDict'
    }

    getStepperClass() {
        return DemoPipIndexStepper
    }
}

const getDemoNodeValue = function(value) {
    return Array.isArray(value) ? value.reduce((a, b) => a + b, 0) : value
}

const getDemoPipValue = function(value, pipIndex=0, defaultValue=0) {
    if(Array.isArray(value) == false) {
        return value == undefined ? defaultValue : value
    }

    let pipValue = value[pipIndex]
    if(Array.isArray(pipValue)) {
        return pipValue.reduce((a, b) => a + b, 0)
    }

    return pipValue == undefined ? defaultValue : pipValue
}

const getDemoDelay = function() {
    return 1000 + Math.floor(Math.random() * 4000)
}

const withDemoDelay = function(nodeName, resolver) {
    return function(value) {
        console.log(nodeName, value)
        return new Promise((resolve) => {
            let delay = getDemoDelay()
            console.log(`${nodeName} delay`, delay)
            setTimeout(() => {
                resolve(resolver(value))
            }, delay)
        })
    }
}

const myData = {
    connectionsList: [
        ['a', 'b']
        , ['b', 'c']
        , ['b', 'd']
        , ['b', 'f']
        , ['b', 'g']
        , ['c', 'e']
        , ['d', 'e']
        , ['f', 'h']
        , ['g', 'h']
    ]

    , connectionsDicts: [
        { sender: 'a', receiver: 'b', width: 3}
        , { sender: 'b', receiver: 'c' }
        , { sender: 'b', receiver: 'd' }
        , { sender: 'b', receiver: 'f' }
        , { sender: 'b', receiver: 'g' }
        , { sender: 'c', receiver: 'e' }
        , { sender: 'd', receiver: 'e' }
        , { sender: 'f', receiver: 'h' }
        , { sender: 'g', receiver: 'h' }
    ]

    , connectionsDictDict: {
        a: {
            to: ['b']
        }
        , b: {
            to: ['c', 'd', 'f', 'g']
            , from: ['a']
        }
        , c: {
            to: ['e']
            , from: ['b']
        }

        , d: {
            to: ['e']
            ,
            from: ['b']
        }

        , e: {
            from: ['c', 'd']
        }

        , f: {
            to: ['h']
            , from: ['b']
        }

        , g: {
            to: ['h']
            , from: ['b']
        }

        , h: {
            from: ['f', 'g']
        }
    }

        , nodes: {
                a: withDemoDelay('a', (ints) => getDemoNodeValue(ints))
                , b: withDemoDelay('b', (ints) => getDemoNodeValue(ints) + 1)
                , c: withDemoDelay('c', (ints) => getDemoNodeValue(ints) + 2)
                , d: withDemoDelay('d', (ints) => getDemoNodeValue(ints) + 3)
                , f: withDemoDelay('f', (ints) => getDemoNodeValue(ints) + 5)
                , g: withDemoDelay('g', (ints) => getDemoNodeValue(ints) + 6)
                , e: {
                    mergeNode: true,
                    handler: withDemoDelay('e', (ints) => getDemoNodeValue(ints) + 4)
                    }
                , h: {
                    mergeNode: true,
                    handler: withDemoDelay('h', (ints) => getDemoNodeValue(ints) + 8)
                    }
        }

    // , defaultNode: {}
}

const myPipData = {
    connectionsPipDicts: [
        {
            sender: { label: 'a', direction: 'outbound', pipIndex: 0 },
            receiver: { label: 'b', direction: 'inbound', pipIndex: 1 },
        }
        , {
            sender: { label: 'a', direction: 'outbound', pipIndex: 1 },
            receiver: { label: 'c', direction: 'inbound', pipIndex: 0 },
        }
        , {
            sender: { label: 'b', direction: 'outbound', pipIndex: 0 },
            receiver: { label: 'e', direction: 'inbound', pipIndex: 0 },
        }
        , {
            sender: { label: 'c', direction: 'outbound', pipIndex: 0 },
            receiver: { label: 'e', direction: 'inbound', pipIndex: 1 },
        }
    ]

    , nodes: {
        a: withDemoDelay('a:pip', (ints) => {
            let base = getDemoNodeValue(ints)
            return [base + 1, base + 2]
        })

        , b: withDemoDelay('b:pip', (values) => getDemoPipValue(values, 1) * 2)
        , c: withDemoDelay('c:pip', (values) => getDemoPipValue(values, 0) + 5)
        , e: {
            mergeNode: true,
            handler: withDemoDelay('e:pip', (values) => {
                return getDemoPipValue(values, 0) + getDemoPipValue(values, 1)
            })
        }
    }
}


gg = new DemoGraph(myData)
ggPip = new DemoPipIndexGraph(myPipData)

window.prepareDemoStepper = function() {
    window.demoStepper = gg.stepper('a')
    window.demoStepper.start(1, 2)
    return window.demoStepper
}

window.stepDemoStepper = function() {
    return window.demoStepper && window.demoStepper.step()
}

window.prepareDemoPipStepper = function() {
    window.demoPipStepper = ggPip.stepper('a')
    window.demoPipStepper.start(1, 2)
    return window.demoPipStepper
}

window.stepDemoPipStepper = function() {
    return window.demoPipStepper && window.demoPipStepper.step()
}

window.resetDemoStepperView = function() {
    if(window.demoStepper) {
        window.demoStepper.resetNodeStates()
    }

    if(window.demoPipStepper) {
        window.demoPipStepper.resetNodeStates()
    }

    if(typeof document == 'undefined') {
        return
    }

    document.querySelectorAll('[data-graph-node]').forEach((element) => {
        element.classList.remove('graph-node-execute', 'graph-node-complete')
    })
}

window.logDemoStepperState = function() {
    console.log(window.demoStepper?.events, window.demoStepper?.stash)
}

window.logDemoPipStepperState = function() {
    console.log(window.demoPipStepper?.events, window.demoPipStepper?.stash)
}
// const aNode = gg.getNode('a')
// if(aNode.n != 'a') {
//     console.error('bad a node:', aNode)
// }
