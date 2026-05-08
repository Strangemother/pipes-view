/*

The canvas manager and layer managers.

These handle the presented lines between nodes.

---

It needs to change. The AI some of this - I'll refactor slowly
*/
/* Store incoming connection, for future storage */
const pipeData = {
    raw: []
    , connections: {}
}

const penFunctions = {}

const PERF_DEBUG = false
const perfLog = PERF_DEBUG ? console.log.bind(console) : ()=>{}


class CanvasLayerGroup {
    // const clItems = new CanvasLayerGroup(cl1, cl2)
    targetFPS = 50
    constructor(...layers) {
        this.layers = layers
        document.addEventListener('connectnodes', this.connectNodesEvent.bind(this))
        document.addEventListener('removepipe', this.removeConnectionEvent.bind(this))
        this.bindDeletePipeGesture()
    }

    connectNodesEvent(event) {
        let obj = event.detail
        return this.connectNodes(obj)
    }

    removeConnectionEvent(event) {
        return this.removeConnection(event.detail)
    }

    bindDeletePipeGesture() {
        const targetLayer = this.layers?.[this.layers.length - 1]
        const canvas = targetLayer?.canvas
        if(canvas == undefined || canvas.addEventListener == undefined) {
            return
        }

        this._boundDeletePipeGesture = this._boundDeletePipeGesture || this.onDeletePipeGesture.bind(this)
        canvas.addEventListener('contextmenu', this._boundDeletePipeGesture)
    }

    onDeletePipeGesture(event) {
        event.preventDefault()
        const point = this.getCanvasPointFromEvent(event)
        if(point == null) {
            return false
        }

        return this.removeConnectionNearPoint(point.x, point.y)
    }

