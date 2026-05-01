/*

Connect to the backend, start receiving socket info.
 */

class MyPipes extends PipesTool {
    /* This centralises the user setup.
    It contains a walker (executor), lights, config, and any user hooks and
    addons. */
    constructor(conf={}) {
        super(conf)
    }

    buildPipesCanvas(){
        let conf = this.conf;
       let backName = conf.backLayerSelector || '.canvas-container.back canvas'
       let foreName = conf.foreLayerSelector || '.canvas-container.fore canvas'

        const backLayer = new CanvasLayer(backName)
        const foreLayer = new CanvasLayer(foreName)

        // dirty for now.
        const clItems = new CanvasLayerGroup(backLayer, foreLayer)
        window.clItems = clItems
        this.layerGroup = clItems

    }


}


const pipesConfig = Object.assign({
    backLayerSelector: '.canvas-container.back canvas'
    , foreLayerSelector: '.canvas-container.fore canvas'
    , dragspaceSelector: 'main'
}, connectionsData)


const runIndexApp = function() {

    window.app = createUIApp('#mini_app', connectionsData);

    window.myPipes = new MyPipes(pipesConfig)
    myPipes.buildPipesCanvas()

    window.pipesTool = myPipes


    window.nodesApp = createNodesApp('#panspace_container', connectionsData)

    // // from pipes-winbox-app.js
    // runPipes(pipesConfig)

    setTimeout(function(){
        startDragging()
    }, 1000)
}


const startDragging = function(){
    let dragSpace = pipesConfig.dragspaceSelector || 'main';
    let dragSpaceBox = '.box'

    const infiniteDrag = new ZoomableInfiniteDrag(dragSpace, dragSpaceBox)

    stickAll('.panspace-container');
    stickAll(dragSpaceBox);

    dragSolo = new DragSolo()
    dragSolo.enable(dragSpaceBox)

    window.dragSolo = dragSolo;

    document.querySelectorAll(dragSpaceBox).forEach((n)=>{
        // n.style.position = 'absolute'
        n.classList.add('drag-ready')
    })
}


const enableDragging = function(item, allowPan=true){
    stickAll(item);
    dragSolo.enable(item)
    item.classList.add('drag-ready')
    if(!allowPan) {
        item.classList.add('no-pan')
    }

}


;runIndexApp();