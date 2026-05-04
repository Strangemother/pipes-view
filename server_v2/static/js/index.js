/*

In this new verson

+ Nodes are optional

*/

class DemoStepper extends Stepper {
    constructor(graph) {
        super(graph)
        this.events = []
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

const getDemoNodeValue = function(value) {
    return Array.isArray(value) ? value.reduce((a, b) => a + b, 0) : value
}

const getDemoDelay = function() {
    return 1000 + Math.floor(Math.random() * 4000)
}

const withDemoDelay = function(nodeName, resolver) {
    return function(valuePromise) {
        return Promise.resolve(valuePromise).then((value) => {
            console.log(nodeName, value)
            return new Promise((resolve) => {
                let delay = getDemoDelay()
                console.log(`${nodeName} delay`, delay)
                setTimeout(() => {
                    resolve(resolver(value))
                }, delay)
            })
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


gg = new DemoGraph(myData)
// const aNode = gg.getNode('a')
// if(aNode.n != 'a') {
//     console.error('bad a node:', aNode)
// }
