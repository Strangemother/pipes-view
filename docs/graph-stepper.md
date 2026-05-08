# Graph Stepper

Minimal guide for the promise-based graph stepper.

## What it is

The stepper is a small execution engine for a graph of named nodes.

- A graph node receives the resolved input value by default.
- A `step()` call executes one frontier of waiting nodes.
- The resolved result of each node is passed to the next frontier.
- Terminal results are stored in `stepper.stash`.
- Merge nodes collapse duplicate next calls into one call with multiple resolved values.

Primary source files:

- `graph/src/graph.js`
- `graph/src/graph-stepper.js`
- demo usage: `server_v2/static/js/index.js`

Compatibility bundle for the existing v2 demo:

- `server_v2/static/js/dist/graph-runtime.js`

## Basic setup

```js
const graph = new Graph({
  connectionsDictDict: {
    a: { to: ['b'] },
    b: { from: ['a'] },
  },
  nodes: {
    a: (valuePromise) => Promise.resolve(valuePromise).then((value) => value + 1),
    b: (valuePromise) => Promise.resolve(valuePromise).then((value) => value * 2),
  },
})

const stepper = graph.stepper('a')
stepper.start(10)
```

## Manual stepping

Use `start(...)` once, then call `step()` when you want to advance.

```js
stepper.start(10)

stepper.step()   // executes a, queues b
stepper.step()   // executes b, stash now contains terminal result

console.log(stepper.stash)
```

Notes:

- `start(...)` seeds the first waiting row.
- `step()` returns the next waiting rows.
- Each node function receives the resolved input value by default.

## Graph API

Defined in `server_v2/static/js/src/graph-2.js`.

### `graph.stepper(origin, StepperClass)`

Create a stepper for the graph.

```js
const stepper = graph.stepper('a')
const custom = graph.stepper('a', MyStepper)
```

### `graph.getStepperClass()`

Default stepper class factory hook.

Override this in a graph subclass when you always want a custom stepper.

```js
class MyGraph extends Graph {
  getStepperClass() {
    return MyStepper
  }
}

### `graph.dataType = 'pipDict'`

Use `pipDict` when each edge carries sender and receiver pip metadata.

```js
const graph = new Graph({
  connectionsPipDicts: [
    {
      sender: { label: 'a', direction: 'outbound', pipIndex: 0 },
      receiver: { label: 'b', direction: 'inbound', pipIndex: 1 },
    },
  ],
  nodes: {
    a: (value) => [value + 1],
    b: (value) => value[1],
  },
})

graph.dataType = 'pipDict'
```

This format preserves the full edge object, so a custom stepper can route by outbound and inbound pip index.
```

## Stepper API

Defined in `server_v2/static/js/src/graph-stepper.js`.

### `setOrigin(start)`

Set the start node name.

```js
stepper.setOrigin('a')
```

### `start(...args)`

Seed the first frontier.

```js
stepper.start(1, 2)
```

### `step()`

Execute the current frontier and return the next waiting frontier.

```js
const rows = stepper.step()
console.log(rows.map((row) => row.nodeName))
```

### `getCurrentStepState()`

Return the current tracked step state.

Shape:

- `currentRows`
- `nextRows`
- `executions`
- `completion`

```js
const state = stepper.getCurrentStepState()
```

### `waitForStepComplete()`

Wait for every node in the last `step()` frontier to settle.

```js
await stepper.waitForStepComplete()
```

### `autoStep(delay = 0)`

Run the graph automatically.

This waits for the full current frontier to complete, then waits `delay`, then calls `step()` again.

```js
stepper.start(1)
const run = stepper.autoStep(250)
await run.promise
```

Returned state:

- `delay`
- `stopped`
- `timerId`
- `promise`

### `stopAutoStep(reason = 'stopped')`

Stop a running auto-step session.

```js
stepper.stopAutoStep('user-cancelled')
```

## Node contract

The default contract is value-first.

```js
a: (value) => value + 1
```

Async handlers can still return a promise.

```js
a: async (value) => value + 1
```

The stepper tracks results through promises internally.

### Opt-in promise input mode

