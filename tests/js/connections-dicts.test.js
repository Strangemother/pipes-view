/*
connectionsDicts example tests.

Minimal format:

    connectionsDicts: [
        { sender: 'start', receiver: 'finish' },
    ]

Use this when an edge is still simple, but you want a named object shape.
That leaves room for extra edge fields such as width or style.
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

test('connectionsDicts shows the sender receiver object format', async () => {
    /* setup */
    const { Graph, Stepper } = loadGraphRuntime()

    const graph = new Graph({
        connectionsDicts: [
            { sender: 'start', receiver: 'finish', width: 3 },
        ],
        nodes: {
            start: (value) => value + 2,
            finish: (value) => value * 3,
        },
    })

    graph.dataType = 'listDict'

    /* assert */
    assert.deepEqual(Array.from(graph.getNextNodeIds('start')), ['finish'])

    const stepper = graph.stepper('start', Stepper)
    stepper.start(2)

    /* run */
    stepper.step()
    await stepper.waitForStepComplete()
    stepper.step()
    await stepper.waitForStepComplete()

    /* assert */
    assert.deepEqual(toPlain(stepper.stash), { finish: [12] })
})

test('connectionsDicts supports async nodes and raw promise input', async () => {
    /*
    This keeps the same connection format and only swaps the node behavior.
    It is the smallest example of `expectsPromise: true` on the object edge form.
    */

    /* setup */
    const { Graph, Stepper } = loadGraphRuntime()

    const graph = new Graph({
        connectionsDicts: [
            { sender: 'start', receiver: 'finish' },
        ],
        nodes: {
            start: async (value) => value + 2,
            finish: {
                expectsPromise: true,
                handler: async (valuePromise) => {
                    const value = await valuePromise
                    return value * 3
                },
            },
        },
    })

    graph.dataType = 'listDict'

    const stepper = graph.stepper('start', Stepper)
    stepper.start(5)

    /* run */
    stepper.step()
    await stepper.waitForStepComplete()
    stepper.step()
    await stepper.waitForStepComplete()

    /* assert */
    assert.deepEqual(toPlain(stepper.stash), { finish: [21] })
})