# Pipes Package

This is the root-level home of the pipes runtime.

Use this directory as the current package boundary for the pipes tool.

## Layout

- `src/pipe-events.js`
- `src/canvas-layer.js`
- `src/pens/`
- `src/graph/`
- `src/pipes-tool.js`
- `src/pipes-runtime.js`
- `dist/pipes-runtime.js`

## Build

```bash
npm run build
```

Primary output:

```text
pipes/dist/pipes-runtime.js
```

Compatibility output for the existing v1 demo:

```text
server_v1/static/js/dist/pipes-runtime.js
```

## Browser import

```html
<script src="./pipes/dist/pipes-runtime.js"></script>
```

Globals:

- `window.createPipesRuntime`
- `window.PipesTool`
- `window.PipesRuntime`

## Use It Now

1. Run `npm run build`.
2. Import `pipes/dist/pipes-runtime.js`.
3. Render two canvas layers and your node-tip DOM.
4. Provide a small host app with `getTip(...)`.
5. Call `createPipesRuntime(...)`.
6. Connect nodes and call `draw()`.

## Minimal Example

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

<script src="./pipes/dist/pipes-runtime.js"></script>
<script>
	const app = {
		windowMap: {},

		getTip(label, direction, pipIndex = 0) {
			const suffix = direction === 'outbound' ? 'out' : 'in'
			const node = document.getElementById(`node_${label}_${suffix}_${pipIndex}`)
			return { node, label, direction, pipIndex }
		},
	}

	const runtime = createPipesRuntime({
		app,
		backLayerSelector: '.canvas-container.back canvas',
		foreLayerSelector: '.canvas-container.fore canvas',
	})

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

	runtime.pipesTool.draw()
</script>
```

## Event Example

The runtime also listens for `connectnodes` events.

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
			pipIndex: 1,
		},
		line: {
			color: '#4363d8',
			design: 's-curve',
		},
	},
}))
```

## Host App Contract

Required:

```js
app.getTip(label, direction, pipIndex)
```

Used by walker and highlight helpers:

```js
app.windowMap
app.getGraphNodeElement(name)
```

Used by restore/import flows:

```js
app.spawnWindow(conf)
```

## Common Methods

```js
const runtime = createPipesRuntime({ app })

runtime.pipesTool.draw()
runtime.pipesTool.animDraw()
runtime.pipesTool.save('my-pipes')
runtime.pipesTool.restore('my-pipes')
runtime.pipesTool.clear()
```

Returned object:

- `backLayer`
- `foreLayer`
- `layerGroup`
- `pipesTool`

## Source And Demo

Canonical source:

- `pipes/src/pipes-runtime.js`
- `pipes/src/pipes-tool.js`
- `pipes/src/canvas-layer.js`

Compatibility output for the existing v1 demo:

- `server_v1/static/js/dist/pipes-runtime.js`

## Notes

The root `pipes/` directory is now the canonical source for the pipes runtime.
The `server_v1` dist bundle is kept so the existing demo continues to work.