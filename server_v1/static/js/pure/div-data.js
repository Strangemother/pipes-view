function expandConnections(_cons) {
    let res = []

    for (var i = 0; i < _cons.length; i++) {
        let con = _cons[i]
        let item = {
          "sender": {
            "label": con[0],
            "direction": "outbound",
            "pipIndex": 0
          },
          "receiver": {
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


let connections = {
    "windows": [
        { name: 'apples', x: 60, y: 60 }
        , { name: 'banana', exampleData: 123 }
    ],
    "connections": expandConnections(simpleConnections)
}
