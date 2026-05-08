


class Graph {

    /*
        listList [ [] ]
        listDict [ {} ]
        dictDict { {} }
    */
    dataType = 'dictDict'

    constructor(data) {
        this.data = data
    }

    getStepperClass() {
        return Stepper
    }

    stepper(origin, StepperClass) {
        StepperClass = StepperClass || this.getStepperClass()
        let s = new StepperClass(this)
        if(origin) {
            s.setOrigin(origin)
        }
        return s;
    }
    getNode(name) {
        let r = this.data.nodes[name]
        if(r == undefined) {
            return this.getDefaultNode(name)
        }

        return r
    }

    getDefaultNode(name) {
        let dn = this.data.defaultNode
        if(dn == undefined) {
            throw new Error(`No node ${name}`)
        }
        return dn
    }

    getNextNodesList(name) {
        let ids = this.getNextNodeIds(name) || []
        let r = []
        ids.forEach((n)=>{ r.push(this.getNode(n) )})
        return r;
    }

    getNextNodesDict(name) {
        let ids = this.getNextNodeIds(name) || []
        let r = {}
        ids.forEach((n)=>{ r[n]=this.getNode(n) })
        return r;
    }

    getNextConnectionEntries() {
        let n = `${this.dataType}_getNextConnectionEntries`
        if(typeof this[n] == 'function') {
            return this[n].apply(this, arguments)
        }

        let name = arguments[0]
        return (this.getNextNodeIds(name) || []).map((nextNodeName) => {
            return this.createConnectionEntry(name, nextNodeName)
        })
    }

    getPrevConnectionEntries() {
        let n = `${this.dataType}_getPrevConnectionEntries`
        if(typeof this[n] == 'function') {
            return this[n].apply(this, arguments)
        }

        let name = arguments[0]
        return (this.getPrevNodeIds(name) || []).map((prevNodeName) => {
            return this.createConnectionEntry(prevNodeName, name)
        })
    }

    createConnectionEntry(senderLabel, receiverLabel, senderPipIndex=0, receiverPipIndex=0, line={}) {
        return {
            sender: {
                label: senderLabel,
                direction: 'outbound',
                pipIndex: senderPipIndex,
            },
            receiver: {
                label: receiverLabel,
                direction: 'inbound',
                pipIndex: receiverPipIndex,
            },
            line: line,
        }
    }

    normalizeConnectionEntry(connection) {
        if(connection == undefined || typeof connection != 'object') {
            return null
        }

        let sender = connection.sender || {}
        let receiver = connection.receiver || {}
        let outbound = sender
        let inbound = receiver

        if(sender.direction == 'inbound' && receiver.direction == 'outbound') {
            outbound = receiver
            inbound = sender
        }

        return {
            connection: connection,
            sender: sender,
            receiver: receiver,
            outbound: outbound,
            inbound: inbound,
        }
    }

    /* ------ */

    addConnection(){
        let n = `${this.dataType}_addConnection`
        return this[n].apply(this, arguments)
    }

    removeConnection(){
        let n = `${this.dataType}_removeConnection`
        return this[n].apply(this, arguments)
    }

    getNextNodeIds(){
        let n = `${this.dataType}_getNextNodeIds`
        return this[n].apply(this, arguments)
    }

    getPrevNodeIds(){
        let n = `${this.dataType}_getPrevNodeIds`
        return this[n].apply(this, arguments)
    }

    connectionsDictDict(){
        let n = `${this.dataType}_connectionsDictDict`
        return this[n].apply(this, arguments)
    }

    connectionsArrayDicts(){
        let n = `${this.dataType}_connectionsArrayDicts`
        return this[n].apply(this, arguments)
    }

    removeValue(list, value) {
        if(Array.isArray(list) == false) {
            return false
        }

        let index = list.indexOf(value)
        if(index < 0) {
            return false
        }

        list.splice(index, 1)
        return true
    }

    removeMatch(list, matcher) {
        if(Array.isArray(list) == false) {
            return undefined
        }

        let index = list.findIndex(matcher)
        if(index < 0) {
            return undefined
        }

        return list.splice(index, 1)[0]
    }

    pruneConnectionBucket(connections, name) {
        let nodeConnections = connections?.[name]
        if(nodeConnections == undefined) {
            return
        }

        for(let key of Object.keys(nodeConnections)) {
            if(Array.isArray(nodeConnections[key]) && nodeConnections[key].length == 0) {
                delete nodeConnections[key]
            }
        }

        if(Object.keys(nodeConnections).length == 0) {
            delete connections[name]
        }
    }

    /* ------ */

    dictDict_addConnection(a, b, connections) {
        connections = connections || this.data.connectionsDictDict
        let connsA = connections[a]
        if (connsA == undefined) {
            connsA = {}
            connections[a] = connsA
        }
        // append the _to_.
        let caTo = connsA['to']
        if(caTo == undefined) {
            caTo = []
            connsA['to'] = caTo
        }

        caTo.push(b)

        // ----

        let connsB = connections[b]
        if (connsB == undefined) {
            connsB = {}
            connections[b] = connsB
        }
        // append the _to_.
        let cbFrom = connsB['from']
        if(cbFrom == undefined) {
            cbFrom = []
            connsB['from'] = cbFrom
        }

        cbFrom.push(a)

    }

    dictDict_removeConnection(a, b, connections) {
        connections = connections || this.data.connectionsDictDict || {}
        let removedTo = this.removeValue(connections?.[a]?.to, b)
        let removedFrom = this.removeValue(connections?.[b]?.from, a)

        this.pruneConnectionBucket(connections, a)
        this.pruneConnectionBucket(connections, b)

        return removedTo && removedFrom

    }

