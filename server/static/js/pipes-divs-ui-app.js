/*

*/


var spawnWindow = function(d){
    console.log('Spawn window not implmented', d)
}


const createUIApp = function(mountSelector='#mini_app') {
    /*
        This Vue app maintains the ui clickable buttons
        and the windows made by winbox.

        exposed as `app`.
     */
    let app = {
        // cacheCopy: reactive(cache)
        // , messages: reactive([])
        // , partialState: reactive({
        //     status: "waiting"
        //     , counter: 0
        // })
        newPanelName: "label"
        , animateLines: false

        , windowMap: {}

        , saveButton() {
            // save the view to localstore.
            pipesTool.save()
        }

        , restoreButton() {
            // restore the view from localstore.
            pipesTool.restore()
        }

        , clearButton() {
            // clear the view
            pipesTool.clear()
        }

        , onFocusNode(event) {
            // console.log('onFocusNode', event.detail)
            this.focusNode = event.detail
        }

        , redrawCanvas(){
            pipesTool.draw();
        }


        , animateLinesCheckChange(event) {
            let checked = event.target.checked
            if(checked) {
                if(this._animating) {
                    console.log('Already animating', this._animating)
                }
                this._animating = pipesTool.animDraw()
                dispatchRequestDrawEvent()
            } else {
                    console.log('Stopping anim', this._animating)
                    pipesTool.layerGroup.stopAnimDraw()
                    this._animating = null
            }

        }

        , stepOnceHighlighted(){

            let start = false;

            if(this._stepHighlightEntry == undefined) {
                // start
                // console.log('stepOnceHighlighted start', this.focusNode)
                start = true
            } else {

                if(this._stepHighlightEntry.name != this.focusNode.name) {
                    console.log('Node change.')
                    pipesTool.lights.clearCycle()
                    start = true
                }
            }

            if(start == true) {
                pipesTool.lights.cycleFrom(this.focusNode.name)
                this._stepHighlightEntry = this.focusNode
            }

            // console.log('stepOnceHighlighted continue', this.focusNode)
            pipesTool.lights.stepLights()
        }

        , startStepHighlighted(startNode=this.focusNode) {

            if(startNode == undefined) {
                startNode = this._stepHighlightEntry
            }

            if(this._stepHighlightEntry != undefined) {
                this.stopStepHighlighted()
            }

            console.log('start from', startNode)
            this._stepHighlightEntry = startNode

            pipesTool.lights.runLights(startNode.name)

        }

        , stopStepHighlighted() {
            console.log('Stopping highlighter', this._stepHighlightEntry)
            pipesTool.lights.stopLights()
            this._stepHighlightEntry = undefined
        }

        , spawnWindow(conf={name: this.newPanelName}) {

            // let r = this.windowMap[conf.name] = spawnWinboxWindow(conf)
            // return r


            let r = this.windowMap[conf.name] = spawnWindow(conf)
            return r
        }

        // , getTip(label, direction, index=0) {
        //     let windowApp = this.windowMap[label]
        //     let unit = windowApp.vueApp.getTip(direction, index)
        //     return unit
        // }

        , getTip(pipName, direction, index=0) {
            // let items = direction == 'outbound'? this.pipsOutbound: this.pipsInbound
            // if(items == undefined) {
            //     console.error('No tips', this)
            //     return
            // }

            // let res = items[index]
            // if(res == undefined) {
            //     console.error(`No Index ${index}`)
            //     return
            // }

            // add view node
            // let nodeId = `${pip.label}-${direction}-${index}`
            let nodeId = `${pipName}-${direction}-${index}`

            return {
                node:document.getElementById(nodeId)
            }
            // res['node'] = document.getElementById(nodeId)
            // return res
        }

        , startExecuteLoop(startNode=this.focusNode) {
            if(this._walkerExecution != undefined) {
                this.stopExecuteLoop()
            }

            this._walkerExecution = pipesTool.walker.executeLoop(startNode.name, 2)
        }

        , stopExecuteLoop(){
            if(this._walkerExecution == undefined) {
                console.log('No executor to stop.')
                return false;
            }

            this._walkerExecution.stop()
            this._walkerExecution = undefined;
            return true
        }
    }

    const res = PetiteVue.createApp(app)
    listenEvent('focusnode', app.onFocusNode.bind(app))
    res.mount(mountSelector)
    return app
};



