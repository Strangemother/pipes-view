/*

Connect to the backend, start receiving socket info.
 */


const runDragPanZoomTools = function() {

    // from pipes-ui-app.js
    // const app = createUIApp('#mini_app');
    // window.app = app;

    // window.nodesApp = createNodesApp('#panspace_container')
    let itemSelector = '.box'
    const infiniteDrag = new ZoomableInfiniteDrag('main', itemSelector)

    setTimeout(function(){
        window.dragSolo = initDragging(itemSelector)
    }, 1000)
}


function initDragging(itemSelector) {

    stickAll('.panspace-container');
    stickAll(itemSelector);

    dragSolo = new DragSolo()
    dragSolo.enable(itemSelector)

    document.querySelectorAll(itemSelector).forEach((n)=>{
        // n.style.position = 'absolute'
        n.classList.add('drag-ready')
    })

    return dragSolo
}


;runDragPanZoomTools();