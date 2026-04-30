/*
A wrapper of the winbox app to bind a vue app to the winbox view.

Every winbox window generates a new vue app
Pip drags are handled here - emitting events to the pipes managers.
*/

const runPipes = function(conf) {
    /* A run-all function for the tool. One ran, pipes is ready to use.

    - create canvas layers
    - create group tool
    - spawn addons (dragging, utils)
    */
   // let backName = conf.backLayerSelector || '.canvas-container.back canvas'
   // let foreName = conf.foreLayerSelector || '.canvas-container.fore canvas'

   //  const backLayer = new CanvasLayer(backName)
   //  const foreLayer = new CanvasLayer(foreName)

   //  // dirty for now.
   //  const clItems = new CanvasLayerGroup(backLayer, foreLayer)
   //  window.clItems = clItems


    // Drag and zoom functionality.

    /* Convenience tool. */
    // const pipesTool = new PipesTool(conf);
    // window.pipesTool = pipesTool

}