const createNodesApp = function(mountSelector='#panspace_container') {
    /*
        This Vue app maintains the ui clickable buttons
        and the windows made by winbox.

        exposed as `app`.
     */

    let item = function(){
        let name = Math.random().toString(32).slice(3, 7)
        return {
            pipsInbound: [
                { label: name
                , index: 0 }
            ]
            , pipsOutbound: [
                { label: name
                , index: 0 }
            ]
            , name
        }
    }

    document.addEventListener('dragmove', (e)=>{
            // console.log('dragmove')
            dispatchRequestDrawEvent()
    })

    document.addEventListener('panspace', (e)=>{
            // console.log('dragmove')
            dispatchRequestDrawEvent()
    })

    document.addEventListener('zoomspace', (e)=>{
            // console.log('dragmove')
            dispatchRequestDrawEvent()
    })

    let app = {
        // cacheCopy: reactive(cache)
        // , messages: reactive([])
        // , partialState: reactive({
        //     status: "waiting"
        //     , counter: 0
        // })
        newPanelName: "egg"
        , boxes: [
            item()
            , item()
            , item()
            , item()
        ]

        , pipStartDrag(event, direction="outbound", pip) {
            console.log(`pipStartDrag(${direction}, ${pip.index})`)
            event.target.classList.add("dragging");
            // Clear the drag data cache (for all formats/types)
            event.dataTransfer.clearData();
            // Set the drag's format and data.
            // Use the event target's id for the data
            let d = {
                label: pip.label
                , direction
                , pipIndex: pip.index
            }

            let content = JSON.stringify(d)
            event.dataTransfer.setData("text/plain", content);
        }

        , randomColor() {
            let cols = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8',
                        '#f58231', '#911eb4', '#46f0f0', '#f032e6',
                        ]
            return cols[Math.floor(Math.random() * cols.length)]
        }

        , connect(sender, receiver, line={}) {
            // console.log('Connect from', sender, 'to: ', receiver)
            line.color = line.color || this.randomColor()
            document.dispatchEvent(new CustomEvent('connectnodes', {
                    detail: {
                        sender
                        , receiver
                        , line
                    }
                })
            )
            dispatchRequestDrawEvent()

        }


        , pipDrop(event, direction, pip) {
            const content = event.dataTransfer.getData("text");

            const sender = JSON.parse(content)
            const self = {
                label: pip.label
                , direction
                , pipIndex: pip.index
            }

            this.connect(sender, self)

        }

        , pipEndDrag(event, direction, pip) {
            console.log(`pipEndDrag(${direction}, ${pip.index})`)
            event.target.classList.remove("dragging");
            dispatchRequestDrawEvent()

        }

        , pipOverDrag(event, direction, pip) {
            // Get the data, which is the id of the source element
            const data = event.dataTransfer.getData("text");
            console.log(`pipOverDrag(${direction}, ${pip}) == ${data}`)
            event.preventDefault()
            // event.target.classList.remove("dragging");
        }

        , getTip(direction, index=0) {
            let items = direction == 'outbound'? this.pipsOutbound: this.pipsInbound
            if(items == undefined) {
                console.error('No tips', this)
                return
            }

            let res = items[index]
            if(res == undefined) {
                console.error(`No Index ${index}`)
                return
            }

            // add view node
            let nodeId = `${pip.label}-${direction}-${index}`
            res['node'] = document.getElementById(nodeId)
            return res
        }
    }

    const res = PetiteVue.createApp(app)

    res.mount(mountSelector)
    return app
};