    getCanvasPointFromEvent(event) {
        const targetLayer = this.layers?.[this.layers.length - 1]
        const canvas = targetLayer?.canvas
        if(canvas == undefined || canvas.getBoundingClientRect == undefined) {
            return null
        }

        const rect = canvas.getBoundingClientRect()
        const scaleX = rect.width == 0 ? 1 : canvas.width / rect.width
        const scaleY = rect.height == 0 ? 1 : canvas.height / rect.height

        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY,
        }
    }

    getConnectionId(obj) {
        if(obj?.sender == undefined || obj?.receiver == undefined) {
            return null
        }

        return `${obj.sender.label}-${obj.sender.pipIndex}-${obj.receiver.label}-${obj.receiver.pipIndex}`
    }

    connectNodes(obj) {
        if(obj?.sender == undefined || obj?.receiver == undefined) {
            console.error('Cannot connect without sender/receiver payload.', obj)
            return
        }

        perfLog('connectNodes', obj)
        const resolvedLine = this.resolveLineConfig(obj)
        obj.line = { ...(obj.line || {}), ...resolvedLine }
        pipeData.raw.push(obj)



        // from / to
        let sd = obj.sender.direction // outbound
        let rd = obj.receiver.direction // inbound

        if(sd == rd) {
            console.error("same direction isn't possible.")
            return
        }

        let senderUnit = app.getTip(obj.sender.label, obj.sender.direction, obj.sender.pipIndex)
        let receiverUnit = app.getTip(obj.receiver.label, obj.receiver.direction, obj.receiver.pipIndex)

        let _id = this.getConnectionId(obj)

        let store = pipeData.connections[_id];

        if(store == undefined) {
            // make a new one
            perfLog('Stashed', _id)
            pipeData.raw.push(obj)
            pipeData.connections[_id] = {
                obj
                , senderUnit
                , receiverUnit
            }

            dispatchRequestDrawEvent()
        } else {
            // Append to existing one
            perfLog('Already have connection', _id, store)
            // The sender unit and receiver unit should be the same, but the pipIndex may differ, so we add these.
        }
    }

    removeConnection(target) {
        let connectionId = typeof target == 'string' ? target : this.getConnectionId(target)
        if(connectionId == null) {
            return false
        }

        let existing = pipeData.connections[connectionId]
        if(existing == undefined) {
            return false
        }

        delete pipeData.connections[connectionId]
        pipeData.raw = pipeData.raw.filter((entry) => this.getConnectionId(entry) != connectionId)

        for(let layer of this.layers) {
            if(layer?.lines != undefined) {
                delete layer.lines[connectionId]
            }
        }

        dispatchRequestDrawEvent({ connectionId })
        return true
    }

    clearConnections() {
        pipeData.raw.length = 0
        pipeData.connections = {}

        for(let layer of this.layers) {
            if(layer?.lines != undefined) {
                layer.lines = {}
            }
        }

        dispatchRequestDrawEvent()
    }

    removeConnectionNearPoint(x, y, tolerance=12) {
        const lineLayer = this.layers?.[1]
        const lines = Object.values(lineLayer?.lines || {})
        if(lines.length == 0) {
            return false
        }

        let bestLine = null
        let bestDistance = Infinity
        for(let line of lines) {
            const distance = this.getLineHitDistance(line, x, y)
            if(distance < bestDistance) {
                bestDistance = distance
                bestLine = line
            }
        }

        if(bestLine == null) {
            return false
        }

        const lineWidth = Number(bestLine?.obj?.width) || 2
        if(bestDistance > Math.max(tolerance, lineWidth + 6)) {
            return false
        }

        return this.removeConnection(bestLine._id)
    }

    getLineHitDistance(line, x, y) {
        const points = this.getLineSamplePoints(line)
        if(points.length < 2) {
            return Infinity
        }

        let best = Infinity
        for(let index = 1; index < points.length; index++) {
            const distance = this.distanceToSegment({ x, y }, points[index - 1], points[index])
            if(distance < best) {
                best = distance
            }
        }

        return best
    }

    getLineSamplePoints(line, samples=24) {
        if(line == undefined || line.a == undefined || line.b == undefined) {
            return []
        }

        const design = this.layers?.[1]?.getLineDesign(line) || 's-curve'
        if(design == 'straight') {
            return [line.a, line.b]
        }

        const dx = line.b.x - line.a.x
        const minHandle = 24
        const handleFactor = 0.35
        const handle = Math.max(minHandle, Math.abs(dx) * handleFactor)
        let c1x
        let c2x

        if(design == 'curve') {
            const sign = dx >= 0 ? 1 : -1
            c1x = line.a.x + (sign * handle)
            c2x = line.b.x - (sign * handle)
        } else {
            const fallbackSenderSign = dx >= 0 ? 1 : -1
            const fallbackReceiverSign = -fallbackSenderSign
            const senderSign = line.senderDirection == 'outbound'
                ? 1
                : (line.senderDirection == 'inbound' ? -1 : fallbackSenderSign)
            const receiverSign = line.receiverDirection == 'inbound'
                ? -1
                : (line.receiverDirection == 'outbound' ? 1 : fallbackReceiverSign)
            c1x = line.a.x + (senderSign * handle)
            c2x = line.b.x + (receiverSign * handle)
        }

        const points = []
        for(let index = 0; index <= samples; index++) {
            const t = index / samples
            points.push(this.getBezierPoint(
                { x: line.a.x, y: line.a.y },
                { x: c1x, y: line.a.y },
                { x: c2x, y: line.b.y },
                { x: line.b.x, y: line.b.y },
                t,
            ))
        }

        return points
    }

    getBezierPoint(a, b, c, d, t) {
        const mt = 1 - t
        const mt2 = mt * mt
        const t2 = t * t
        const x = (mt2 * mt * a.x)
            + (3 * mt2 * t * b.x)
            + (3 * mt * t2 * c.x)
            + (t2 * t * d.x)
        const y = (mt2 * mt * a.y)
            + (3 * mt2 * t * b.y)
            + (3 * mt * t2 * c.y)
            + (t2 * t * d.y)

        return { x, y }
    }

    distanceToSegment(point, a, b) {
        const dx = b.x - a.x
        const dy = b.y - a.y
        if(dx == 0 && dy == 0) {
            return Math.hypot(point.x - a.x, point.y - a.y)
        }

        const lengthSquared = (dx * dx) + (dy * dy)
        const projection = (((point.x - a.x) * dx) + ((point.y - a.y) * dy)) / lengthSquared
        const clamped = Math.max(0, Math.min(1, projection))
        const px = a.x + (clamped * dx)
        const py = a.y + (clamped * dy)
        return Math.hypot(point.x - px, point.y - py)
    }

    animDraw(...args) {
        /*
        Perform animated draw of the connections.
        This method runs the canvas in animation mode, calling draw().
        It only draws when a change occurs, at a target fps (30 default), and is intended to be used in the main app loop.

        To use this, call animDraw() once to start the loop.
        To stop the drawing, call stopAnimDraw().

        Draws will only occur if the view is _dirty_:

        - When a new connection is made (connectNodes is called)
        - When a connection is removed
        - When a node moves.

        this is done though an event `requestDraw` that should be emitted whenever a redraw is needed.
        The animDraw method listens will render at a timely interval (default 30fps) when a draw is requested.
        */

        if(this._runTimer != null) {
            console.warn('Already running animDraw.')
            return
        }

        this._dirty = false
        document.addEventListener('requestdraw', ()=>{
            perfLog('Draw requested')
            this._dirty = true
        });

        const targetFPS = this.targetFPS
        const frameDuration = 1000 / targetFPS
        let lastFrameTime = 0

        const loop = (timestamp) => {
            if(this._dirty && (timestamp - lastFrameTime) >= frameDuration) {
                perfLog('Animating draw')
                this.draw(...args)
                this._dirty = false
                lastFrameTime = timestamp
            }
            this._runTimer = requestAnimationFrame(loop)
        }

        this._runTimer = requestAnimationFrame(loop)

    }

    stopAnimDraw() {
        if(this._runTimer == null) {
            console.warn('animDraw is not running.')
            return
        }
        cancelAnimationFrame(this._runTimer)
        this._runTimer = null

    }

    resolveLineConfig(obj={}) {
        const line = obj.line || {}
        const style = obj.style || {}

        const color = line.color ?? style.color ?? obj.color
        const design = line.design
                        ?? line.style
                        ?? style.design
                        ?? style.lineDesign
                        ?? obj.lineDesign
                        ?? obj.lineStyle
                        ;

        return Object.assign({}, line, { color, design })
    }

    draw(){

        this.renderConnections()
        requestAnimationFrame(this.renderFrame.bind(this));
    }

    renderFrame(delta){
        this.layers.forEach((layer)=>{
            layer.draw(delta)
        })
    }

    renderConnections(){
        /* Re-read the canvas position here so all point math is done once,
           converting viewport-absolute DOMRect coords into canvas-local ones
           before anything is stored or drawn.
           scaleX/Y corrects for any mismatch between the canvas attribute
           dimensions and its CSS-rendered size — without this, offsets grow
           increasingly wrong the further a node is from the origin. */
        const cvs = this.layers[1].canvas
        const canvasRect = cvs.getBoundingClientRect()
        const scaleX = cvs.width  / canvasRect.width
        const scaleY = cvs.height / canvasRect.height
        const pointCache = new Map()

        const getCenter = (node) => {
            let point = pointCache.get(node)
            if(point != undefined) {
                return point
            }

            const rect = node.getBoundingClientRect()
            point = {
                x: (rect.x + rect.width  * 0.5 - canvasRect.left) * scaleX
                , y: (rect.y + rect.height * 0.5 - canvasRect.top) * scaleY
            }
            pointCache.set(node, point)
            return point
        }

        for(let _id in pipeData.connections) {
            let conn = pipeData.connections[_id]
            let senderDirection = conn.obj?.sender?.direction
            let receiverDirection = conn.obj?.receiver?.direction

            let senderUnit = conn.senderUnit
            let receiverUnit = conn.receiverUnit

            // Canonicalize orientation at draw-time so we always render
            // outbound -> inbound regardless how the user performed the drag.
            if(senderDirection == 'inbound' && receiverDirection == 'outbound') {
                senderUnit = conn.receiverUnit
                receiverUnit = conn.senderUnit
                senderDirection = 'outbound'
                receiverDirection = 'inbound'
            }

            let senderNode = senderUnit.node
            let receiverNode = receiverUnit.node

            let a = getCenter(senderNode)
            let b = getCenter(receiverNode)
            let lineConfig = conn.obj?.line || {}

            perfLog('From', senderUnit, 'to', receiverUnit)
            this.drawLine(_id, a, b, {
                senderDirection,
                receiverDirection,
                lineColor: lineConfig.color,
                lineDesign: lineConfig.design,
                obj: lineConfig
            })
        }

    }

    drawLine(_id, a, b, directions={}) {
        perfLog('From', a, 'to', b)

        let tidyLine = this.layers[1].lines[_id]
        if(tidyLine == undefined) {
            tidyLine = {
                _id,
                a,
                b,
                senderDirection: directions.senderDirection,
                receiverDirection: directions.receiverDirection,
                lineColor: directions.lineColor,
                lineDesign: directions.lineDesign,
                obj: directions.obj
            }
            perfLog('Installing line.')
            this.layers[1].addLine(tidyLine)
            return
        }

        tidyLine.a = a
        tidyLine.b = b
        tidyLine.senderDirection = directions.senderDirection
        tidyLine.receiverDirection = directions.receiverDirection
        tidyLine.lineColor = directions.lineColor
        tidyLine.lineDesign = directions.lineDesign
        tidyLine.obj = directions.obj
    }

}


