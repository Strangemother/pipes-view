/*

Connect to the backend, start receiving socket info.
 */


const runIndexApp = function() {

    // from pipes-ui-app.js
    const app = createUIApp('#mini_app');
    window.app = app;

    window.nodesApp = createNodesApp('#panspace_container')

    const infiniteDrag = new ZoomableInfiniteDrag(
             'main',
            '.box'
            )


    setTimeout(function(){

        stickAll('.panspace-container');
        stickAll('.box');

        dragSolo = new DragSolo()
        dragSolo.enable('.box')

        window.dragSolo = dragSolo;

        document.querySelectorAll('.box').forEach((n)=>{
            // n.style.position = 'absolute'
            n.classList.add('drag-ready')
        })
    }, 1000)
}


;runIndexApp();