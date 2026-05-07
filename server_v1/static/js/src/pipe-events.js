const dispatchRequestDrawEvent = function(data={}){
    document.dispatchEvent(new CustomEvent('requestdraw', {
        detail: data
    }))
}

const dispatchFocusNodeEvent = function(data={}){
    document.dispatchEvent(new CustomEvent('focusnode', {
        detail: data
    }))
}


const listenEvent = function(name, callback, opts={ passive: true }) {
    document.addEventListener(name, callback, opts)
}
