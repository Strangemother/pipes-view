/*

Pipes runtime entry point.

This file defines the package-shaped browser surface for the pipes layer.
It keeps the view shell outside the runtime boundary and exposes the pieces
needed to wire pipes into another app later.

*/

const createPipesRuntime = function(conf={}) {
    const backLayer = conf.backLayer || new CanvasLayer(
        conf.backLayerSelector || '.canvas-container.back canvas'
    )

    const foreLayer = conf.foreLayer || new CanvasLayer(
        conf.foreLayerSelector || '.canvas-container.fore canvas'
    )

    const layerGroup = conf.layerGroup || new CanvasLayerGroup(backLayer, foreLayer)
    const pipesTool = conf.pipesTool || new PipesTool(Object.assign({}, conf, {
        layerGroup: layerGroup,
    }))

    if(conf.attachToWindow !== false && typeof window != 'undefined') {
        window.clItems = layerGroup
        window.pipesTool = pipesTool
    }

    return {
        backLayer: backLayer,
        foreLayer: foreLayer,
        layerGroup: layerGroup,
        pipesTool: pipesTool,
    }
}

const PipesRuntime = {
    pipeData: pipeData,
    penFunctions: penFunctions,
    dispatchRequestDrawEvent: dispatchRequestDrawEvent,
    dispatchFocusNodeEvent: dispatchFocusNodeEvent,
    listenEvent: listenEvent,
    CanvasLayer: CanvasLayer,
    CanvasLayerGroup: CanvasLayerGroup,
    GraphWalker: GraphWalker,
    LocalStorageGraphWalker: LocalStorageGraphWalker,
    GraphHighlighter: GraphHighlighter,
    GraphExecutor: GraphExecutor,
    PipesTool: PipesTool,
    createPipesRuntime: createPipesRuntime,
}