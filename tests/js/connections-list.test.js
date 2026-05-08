/*
connectionsList example tests.

Minimal format:

    connectionsList: [
        ['start', 'finish'],
    ]

Use this when the edge only needs two node labels.
It is the leanest format in this graph layer.
*/

const assert = require('node:assert/strict')
const test = require('node:test')

const { loadGraphRuntime } = require('./helpers/load-graph-runtime')

/*
Normalize VM values into plain Node values so assertions stay readable.
*/
const toPlain = function(value) {
    return JSON.parse(JSON.stringify(value))
}

test('connectionsList works as a lean value-first graph example', async () => {
    /* setup */
    const { Graph, Stepper } = loadGraphRuntime()

    const graph = new Graph({
        connectionsList: [
            ['start', 'finish'],
        ],
        nodes: {
            start: (value) => value + 1,
            finish: (value) => value * 2,
        },
    })

    graph.dataType = 'listList'

    /* assert */
    assert.deepEqual(Array.from(graph.getNextNodeIds('start')), ['finish'])

    const stepper = graph.stepper('start', Stepper)
    stepper.start(4)

    /* run */
    const queuedRows = stepper.step()
    await stepper.waitForStepComplete()

    /* assert */
    assert.deepEqual(Array.from(queuedRows, (row) => row.nodeName), ['finish'])

    /* run */
    stepper.step()
    await stepper.waitForStepComplete()

    /* assert */
    assert.deepEqual(toPlain(stepper.stash), { finish: [10] })
})

test('connectionsList also works with promise-based handlers', async () => {
    /*
    The edge format stays the same.
    Only the node contract changes: the first node is async and the second
    node opts into the raw promise input.
    */

    /* setup */
    const { Graph, Stepper } = loadGraphRuntime()

    const graph = new Graph({
        connectionsList: [
            ['start', 'finish'],
        ],
        nodes: {
            start: async (value) => value + 1,
            finish: {
                expectsPromise: true,
                handler: (valuePromise) => Promise.resolve(valuePromise).then((value) => value * 2),
            },
        },
    })

    graph.dataType = 'listList'

    const stepper = graph.stepper('start', Stepper)
    stepper.start(6)

    /* run */
    stepper.step()
    await stepper.waitForStepComplete()
    stepper.step()
    await stepper.waitForStepComplete()

    /* assert */
    assert.deepEqual(toPlain(stepper.stash), { finish: [14] })
})

test('connectionsList addConnection and removeConnection update the pair list', () => {
    /* setup */
    const { Graph } = loadGraphRuntime()

    const graph = new Graph({
        connectionsList: [],
        nodes: {},
    })

    graph.dataType = 'listList'

    /* run */
    graph.addConnection('start', 'finish')

    /* assert */
    assert.deepEqual(toPlain(graph.data.connectionsList), [
        ['start', 'finish'],
    ])
    assert.deepEqual(Array.from(graph.getNextNodeIds('start')), ['finish'])
    assert.deepEqual(Array.from(graph.getPrevNodeIds('finish')), ['start'])

    /* run */
    assert.equal(graph.removeConnection('start', 'finish'), true)

    /* assert */
    assert.deepEqual(toPlain(graph.data.connectionsList), [])
    assert.deepEqual(Array.from(graph.getNextNodeIds('start')), [])
    assert.deepEqual(Array.from(graph.getPrevNodeIds('finish')), [])
})