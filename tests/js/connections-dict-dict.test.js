/*
connectionsDictDict example tests.

Minimal format:

    connectionsDictDict: {
        start: { to: ['finish'] },
        finish: { from: ['start'] },
    }

This is the default graph format in v2.
It reads as adjacency data and is the most direct way to describe fan-out and merge.
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

test('connectionsDictDict is the default format and fans into a merge node', async () => {
    /* setup */
    const { Graph, Stepper } = loadGraphRuntime()

    const graph = new Graph({
        connectionsDictDict: {
            start: { to: ['left', 'right'] },
            left: { from: ['start'], to: ['finish'] },
            right: { from: ['start'], to: ['finish'] },
            finish: { from: ['left', 'right'] },
        },
        nodes: {
            start: (value) => value,
            left: (value) => value + 1,
            right: (value) => value + 2,
            finish: {
                mergeNode: true,
                handler: (values) => values.reduce((total, value) => total + value, 0),
            },
        },
    })

    /* assert */
    assert.deepEqual(Array.from(graph.getNextNodeIds('start')), ['left', 'right'])

    const stepper = graph.stepper('start', Stepper)
    stepper.start(5)

    /* run */
    stepper.step()
    await stepper.waitForStepComplete()

    const mergedRows = stepper.step()
    await stepper.waitForStepComplete()

    /* assert */
    assert.deepEqual(Array.from(mergedRows, (row) => row.nodeName), ['finish'])
    assert.deepEqual(toPlain(await mergedRows[0].input.promise), [6, 7])

    /* run */
    stepper.step()
    await stepper.waitForStepComplete()

    /* assert */
    assert.deepEqual(toPlain(stepper.stash), { finish: [13] })
})

test('connectionsDictDict works when handlers return promises', async () => {
    /*
    This is the smallest promise example on the default format.
    The graph shape does not change; only handler timing and input mode change.
    */

    /* setup */
    const { Graph, Stepper } = loadGraphRuntime()

    const graph = new Graph({
        connectionsDictDict: {
            start: { to: ['finish'] },
            finish: { from: ['start'] },
        },
        nodes: {
            start: async (value) => value + 3,
            finish: {
                expectsPromise: true,
                handler: (valuePromise) => Promise.resolve(valuePromise).then((value) => value * 4),
            },
        },
    })

    const stepper = graph.stepper('start', Stepper)
    stepper.start(2)

    /* run */
    stepper.step()
    await stepper.waitForStepComplete()
    stepper.step()
    await stepper.waitForStepComplete()

    /* assert */
    assert.deepEqual(toPlain(stepper.stash), { finish: [20] })
})

test('connectionsDictDict addConnection and removeConnection keep forward and reverse indexes in sync', () => {
    /* setup */
    const { Graph } = loadGraphRuntime()

    const graph = new Graph({
        connectionsDictDict: {},
        nodes: {},
    })

    /* run */
    graph.addConnection('start', 'finish')

    /* assert */
    assert.deepEqual(toPlain(graph.data.connectionsDictDict), {
        start: { to: ['finish'] },
        finish: { from: ['start'] },
    })
    assert.deepEqual(Array.from(graph.getNextNodeIds('start')), ['finish'])
    assert.deepEqual(Array.from(graph.getPrevNodeIds('finish')), ['start'])

    /* run */
    assert.equal(graph.removeConnection('start', 'finish'), true)

    /* assert */
    assert.deepEqual(toPlain(graph.data.connectionsDictDict), {})
    assert.deepEqual(Array.from(graph.getNextNodeIds('start')), [])
    assert.deepEqual(Array.from(graph.getPrevNodeIds('finish')), [])
})