If a node needs the raw input promise, opt in explicitly.

```js
b: {
  expectsPromise: true,
  handler: (valuePromise) => Promise.resolve(valuePromise).then((value) => value * 2),
}
```

## Merge nodes

Merge nodes allow multiple incoming rows to become one call.

If multiple upstream nodes target the same next node and that node has `mergeNode: true`, the stepper calls it once with the merged resolved values.

```js
const graph = new Graph({
  connectionsDictDict: {
    a: { to: ['b', 'c'] },
    b: { to: ['e'] },
    c: { to: ['e'] },
  },
  nodes: {
    a: (v) => v,
    b: (v) => v + 1,
    c: (v) => v + 2,
    e: {
      mergeNode: true,
      handler: (values) => values.reduce((a, b) => a + b, 0),
    },
  },
})
```

Notes:

- without `mergeNode: true`, the target node is called once per incoming row
- with `mergeNode: true`, the target node is called once per frontier

## Pip-index stepper

Defined in `server_v2/static/js/src/graph-stepper.js` as `PipIndexStepper`.

Use this stepper when node output channels and edge pip indices should control routing.

```js
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
```

Behavior:

- each outgoing edge selects a value from the node result using `sender.pipIndex`
- the selected value is wrapped into the downstream input slot at `receiver.pipIndex`
- merge nodes combine multiple inbound rows into one indexed input value

For a runnable browser example, see `server_v2/static/js/index.js` and use `prepareDemoPipStepper()`.

## Hook methods

Subclass `Stepper` to override behavior.

### Start and step hooks

- `onStart(rows, args)`
- `onStep(rows)`
- `onStepComplete(currentRows, nextRows, completed)`

Example:

```js
class LogStepper extends Stepper {
  onStep(rows) {
    console.log('next frontier', rows.map((row) => row.nodeName))
    return rows
  }
}
```

### Auto-step hooks

- `onAutoStepScheduled(currentRows, nextRows, delay)`
- `onAutoStepComplete(currentRows, nextRows)`
- `onAutoStepStop(reason)`

Example:

```js
class TimedStepper extends Stepper {
  onAutoStepScheduled(currentRows, nextRows, delay) {
    console.log('frontier complete', currentRows, 'next', nextRows)
    return delay
  }
}
```

### Node lifecycle hooks

- `onNodeExecute(nodeName, node, nextNodes, input)`
- `onNodeComplete(nodeName, node, nextNodes, input, value)`
- `onNodeError(nodeName, node, nextNodes, input, error)`
- `onStash(nodeName, value, stash)`

Example:

```js
class UiStepper extends Stepper {
  onNodeExecute(nodeName, node, nextNodes, input) {
    console.log('execute', nodeName)
    return input
  }

  onNodeComplete(nodeName, node, nextNodes, input, value) {
    console.log('complete', nodeName, value)
    return value
  }

  onStash(nodeName, value, stash) {
    console.log('stash', nodeName, value)
    return value
  }
}
```

Hook rules:

- returning `undefined` keeps the default value/path
- returning a value from `onNodeComplete(...)` changes the downstream result
- returning a value from `onStash(...)` changes what is stored in `stash`

## Slightly advanced usage

Use a custom graph class to bind a custom stepper once.

```js
class DemoStepper extends Stepper {
  onNodeExecute(nodeName, node, nextNodes, input) {
    console.log('execute', nodeName)
    return input
  }
}

class DemoGraph extends Graph {
  getStepperClass() {
    return DemoStepper
  }
}

const graph = new DemoGraph(myData)
const stepper = graph.stepper('a')
```

## Demo reference

The browser demo in `server_v2/static/js/index.js` shows:

- custom stepper subclassing
- DOM class toggling from hooks
- merge nodes
- random async node delay
- manual stepping helpers

## Quick start checklist

1. Define `connectionsDictDict`.
2. Define `nodes` using promise-based handlers.
3. Create a graph with `new Graph(data)`.
4. Build a stepper with `graph.stepper('startNode')`.
5. Call `start(...)` once.
6. Use `step()` manually or `autoStep(delay)`.
7. Read terminal results from `stepper.stash`.