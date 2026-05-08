# Graph Package

This is the root-level home of the graph runtime.

Use this directory as the current package boundary for the graph tool.

## Layout

- `src/graph-stepper.js`
- `src/graph.js`
- `dist/graph-runtime.js`

## Build

```bash
npm run build
```

Primary output:

```text
graph/dist/graph-runtime.js
```

Compatibility output for the existing v2 demo:

```text
server_v2/static/js/dist/graph-runtime.js
```

## Browser import

```html
<script src="./graph/dist/graph-runtime.js"></script>
```

Globals:

- `window.Graph`
- `window.Stepper`
- `window.PipIndexStepper`
- `window.GraphRuntime`

## Use It Now

1. Run `npm run build`.
2. Import `graph/dist/graph-runtime.js`.
3. Create a `Graph` with nodes and connections.
4. Create a stepper.
5. Call `start(...)` and `step()`.

## Minimal Example

```html
<script src="./graph/dist/graph-runtime.js"></script>
<script>
	const graph = new Graph({
		connectionsDictDict: {
			a: { to: ['b'] },
			b: { from: ['a'] },
		},
		nodes: {
			a: (value) => value + 1,
			b: (value) => value * 2,
		},
	})

	const stepper = graph.stepper('a')

	stepper.start(5)
	stepper.step()

	stepper.waitForStepComplete().then(() => {
		stepper.step()
		return stepper.waitForStepComplete()
	}).then(() => {
		console.log(stepper.stash)
	})
</script>
```

Expected terminal result:

```js
{ b: [12] }
```

## Connection Formats

The graph runtime currently supports these formats:

- `connectionsDictDict`
- `connectionsDicts`
- `connectionsList`
- `connectionsPipDicts`

The simplest default is `connectionsDictDict`.

## Pip Index Example

Use `PipIndexStepper` when node outputs should route through indexed channels.

```html
<script src="./graph/dist/graph-runtime.js"></script>
<script>
	const graph = new Graph({
		connectionsPipDicts: [
			{
				sender: { label: 'a', direction: 'outbound', pipIndex: 0 },
				receiver: { label: 'b', direction: 'inbound', pipIndex: 1 },
			},
			{
				sender: { label: 'a', direction: 'outbound', pipIndex: 1 },
				receiver: { label: 'c', direction: 'inbound', pipIndex: 0 },
			},
		],
		nodes: {
			a: (value) => [value + 1, value + 2],
			b: (value) => value[1],
			c: (value) => value[0],
		},
	})

	graph.dataType = 'pipDict'

	const stepper = graph.stepper('a', PipIndexStepper)
	stepper.start(10)
	stepper.step()
</script>
```

## Common Methods

```js
const graph = new Graph(data)
const stepper = graph.stepper('start')

stepper.start(1)
stepper.step()
stepper.getCurrentStepState()
stepper.waitForStepComplete()
stepper.autoStep(250)
stepper.stopAutoStep()
```

## Source And Demo

Canonical source:

- `graph/src/graph.js`
- `graph/src/graph-stepper.js`

Compatibility output for the existing v2 demo:

- `server_v2/static/js/dist/graph-runtime.js`

## Notes

The root `graph/` directory is now the canonical source for the graph runtime.
The `server_v2` dist bundle is kept so the existing demo continues to work.