/*

Connect to the backend, start receiving socket info.
 */

const runIndexApp = function() {

    // from pipes-ui-app.js
    const app = createUIApp('#mini_app');
    window.app = app;

    window.nodesApp = createNodesApp('#panspace_container')


    // from pipes-winbox-app.js
    runPipes({
        backLayerSelector: '.canvas-container.back canvas'
        , foreLayerSelector: '.canvas-container.fore canvas'
        , dragspaceSelector: 'main'
    })

    // from graph-demo.js
    try {
        bootDemoGraph()
    } catch {}

    setTimeout(function(){
        startDragging()
    }, 1000)
}


const startDragging = function(){

    stickAll('.panspace-container');
    stickAll('.box');

    dragSolo = new DragSolo()
    dragSolo.enable('.box')

    window.dragSolo = dragSolo;

    document.querySelectorAll('.box').forEach((n)=>{
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