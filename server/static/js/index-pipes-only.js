/*

Connect to the backend, start receiving socket info.
*/


const runIndexApp = function() {

    // window.app = createUIApp('#mini_app', connectionsData);
    window.app = {}

    window.myPipes = new MyPipes(pipesConfig);
    myPipes.buildPipesCanvas()
    myPipes.addSimpleConnections(pipesConfig.connections)

    window.pipesTool = myPipes

    window.setTimeout(()=>myPipes.draw(), 400)
}


const pipesConfig = {
    // backLayerSelector: '.canvas-container.back canvas'
    backLayerSelector: '.overlay canvas'
    // , foreLayerSelector: '.canvas-container.fore canvas'
    , foreLayerSelector: '.overlay canvas'
    , nodes: {
        '#box_pound': { s: 'pound' }
        , '#box_amp': { s: 'amp' }
        , '#box_percent': {
            nodeFunction: function(){
                console.log('work function')
            }
        }
        , '#box_dollar': function() {
                console.log('work function')
                return 4
        }
    }
    , connections: {
        'a': ['#box_pound', '#box_amp']
        , 'b': ['#box_percent', '#box_dollar']
    }
}


const addConnecton = function() {
    let conn = pipesTool.walker.createConnection(
            '#box_dollar', '#box_pound', 0, 0, {
                color: 'orange'
                , width: 5
            }
        )

    pipesTool.walker.addConnecton(`${conn.sender.label}-${conn.receiver.label}`, conn)
    pipesTool.draw()
}


class MyPipes extends PipesTool {
    /* This centralises the user setup.
    It contains a walker (executor), lights, config, and any user hooks and
    addons. */
    constructor(conf={}) {
        super(conf)
    }

    buildPipesCanvas(){
        let conf = this.conf;
       // let backName = conf.backLayerSelector || '.canvas-container.back canvas'
       let foreName = conf.foreLayerSelector || '.canvas-container.fore canvas'

        // const backLayer = new CanvasLayer(backName, {parent: this})
        const foreLayer = new CanvasLayer(foreName, {parent: this})

        // dirty for now.
        const clItems = new CanvasLayerGroup(null, foreLayer, {parent: this})
        window.clItems = clItems
        this.layerGroup = clItems

    }

    getTaskFunc(nodeName, node, data, options) {
        let res = this.conf.nodes[nodeName];
        if(typeof(res) == 'function') {
            return res;
        }

        if(typeof(res) == 'object') {
            return res.nodeFunction?? undefined
        }
    }


    getTip(label, direction, pipIndex){
        return document.querySelector(label)
    }

    getDOMElement(name) {
        return document.querySelector(name)
    }

    getGraphExecutorHighlightElement(nodeName, node, unit){
        return this.getGraphHighlighterElement(nodeName)
    }

    getGraphHighlighterElement(name){
        return this.getDOMElement(name).parentNode;
    }

    addSimpleConnections(connections) {

        if(Array.isArray(connections)) {

            for (var i = 0; i < connections.length; i++) {
                let conn = connections[i]
                this.walker.createConnection(conn[0], conn[1])
                this.walker.addConnecton(`${conn[0]}-${conn[1]}`, conn)
            }
        } else {
            for(let k in connections) {
                let conn = connections[k]
                this.walker.createConnection(conn[0], conn[1])
                this.walker.addConnecton(`${conn[0]}-${conn[1]}`, conn)
            }
        }
    }
}

;runIndexApp();