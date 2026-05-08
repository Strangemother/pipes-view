/*
The PipeTool is the convience wrapper to capture all assets for the view.

- app: the view app
- walker: An executor
- lights: the highlighter tool
- layerGroup: the canvas manager

Then some convenience tools.

The vue app executes functonality through this.
*/

class PipesTool {
    //  user tool to access all the bits easily.
    filename = 'pipes-tool-graph'
    constructor(conf={}) {
        this.app = conf.app || globalThis.app || { windowMap: {} }
        this.walker = conf.walker || null
        this.lights = conf.lights || null
        this.layerGroup = conf.layerGroup || globalThis.clItems
    }

    draw(){
        this.layerGroup.draw.apply(this.layerGroup, arguments)
    }

    save(name = this.filename) {
        // simple save method
        if(this.walker?.saveToLocalStorage == undefined) {
            console.warn('PipesTool.save requires an injected walker with saveToLocalStorage().')
            return false
        }
        this.walker.saveToLocalStorage(name)
        return true
    }

    restore(name = this.filename) {
        if(this.walker?.restoreFromLocalStorage == undefined || this.walker?.restorePositions == undefined) {
            console.warn('PipesTool.restore requires an injected walker with local-storage restore helpers.')
            return false
        }
        this.walker.restoreFromLocalStorage(name)
        this.walker.restorePositions(name)
        setTimeout(() => {
            this.draw()
        }, 300);
        return true
    }

    clear(){
        /* Wipe from interface. */
        if(this.walker?.clearConnections) {
            this.walker.clearConnections()
        } else {
            this.layerGroup.clearConnections()
        }
        this.draw()
        const windowMap = this.app.windowMap || {}
        for(let k in windowMap) {
            let _winbox = windowMap[k]
            if(this.walker?.windows) {
                delete this.walker.windows[k]
            }
            _winbox.unmount()
            _winbox.close()

        }

        this.app.windowMap = {}
    }

    removePipe(target) {
        return this.layerGroup.removeConnection(target)
    }

    removeConnection(target) {
        return this.removePipe(target)
    }

    deletePipe(target) {
        return this.removePipe(target)
    }

    animDraw(){
        this.layerGroup.animDraw()
    }
}


