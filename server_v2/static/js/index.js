/*

In this new verson

+ Nodes are optional

*/

const myData = {
    connectionsList: [
        ['a', 'b']
        , ['b', 'c']
        , ['b', 'd']
    ]

    , connectionsDicts: [
        { sender: 'a', receiver: 'b', width: 3}
        , { sender: 'b', receiver: 'c' }
        , { sender: 'b', receiver: 'd' }
    ]

    , connectionsDictDict: {
        a: {
            to: ['b']
        }
        , b: {
            to: ['c', 'd']
            , from: ['a']
        }
        , c: {
            to: ['d']
            , from: ['b']
        }

        , d: {
            // to: ['d']
            from: ['c']
        }
    }

    , nodes: {
          a: (...ints)=> { console.log('a', ints); return ints.reduce((a,b)=>a+b); }
        , b: (...ints)=> { console.log('b', ints); return ints.reduce((a,b)=>a+b); }
        , c: (...ints)=> { console.log('c', ints); return ints.reduce((a,b)=>a+b); }
        , d: (...ints)=> { console.log('d', ints); return ints.reduce((a,b)=>a+b); }
    }

    // , defaultNode: {}
}


gg = new Graph(myData)
// const aNode = gg.getNode('a')
// if(aNode.n != 'a') {
//     console.error('bad a node:', aNode)
// }
