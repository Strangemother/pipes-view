/*
connectionsPipDicts example tests.

Minimal format:

    connectionsPipDicts: [
        {
            sender: { label: 'a', direction: 'outbound', pipIndex: 0 },
            receiver: { label: 'b', direction: 'inbound', pipIndex: 1 },
        },
    ]

Use this when the edge carries routing data.
The sender pip chooses which output channel leaves the node.
The receiver pip chooses which input slot the next node sees.
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

test('connectionsPipDicts presents indexed sender receiver routing', async () => {
    /* setup */
    const { Graph, PipIndexStepper } = loadGraphRuntime()

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
            {
                sender: { label: 'b', direction: 'outbound', pipIndex: 0 },
                receiver: { label: 'finish', direction: 'inbound', pipIndex: 0 },
            },
            {
                sender: { label: 'c', direction: 'outbound', pipIndex: 0 },
                receiver: { label: 'finish', direction: 'inbound', pipIndex: 1 },
            },
        ],
        nodes: {
            a: (value) => [value + 1, value + 2],
            b: (value) => (value[1] || 0) * 2,
            c: (value) => (value[0] || 0) + 5,
            finish: {
                mergeNode: true,
                handler: (value) => (value[0] || 0) + (value[1] || 0),
            },
        },
    })

    graph.dataType = 'pipDict'

    /* assert */
    assert.deepEqual(toPlain(graph.getNextConnectionEntries('a')), [
        {
            sender: { label: 'a', direction: 'outbound', pipIndex: 0 },
            receiver: { label: 'b', direction: 'inbound', pipIndex: 1 },
        },
        {
            sender: { label: 'a', direction: 'outbound', pipIndex: 1 },
            receiver: { label: 'c', direction: 'inbound', pipIndex: 0 },
        },
    ])

    const stepper = graph.stepper('a', PipIndexStepper)
    stepper.start(3)

    /* run */
    const routedRows = stepper.step()
    await stepper.waitForStepComplete()

    /* assert */
    assert.deepEqual(Array.from(routedRows, (row) => row.nodeName), ['b', 'c'])
    assert.deepEqual(toPlain(await routedRows[0].input.promise), [null, 4])
    assert.deepEqual(toPlain(await routedRows[1].input.promise), [5])

    /* run */
    const mergedRows = stepper.step()
    await stepper.waitForStepComplete()

    /* assert */
    assert.deepEqual(toPlain(await mergedRows[0].input.promise), [8, 10])

    /* run */
    stepper.step()
    await stepper.waitForStepComplete()

    /* assert */
    assert.deepEqual(toPlain(stepper.stash), { finish: [18] })
})

test('connectionsPipDicts also works with async pip-aware handlers', async () => {
    /*
    This version keeps the same routing graph and moves the work into async
    handlers that consume promise input. The example is still focused on the
    edge format, but it also shows the promise contract on the pip-aware path.
    */

    /* setup */
    const { Graph, PipIndexStepper } = loadGraphRuntime()

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
            {
                sender: { label: 'b', direction: 'outbound', pipIndex: 0 },
                receiver: { label: 'finish', direction: 'inbound', pipIndex: 0 },
            },
            {
                sender: { label: 'c', direction: 'outbound', pipIndex: 0 },
                receiver: { label: 'finish', direction: 'inbound', pipIndex: 1 },
            },
        ],
        nodes: {
            a: async (value) => [value + 1, value + 2],
            b: {
                expectsPromise: true,
                handler: async (valuePromise) => {
                    const value = await valuePromise
                    return (value[1] || 0) * 2
                },
            },
            c: {
                expectsPromise: true,
                handler: async (valuePromise) => {
                    const value = await valuePromise
                    return (value[0] || 0) + 5
                },
            },
            finish: {
                mergeNode: true,
                expectsPromise: true,
                handler: async (valuePromise) => {
                    const value = await valuePromise
                    return (value[0] || 0) + (value[1] || 0)
                },
            },
        },
    })

    graph.dataType = 'pipDict'

    const stepper = graph.stepper('a', PipIndexStepper)
    stepper.start(4)

    /* run */
    stepper.step()
    await stepper.waitForStepComplete()
    stepper.step()
    await stepper.waitForStepComplete()
    stepper.step()
    await stepper.waitForStepComplete()

    /* assert */
    assert.deepEqual(toPlain(stepper.stash), { finish: [21] })
})

test('connectionsPipDicts addConnection and removeConnection match pip endpoints', () => {
    /* setup */
    const { Graph } = loadGraphRuntime()

    const graph = new Graph({
        connectionsPipDicts: [],
        nodes: {},
    })

    graph.dataType = 'pipDict'

    /* run */
    const connection = graph.addConnection('start', 'finish', 1, 2, { width: 4 })

    /* assert */
    assert.deepEqual(toPlain(graph.data.connectionsPipDicts), [
        {
            sender: { label: 'start', direction: 'outbound', pipIndex: 1 },
            receiver: { label: 'finish', direction: 'inbound', pipIndex: 2 },
            line: { width: 4 },
        },
    ])
    assert.deepEqual(Array.from(graph.getNextNodeIds('start')), ['finish'])
    assert.deepEqual(Array.from(graph.getPrevNodeIds('finish')), ['start'])
    assert.deepEqual(toPlain(graph.getNextConnectionEntries('start')), [toPlain(connection)])

    /* run */
    assert.equal(graph.removeConnection(connection), true)

    /* assert */
    assert.deepEqual(toPlain(graph.data.connectionsPipDicts), [])
    assert.deepEqual(Array.from(graph.getNextNodeIds('start')), [])
    assert.deepEqual(Array.from(graph.getPrevNodeIds('finish')), [])
})