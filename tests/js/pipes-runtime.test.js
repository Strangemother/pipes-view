const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const createFakeContext2d = function() {
    return {
        clearRect() {},
        rect() {},
        fill() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        bezierCurveTo() {},
        stroke() {},
        arc() {},
        fillStyle: '#000',
        lineWidth: 1,
        strokeStyle: '#000',
    }
}

const createFakeCanvas = function(rect) {
    const listeners = new Map()

    return {
        width: rect.width,
        height: rect.height,
        addEventListener(name, handler) {
            listeners.set(name, handler)
        },
        getListener(name) {
            return listeners.get(name)
        },
        getBoundingClientRect() {
            return rect
        },
        getContext() {
            return createFakeContext2d()
        },
    }
}

const createFakeDocument = function(canvasesBySelector) {
    const listeners = new Map()

    return {
        addEventListener(name, handler) {
            const existing = listeners.get(name) || []
            existing.push(handler)
            listeners.set(name, existing)
        },
        dispatchEvent(event) {
            const handlers = listeners.get(event.type) || []
            handlers.forEach((handler) => handler(event))
            return true
        },
        querySelector(selector) {
            return canvasesBySelector[selector]
        },
    }
}

const createTipNode = function(x, y) {
    return {
        getBoundingClientRect() {
            return {
                x,
                y,
                width: 10,
                height: 10,
            }
        },
    }
}

const toPlain = function(value) {
    return JSON.parse(JSON.stringify(value))
}

const loadPipesRuntime = function() {
    const repoRoot = path.resolve(__dirname, '..', '..')
    const backCanvas = createFakeCanvas({ left: 0, top: 0, width: 220, height: 120 })
    const foreCanvas = createFakeCanvas({ left: 0, top: 0, width: 220, height: 120 })
    const document = createFakeDocument({
        '.back': backCanvas,
        '.fore': foreCanvas,
    })

    const tips = {
        'start:outbound:0': { node: createTipNode(20, 20) },
        'finish:inbound:0': { node: createTipNode(180, 20) },
    }

    const context = {
        console,
        Math,
        setTimeout,
        clearTimeout,
        requestAnimationFrame() {
            return 1
        },
        cancelAnimationFrame() {},
        document,
        CustomEvent: class CustomEvent {
            constructor(type, init={}) {
                this.type = type
                this.detail = init.detail
            }
        },
        app: {
            windowMap: {},
            getTip(label, direction, pipIndex=0) {
                return tips[`${label}:${direction}:${pipIndex}`]
            },
        },
    }

    context.global = context
    context.globalThis = context
    context.window = context

    vm.createContext(context)

    const runtimeFiles = [
        path.join(repoRoot, 'pipes', 'src', 'pipe-events.js'),
        path.join(repoRoot, 'pipes', 'src', 'canvas-layer.js'),
        path.join(repoRoot, 'pipes', 'src', 'pipes-tool.js'),
        path.join(repoRoot, 'pipes', 'src', 'pipes-runtime.js'),
    ]

    for(const filePath of runtimeFiles) {
        const source = fs.readFileSync(filePath, 'utf8')
        vm.runInContext(source, context, { filename: filePath })
    }

    return {
        CanvasLayer: vm.runInContext('CanvasLayer', context),
        CanvasLayerGroup: vm.runInContext('CanvasLayerGroup', context),
        PipesTool: vm.runInContext('PipesTool', context),
        pipeData: vm.runInContext('pipeData', context),
        dispatchRemovePipeEvent: vm.runInContext('dispatchRemovePipeEvent', context),
        document: context.document,
        CustomEvent: context.CustomEvent,
        backCanvas,
        foreCanvas,
    }
}

test('CanvasLayerGroup removes a rendered pipe by hit-testing the visual line', () => {
    const { CanvasLayer, CanvasLayerGroup, pipeData, foreCanvas } = loadPipesRuntime()

    const backLayer = new CanvasLayer('.back')
    const foreLayer = new CanvasLayer('.fore')
    const group = new CanvasLayerGroup(backLayer, foreLayer)
    const connection = {
        sender: { label: 'start', direction: 'outbound', pipIndex: 0 },
        receiver: { label: 'finish', direction: 'inbound', pipIndex: 0 },
        line: { design: 'straight', color: '#222' },
    }

    group.connectNodes(connection)
    group.renderConnections()

    assert.deepEqual(Object.keys(pipeData.connections), ['start-0-finish-0'])
    assert.ok(foreLayer.lines['start-0-finish-0'])

    const removed = group.removeConnectionNearPoint(105, 25)

    assert.equal(removed, true)
    assert.deepEqual(Object.keys(pipeData.connections), [])
    assert.deepEqual(Object.keys(foreLayer.lines), [])
    assert.deepEqual(toPlain(pipeData.raw), [])

    group.connectNodes(connection)
    group.renderConnections()

    const contextMenuHandler = foreCanvas.getListener('contextmenu')
    assert.equal(typeof contextMenuHandler, 'function')

    contextMenuHandler({
        clientX: 105,
        clientY: 25,
        preventDefault() {},
    })

    assert.deepEqual(Object.keys(pipeData.connections), [])
})

test('PipesTool works without bundled graph helpers and delegates pipe removal', () => {
    const { PipesTool } = loadPipesRuntime()

    let removedTarget = null
    let cleared = 0
    const app = {
        windowMap: {
            alpha: {
                unmountCalled: 0,
                closeCalled: 0,
                unmount() {
                    this.unmountCalled += 1
                },
                close() {
                    this.closeCalled += 1
                },
            },
        },
    }
    const layerGroup = {
        removeConnection(target) {
            removedTarget = target
            return true
        },
        clearConnections() {
            cleared += 1
        },
        draw() {},
        animDraw() {},
    }

    const tool = new PipesTool({ app, layerGroup })
    const target = { id: 'pipe-1' }

    assert.equal(tool.save(), false)
    assert.equal(tool.restore(), false)
    assert.equal(tool.deletePipe(target), true)
    assert.equal(removedTarget, target)

    tool.clear()

    assert.equal(cleared, 1)
    assert.deepEqual(toPlain(app.windowMap), {})
})

test('dispatchRemovePipeEvent routes through the shared document event channel', () => {
    const { CanvasLayer, CanvasLayerGroup, pipeData, dispatchRemovePipeEvent, document, CustomEvent } = loadPipesRuntime()

    const backLayer = new CanvasLayer('.back')
    const foreLayer = new CanvasLayer('.fore')
    new CanvasLayerGroup(backLayer, foreLayer)

    const connection = {
        sender: { label: 'start', direction: 'outbound', pipIndex: 0 },
        receiver: { label: 'finish', direction: 'inbound', pipIndex: 0 },
        line: { design: 'straight' },
    }

    document.dispatchEvent(new CustomEvent('connectnodes', { detail: connection }))
    assert.deepEqual(Object.keys(pipeData.connections), ['start-0-finish-0'])

    dispatchRemovePipeEvent(connection)
    assert.deepEqual(Object.keys(pipeData.connections), [])
})