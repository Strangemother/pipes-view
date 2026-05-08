const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

let cachedRuntime = undefined

const getRuntimeFilePaths = function() {
    const repoRoot = path.resolve(__dirname, '..', '..', '..')
    return [
        path.join(repoRoot, 'graph', 'src', 'graph-stepper.js'),
        path.join(repoRoot, 'graph', 'src', 'graph.js'),
    ]
}

const createTestConsole = function() {
    return {
        ...console,
        log() {},
        debug() {},
    }
}

const loadGraphRuntime = function() {
    if(cachedRuntime != undefined) {
        return cachedRuntime
    }

    const context = {
        console: createTestConsole(),
        Promise,
        setTimeout,
        clearTimeout,
    }

    context.global = context
    context.globalThis = context
    context.window = context

    vm.createContext(context)

    for(const filePath of getRuntimeFilePaths()) {
        const source = fs.readFileSync(filePath, 'utf8')
        vm.runInContext(source, context, { filename: filePath })
    }

    cachedRuntime = {
        Graph: vm.runInContext('Graph', context),
        Stepper: vm.runInContext('Stepper', context),
        PipIndexStepper: vm.runInContext('PipIndexStepper', context),
    }

    return cachedRuntime
}

module.exports = {
    loadGraphRuntime,
}