# Pipes Tool

Minimal guide for the v1 pipes runtime.

## What it is

The pipes runtime is the rendering and connection layer that sits around node UIs.

- it stores and draws sender/receiver connections
- it exposes a convenience wrapper through `PipesTool`
- it leaves the surrounding app shell free to choose its own UI, drag system, and node rendering

Primary source files:

- `pipes/src/pipes-runtime.js`
- `pipes/src/pipes-tool.js`
- `pipes/src/canvas-layer.js`
- built bundle: `pipes/dist/pipes-runtime.js`

Compatibility bundle for the existing v1 demo:

- `server_v1/static/js/dist/pipes-runtime.js`

## Package boundary

The runtime bundle includes the parts that are likely to move as one package later:

- connection events and draw requests
- canvas line storage and rendering
- pipe pen functions
- graph walking, highlighting, and execution helpers
- `PipesTool`
- `createPipesRuntime(...)`

The runtime does not include the app shell:

- the page template
- Petite Vue setup
- drag and zoom behavior
- node-window creation

That split keeps the pipes layer liftable without dragging the full demo app with it.

## Browser import

```html
<script src="./static/js/dist/pipes-runtime.js"></script>
```

Available globals:

- `window.PipesTool`
- `window.createPipesRuntime`
- `window.PipesRuntime`

## Minimal setup

```js
const runtime = createPipesRuntime({
  app: myApp,
  backLayerSelector: '.canvas-container.back canvas',
  foreLayerSelector: '.canvas-container.fore canvas',
})

runtime.pipesTool.draw()
```

Returned shape:

- `backLayer`
- `foreLayer`
- `layerGroup`
- `pipesTool`

By default the helper also assigns:

- `window.clItems`
- `window.pipesTool`

Disable that with:

```js
createPipesRuntime({
  app: myApp,
  attachToWindow: false,
})
```

## App contract

The runtime expects a small app surface.

For drawing connections, the app should provide a tip lookup like:

```js
app.getTip(label, direction, pipIndex)
```

For walkers and highlighting, the app should expose node elements through one of these:

```js
app.windowMap
app.getGraphNodeElement(name)
```

If you use restore/import features, the app also needs:

```js
app.spawnWindow(conf)
```

## Connection payload

The runtime consumes the same sender/receiver payload already used by the working v1 demo.

```js
document.dispatchEvent(new CustomEvent('connectnodes', {
  detail: {
    sender: {
      label: 'apples',
      direction: 'outbound',
      pipIndex: 0,
    },
    receiver: {
      label: 'banana',
      direction: 'inbound',
      pipIndex: 1,
    },
    line: {
      color: '#3cb44b',
      design: 's-curve',
    },
  },
}))
```

## `PipesTool`

`PipesTool` is the convenience wrapper around the lower-level pieces.

```js
const runtime = createPipesRuntime({ app: myApp })
const pipesTool = runtime.pipesTool

pipesTool.draw()
pipesTool.animDraw()
pipesTool.save()
pipesTool.restore()
pipesTool.clear()
```

Internally it groups:

- `app`
- `walker`
- `lights`
- `layerGroup`

## Current shape

This is still a pragmatic browser runtime, not a finished npm package.

That is intentional for now:

- the runtime boundary is explicit
- the bundle is importable as one script
- the surrounding UI can be swapped later without rewriting the draw layer