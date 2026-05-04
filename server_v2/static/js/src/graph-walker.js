
/*

The graph walker discovers _from_ and _to_ connections for nodes.
Each node within the graph is essentially an ID.

The data attached to the node is the exection code.

- get and create connections: as an id list
- get node - the vue app within the winbox window

 */
class GraphWalker {
	constructor(conf={}) {
		this.connections = conf.connections || pipeData.connections
		this.conf = conf
		// this.windows = conf.windows || app.windowMap
	}

	get windows() {
		return this.conf.windows || app.windowMap
	}

	getConnections(name) {
		if(name == undefined) {
			return []
		}

		let res = []
		for(let connectionId in this.connections) {
			let connection = this.connections[connectionId]
			if(connection == undefined || connection.obj == undefined) {
				continue
			}

			let senderLabel = connection.obj.sender?.label
			let receiverLabel = connection.obj.receiver?.label

			if(senderLabel == name || receiverLabel == name) {
				res.push(connection)
			}
		}

		return res
	}

	getIncomingIds(name) {
		return this.getDirection(name, false)
	}

	getOutgoingIds(name) {
		return this.getDirection(name, true)
	}

	getDirection(name, outbound=true) {
		if(name == undefined) {
			return []
		}

		let res = []
		for(let connectionId in this.connections) {
			let connection = this.connections[connectionId]
			if(connection == undefined || connection.obj == undefined) {
				continue
			}

			let sender = connection.obj?.sender
			let receiver = connection.obj?.receiver

			let outboundLabel = sender?.label
			let inboundLabel = receiver?.label
			if(sender?.direction == 'inbound' && receiver?.direction == 'outbound') {
				outboundLabel = receiver?.label
				inboundLabel = sender?.label
			}

			let sourceLabel = outbound ? outboundLabel : inboundLabel
			let targetLabel = outbound ? inboundLabel : outboundLabel
			if(sourceLabel == name && targetLabel != undefined) {
				res.push(targetLabel)
			}
		}

		return [...new Set(res)]
	}

	createConnection(fromName, toName, senderPipIndex=0, receiverPipIndex=0, line={}) {
		if(fromName == undefined || toName == undefined) {
			return null
		}

		const senderWindow = this.windows[fromName]
		const receiverWindow = this.windows[toName]
		if(senderWindow == undefined || receiverWindow == undefined) {
			console.error('Cannot create connection; unknown window label.', { fromName, toName })
			return null
		}

		const lineConfig = {
			color: line?.color,
			design: line?.design ?? line?.style ?? line?.lineDesign
		}

		const connection = {
			sender: {
				label: fromName,
				direction: 'outbound',
				pipIndex: senderPipIndex
			},
			receiver: {
				label: toName,
				direction: 'inbound',
				pipIndex: receiverPipIndex
			},
			line: lineConfig
		}

		document.dispatchEvent(new CustomEvent('connectnodes', {
			detail: connection
		}))

		return connection
	}

	clearConnections() {
		for(let connectionId in this.connections) {
			delete this.connections[connectionId]
		}

		pipeData.raw.length = 0

		for(let i = 0; i < clItems.layers.length; i++) {
			let layer = clItems.layers[i]
			if(layer.lines != undefined) {
				layer.lines = {}
			}
		}
	}

    getWindow(name) {
        // Returns the window object for the given name, or null if not found.
        if(name == undefined) {
            return null
        }

        const win = this.windows[name]


        if(win == null && this.conf.app.getGraphNodeElement) {
        	return this.conf.app.getGraphNodeElement(name)
        }

        return run

    }

    getNode(name) {
        // return the app within the node.
        const win = this.getWindow(name)
        if(win == null) {
            return null
        }
        debugger;
        return win.vueApp || null
    }
}

