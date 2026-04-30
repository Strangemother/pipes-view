
class WorkTasks {
    /*
    The nodes are xy/data
    the connections (edges) bind the nodes.
    These worker tasks is the executable functionality for nodes.
    */
    constructor(){
        console.log('WorkTasks initialized')
    }

    banana(config, data) {
        console.log('Banana task executed', config)
        return this.defaultTask(config, data)
    }

    defaultTask(config, data) {
        // If a task is not coded, this is executed.
        console.log('Default task executed', config)

        /*
            notice here we switch from a passive node to a persistent node.
         */
        // let res = data + 1
        let res = data + 1

        config.words = res;
        return res;
    }
}

function expandConnections(_cons) {
    let res = []

    for (var i = 0; i < _cons.length; i++) {
        let con = _cons[i]
        let item = {
          sender: {
            "label": con[0],
            "direction": "outbound",
            "pipIndex": 0
          },
          receiver: {
            "label": con[1],
            "direction": "inbound",
            "pipIndex": 0
          },
          "line": con[2] || {}
        }
        res.push(item)
    }
    return res;
}


const simpleConnections = [
    ["apples","banana", { "color": "#ffe119", "width": 6 }]
]

let nodes = [
        { name: 'apples', x: 200, y: 200 }
        , { name: 'banana', exampleData: 123 }
    ]

let connectionsData = {
    "windows": nodes
    , "nodes": nodes
    , "connections": expandConnections(simpleConnections)
    , "taskMap": (new WorkTasks)

}
