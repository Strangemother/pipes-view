# Pipes Component

This is the quickest way to use the pipes layer as it exists today.

If you want to draw connections between node tips in the browser, this is the part you import.

Canonical source now lives at the repo root in `pipes/`.
This `server_v1/static/js` area remains the demo consumer and compatibility location.

## Use It Now

1. Build the browser bundle.
2. Import `dist/pipes-runtime.js` on your page.
3. Provide a small host app with `getTip(...)`.
4. Call `createPipesRuntime(...)`.
5. Dispatch `connectnodes` events or call `layerGroup.connectNodes(...)`.

## Build

```bash
npm run build
```

Output:

```text
server_v1/static/js/dist/pipes-runtime.js
```

## Browser Import

```html
<script src="./static/js/dist/pipes-runtime.js"></script>
```

Available globals:

- `window.createPipesRuntime`
- `window.PipesTool`
- `window.PipesRuntime`

## Minimal Page Shape

You need two canvases.

```html
<div class="canvas-container back">
  <canvas></canvas>
</div>

<main>
  <div id="node_a_out_0"></div>
  <div id="node_b_in_0"></div>
</main>

<div class="canvas-container fore">
  <canvas></canvas>
</div>
```

The runtime draws lines on the foreground canvas and reads tip positions from DOM elements.

## Minimal Host App

The required part is `getTip(label, direction, pipIndex)`.

```js
const app = {
  getTip(label, direction, pipIndex = 0) {
    const suffix = direction === 'outbound' ? 'out' : 'in'
    const node = document.getElementById(`node_${label}_${suffix}_${pipIndex}`)

    return {
      node,
      label,
      direction,
      pipIndex,
    }
  },

  windowMap: {},
}
```

If you want walker and highlight helpers to find nodes by name, also provide one of these:

```js
app.windowMap
app.getGraphNodeElement(name)
```

If you want restore/import behavior later, also provide:

```js
app.spawnWindow(conf)
```

## Minimal Runtime Setup

```js
const runtime = createPipesRuntime({
  app,
  backLayerSelector: '.canvas-container.back canvas',
  foreLayerSelector: '.canvas-container.fore canvas',
})

runtime.pipesTool.draw()
```

Returned object:

- `backLayer`
- `foreLayer`
- `layerGroup`
- `pipesTool`

By default it also assigns:

- `window.clItems`
- `window.pipesTool`

Turn that off with:

```js
createPipesRuntime({
  app,
  attachToWindow: false,
})
```

## Make A Connection

You can connect nodes either through the event API or directly through the layer group.

Event form:

```js
document.dispatchEvent(new CustomEvent('connectnodes', {
  detail: {
    sender: {
      label: 'a',
      direction: 'outbound',
      pipIndex: 0,
    },
    receiver: {
      label: 'b',
      direction: 'inbound',
      pipIndex: 0,
    },
    line: {
      color: '#3cb44b',
      design: 's-curve',
    },
  },
}))
```

Direct form:

```js
runtime.layerGroup.connectNodes({
  sender: {
    label: 'a',
    direction: 'outbound',
    pipIndex: 0,
  },
  receiver: {
    label: 'b',
    direction: 'inbound',
    pipIndex: 0,
  },
  line: {
    color: '#3cb44b',
    design: 's-curve',
  },
})
```

Then draw:

```js
runtime.pipesTool.draw()
```

## Common Operations

Draw once:

```js
runtime.pipesTool.draw()
```

Run animated redraws:

```js
runtime.pipesTool.animDraw()
```

Save and restore:

```js
runtime.pipesTool.save('my-pipes')
runtime.pipesTool.restore('my-pipes')
```

Clear everything:

```js
runtime.pipesTool.clear()
```

## What This Component Includes

Use these files as the current component boundary:

- `src/pipes-runtime.js`
- `src/pipes-tool.js`
- `src/canvas-layer.js`
- `src/pipe-events.js`
- `src/pens/`
- `src/pure/graph-walker.js`
- `src/pure/graph-executor.js`
- `src/graph-highlighter.js`
- `dist/pipes-runtime.js`

These are still outside the component:

- `pure/pipes-divs-app.js`
- `pure/pipes-divs-ui-app.js`
- page templates
- drag and zoom setup
- demo data

## Practical Notes

- The runtime is browser-first right now.
- The host app is responsible for rendering the actual node and tip DOM.
- The pipes layer handles connection storage, line drawing, and helper tools around graph walking.

For broader background and packaging notes, see `docs/pipes-tool.md`.