class CanvasLayer {
    /* Manages lines on a canvas. */
    // const cl1 = new CanvasLayer('.canvas-container.back')
    groupRender = true
    constructor(selector) {
        this.selector = selector
        let _canvas = document.querySelector(selector)
        this.canvas = _canvas
        this.ctx = _canvas.getContext("2d");
        this.dimensions = this.stickCanvasSize(_canvas)
        this.renderFrame.bind(this)
        this.lines = {}
        this.lineStyle = 'curve-tip'
    }

    draw(){
        requestAnimationFrame(this.renderFrame.bind(this));
    }

    clear(ctx=this.ctx, fillStyle=null) {
        /* Perform a standard 'clearRect' using the cached dimensions of the
        canvas.

            stage.clear(ctx)

        Synonymous to:

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

        Apply an optional flood fillStyle:

            stage.clear(ctx, '#000')
        */
        let dimensions = this.dimensions
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        if(fillStyle === null) { return }
        ctx.rect(0, 0, dimensions.width, dimensions.height);
        ctx.fillStyle = fillStyle
        ctx.fill();
    }

    addLine(tidyLine){
        this.lines[tidyLine._id] = tidyLine
    }

    renderFrame(delta){
        const ctx = this.ctx
        const frameStart = PERF_DEBUG ? performance.now() : 0
        this.clear(ctx)
        perfLog('renderFrame', delta)

        const lineItems = this.toLineArray(this.lines)
        if(lineItems.length == 0) {
            return
        }

        let gmap = {
            'straight': drawStraightLines
            , 'curve': drawSCurveLines
            , 's-curve': drawSCurveLinesWithTipDirection
        }

        if(this.groupRender) {

            let groups = this.groupLinesByDesignAndColor(lineItems)
            for(let groupKey in groups) {
                let group = groups[groupKey]
                let func = gmap[group.design] || gmap['s-curve']
                // this.drawSCurveLines(ctx, group.lines, group.color)
                func.call(this, ctx, group.lines, group.color)
            }
        } else {
            lineItems.forEach((group)=>{
                // let group = groups[groupKey]
                let func = gmap[group.design] || gmap['s-curve']
                // this.drawSCurveLines(ctx, group.lines, group.color)
                func.call(this, ctx, group.lines, group.obj.color)
            })

        }


        if(PERF_DEBUG) {
            perfLog('frame(ms)',
                (performance.now() - frameStart).toFixed(2), 'lines', lineItems.length)
        }

        let oldFillStyle = ctx.fillStyle
        // Every frame flips the color of the tiny circle from red to white.
        ctx.fillStyle = (delta / 100) % 2 > 1 ? 'red' : 'white'
        ctx.beginPath();
        ctx.arc(10, 10, 5, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = oldFillStyle

    }

    toLineArray(lines=this.lines) {
        if(lines == undefined) {
            return []
        }

        if(Array.isArray(lines)) {
            return lines
        }

        return Object.values(lines)
    }

    getLineDesign(line) {
        const design = line?.lineDesign ?? line?.design ?? line?.lineStyle ?? this.lineStyle
        if(design == 'straight' || design == 'curve' || design == 'curve-tip') {
            return design
        }

        return this.lineStyle
    }

    getLineColor(line) {
        return line?.lineColor ?? line?.color ?? 'purple'
    }

    groupLinesByDesignAndColor(lines) {
        let groups = {}
        for(let i = 0; i < lines.length; i++) {
            let line = lines[i]
            let design = this.getLineDesign(line)
            let color = this.getLineColor(line)
            let width = line.obj.width
            
            let key = `${design}::${color}::${width}`

            if(groups[key] == undefined) {
                groups[key] = {
                    design,
                    color,
                    lines: []
                }
            }

            groups[key].lines.push(line)
        }

        return groups
    }

    drawStraightLines(ctx=this.ctx, lines=this.lines, color='purple') {

        return penFunctions.drawStraightLines.call(this, ctx, lines, color)

    }

    drawSCurveLines(ctx=this.ctx, lines=this.lines, color='purple') {
        return penFunctions.drawSCurveLines.call(this, ctx, lines, color)

    }

    drawSCurveLinesWithTipDirection(ctx=this.ctx, lines=this.lines, color='purple') {
        return penFunctions.drawSCurveLines.call(this, ctx, lines, color)

    }

    stickCanvasSize(canvas=this.canvas){
        let rect;
        /* Return the result of the bounding box function, else resort
        to the object w/h */
            rect = (canvas.getBoundingClientRect
                    && canvas.getBoundingClientRect()
                    ) || { width: canvas.width, height: canvas.height }
            /*if(rect == undefined) {
                rect = { width: canvas.width , height: canvas.height }
            }*/


        if(rect.width) { canvas.width  = rect.width; }
        if(rect.height) { canvas.height = rect.height; }
        rect.width  = canvas.width;
        rect.height = canvas.height;

        return rect;
    }

}