    dictDict_getNextNodeIds(name, connections) {
        connections = connections || this.data.connectionsDictDict
        return this.connectionsDictDict(name, 'to', 'from', connections)
    }

    dictDict_getPrevNodeIds(name, connections) {
        connections = connections || this.data.connectionsDictDict
        return this.connectionsDictDict(name, 'from', 'to', connections)
    }

    dictDict_connectionsDictDict(name, needle, result, connections){
        let nodeConnections = connections[name]
        if(nodeConnections == undefined) {
            return []
        }

        return nodeConnections[needle] || []
    }

    dictDict_connectionsArrayDicts(name, needle, result, connections){
        let res = []
        for(let ab of connections) {
            if(ab[needle] == name) {
                res.push(ab[result])
            }
        }

        return res
    }

    /* ------ */

    listDict_addConnection(a, b, connections) {
        connections = connections || this.data.connectionsDicts
        connections.push({ sender: a, receiver: b })
    }

    listDict_removeConnection(a, b, connections) {
        connections = connections || this.data.connectionsDicts || []
        return this.removeMatch(connections, (connection) => {
            return connection?.sender == a && connection?.receiver == b
        }) != undefined
    }

    listDict_getNextNodeIds(name, connections) {
        connections = connections || this.data.connectionsDicts
        return this.connectionsArrayDicts(name, 'sender', 'receiver', connections)
    }

    listDict_getPrevNodeIds(name, connections) {
        connections = connections || this.data.connectionsDicts
        return this.connectionsArrayDicts(name, 'receiver', 'sender', connections)
    }

    listDict_connectionsArrayDicts(name, needle, result, connections){
        let res = []
        for(let ab of connections) {
            if(ab[needle] == name) {
                res.push(ab[result])
            }
        }

        return res
    }

    /* ------ */

    listList_addConnection(a, b, connections) {
        connections = connections || this.data.connectionsList
        connections.push([a,b])
    }

    listList_removeConnection(a, b, connections) {
        connections = connections || this.data.connectionsList || []
        return this.removeMatch(connections, (connection) => {
            return connection?.[0] == a && connection?.[1] == b
        }) != undefined
    }

    listList_getNextNodeIds(name, connections) {
        connections = connections || this.data.connectionsList
        return this.listList_connectionsArrayArray(name, 0, 1, connections)
    }

    listList_getPrevNodeIds(name, connections) {
        connections = connections || this.data.connectionsList
        return this.listList_connectionsArrayArray(name, 1, 0, connections)
    }

    listList_connectionsArrayArray(name, needle, result, connections){
        let res = []
        for(let ab of connections) {
            if(ab[needle] == name) {
                res.push(ab[result])
            }
        }

        return res
    }

    /* ------ */

    pipDict_addConnection(sender, receiver, senderPipIndex=0, receiverPipIndex=0, line={}, connections) {
        connections = connections || this.data.connectionsPipDicts
        if(connections == undefined) {
            connections = []
            this.data.connectionsPipDicts = connections
        }

        let connection = sender
        if(sender?.sender == undefined || sender?.receiver == undefined) {
            connection = this.createConnectionEntry(sender, receiver, senderPipIndex, receiverPipIndex, line)
        }

        connections.push(connection)
        return connection
    }

    pipDict_removeConnection(sender, receiver, senderPipIndex=0, receiverPipIndex=0, connections) {
        let target = sender

        if(sender?.sender != undefined && sender?.receiver != undefined) {
            connections = connections || (Array.isArray(receiver) ? receiver : undefined)
        } else {
            target = this.createConnectionEntry(sender, receiver, senderPipIndex, receiverPipIndex)
        }

        connections = connections || this.data.connectionsPipDicts || []
        let targetEntry = this.normalizeConnectionEntry(target)
        let removed = this.removeMatch(connections, (connection) => {
            let entry = this.normalizeConnectionEntry(connection)
            return entry?.outbound?.label == targetEntry?.outbound?.label
                && entry?.inbound?.label == targetEntry?.inbound?.label
                && entry?.outbound?.pipIndex == targetEntry?.outbound?.pipIndex
                && entry?.inbound?.pipIndex == targetEntry?.inbound?.pipIndex
        })

        return removed != undefined
    }

    pipDict_getNextNodeIds(name, connections) {
        return this.pipDict_getNodeIds(name, true, connections)
    }

    pipDict_getPrevNodeIds(name, connections) {
        return this.pipDict_getNodeIds(name, false, connections)
    }

    pipDict_getNextConnectionEntries(name, connections) {
        return this.pipDict_getDirectionConnections(name, true, connections)
    }

    pipDict_getPrevConnectionEntries(name, connections) {
        return this.pipDict_getDirectionConnections(name, false, connections)
    }

    pipDict_getNodeIds(name, outbound=true, connections) {
        let seen = new Set()
        let res = []

        for(let connection of this.pipDict_getDirectionConnections(name, outbound, connections)) {
            let entry = this.normalizeConnectionEntry(connection)
            let target = outbound ? entry?.inbound?.label : entry?.outbound?.label
            if(target == undefined || seen.has(target)) {
                continue
            }

            seen.add(target)
            res.push(target)
        }

        return res
    }

    pipDict_getDirectionConnections(name, outbound=true, connections) {
        connections = connections || this.data.connectionsPipDicts || []

        let res = []
        for(let connection of connections) {
            let entry = this.normalizeConnectionEntry(connection)
            if(entry == null) {
                continue
            }

            let source = outbound ? entry.outbound?.label : entry.inbound?.label
            if(source == name) {
                res.push(connection)
            }
        }

        return res
    }

}