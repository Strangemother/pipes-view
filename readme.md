# Pipes

Pipes is a very simple graph library for executing nodes in a graph. It's designed to be easy to understand, without the complex theory.

1. Run actions in flows
2. Visualize flows 
3. Easy build complex graphs

## Getting Started

Pipes is bundled as a single file. You can include it in your HTML with:

```html
<script src="path/to/graph-runtime.js"></script>
```

Here is the most minimal example of connecting two nodes:

```js
const graph = new Graph({
  connections: {
    a: ['b'],
  },
    nodes: {
        a: (v) => v + 1,
        b: (v) => v * 2,
    },
})

const stepper = graph.stepper('a')
stepper.start(10) // starts at node 'a' with value 10
```

That's it! This will _run_ the graph from the chosen start node. Your functions do whatever you want.

## So What is it?

It's a bunch of connections to your functions or objects. You can query to run the 'graph'.

**What can it do?**

A graph allows many paradigms. You can mimic extremely complex interconnected behavior, or use it to chain functions.
Graphs can be used as data or runtime. This library allows both. 


---

## Connections and Node

We can setup connections and nodes in a few different ways. First we need some nodes; we'll apply functions:

```js
nodes = {
  a: (v) => v,
  b: (v) => v + 1,
  c: (v) => v + 2,
  e: (v) => v.reduce((a, b) => a + b, 0),
}
```

Connections can be defined as a simple adjacency list:

```js
connections = {
  a: ['b', 'c'],
  b: ['e'],
  c: ['e'],
}
```

This means 'a' sends to 'b' and 'c', and both 'b' and 'c' send to 'e'.

Finally we can combine these into a graph:

```js
const graph = new Graph({
  connections, nodes,
})
```

This can be _read_ or _executed_. In both cases, the graph is traversed in topological order:

    a -> b -> e
     \
      -> c -> e


### Connection options

connections can also be defined as a list of connection objects, which allows for more options:

```js
const graph = new Graph({
  connections: [
    { sender: 'a', receiver: 'b' },
    { sender: 'a', receiver: 'c' },
    { sender: 'b', receiver: 'e' },
    { sender: 'c', receiver: 'e' },
  ],
})
```

### Merge nodes

Merge nodes allow multiple incoming rows to become one call.

If multiple upstream nodes target the same next node and that node has `mergeNode: true`, the stepper calls it once with the merged resolved values.

```js
const graph = new Graph({
  connections: {
    a: ['b', 'c'],
    b: ['e'],
    c: ['e'],
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





---

![screenshot](screenshot.png)

## Overview

Pipe view is a visual graph of windows. It allows you to connect windows together with pipes, and execute them in a sequence.

Under the hood we currently use winbox for the windows, and petite vue for the UI. The pipes are drawn on a canvas layer.

## Tests

JavaScript tests live in `tests/js` and run with Node's built-in test runner.

Run them with:

```bash
npm test
```

## Build

The v2 graph runtime can be bundled into one browser-ready file.

Run:

```bash
npm run build
```

Output:

```text
server_v2/static/js/dist/graph-runtime.js
server_v1/static/js/dist/pipes-runtime.js
```

The bundle exposes `window.Graph`, `window.Stepper`, `window.PipIndexStepper`, and `window.GraphRuntime`.

The pipes bundle exposes `window.PipesTool`, `window.createPipesRuntime`, and `window.PipesRuntime`.

Component-specific pipes documentation lives in `server_v1/static/js/README.md`.



## Update 0.1

It works great.

- Pipes connected through the view, drag drop connections
- zoomable and draggable
- mini wrap of windows with vue js
- Step execution through simple execute/step process.
- Execute highlight: To show what's running.

### UI Choices:

- pipes is a canvas layer drawing node to node
- Zooming is managed independently
- The view is WinBox

I thought winbox would be super useful here as I really like the libraryy. However I quickly noticed it's more than I need. I will replace it with a simple div with absolute positioning. This will allow me to have more control over the UI and remove unnecessary features.

### Next Steps

Now refactored I will implement missing features

- Back/fore pipe draw swap: The canvas currently runs one layer - we want more than one.
    - and also an animate layer
- Rewrite the graph executor: The existing logic is a bit messy and doesn't handle all cases well.

### Links

- winbox: https://nextapps-de.github.io/winbox/
- petite vue: https://github.com/vuejs/petite-vue

---

## Old

### What is it:

A point to point graph of windows.

1. draggable divs.
2. HTML Content
3. Pull Points

Each panel has input and output nodes.

### Panel

A Panel is a window.js div. Has:

- header
- content
- tips
- locality.


### Nodes

A panel has pips as input or output nodes. By default _one_.
A node is connected to another using a line.

Considering an output, a many edges may connect to one node, and therefore messages are sent parallel.

Multiple pips can run in index, waiting for the first to resolve.

    [] ->

    ---

    [] ->
       ->

    ---

    [] ->
       ->
    [] ->

Same with input.


### Lines

The graph will be a dict, rendered lines with canvas for each point. probably bezier curves because they're easy