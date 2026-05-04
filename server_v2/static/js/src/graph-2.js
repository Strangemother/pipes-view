


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

    stepper(origin) {
        let s = new Stepper(this)
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

    /* ------ */

    addConnection(){
        let n = `${this.dataType}_addConnection`
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

        cbFrom.push(b)

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

    listList_getNextNodeIds(name, connections) {
        connections = connections || this.data.connectionsList
        return this.connectionsArrayArray(name, 0, 1, connections)
    }

    listList_getPrevNodeIds(name, connections) {
        connections = connections || this.data.connectionsList
        return this.connectionsArrayArray(name, 1, 0, connections)
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

}