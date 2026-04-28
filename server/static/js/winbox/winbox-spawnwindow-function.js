/*

*/


var spawnWindow = function(d){
    // console.log('Spawn window not implmented', d)
    return spawnWinboxWindow(d)
}

const spawnWinboxWindow = function(conf={}) {
    /* Generally called by the UI button or can be called manually.
    Create a new winbox window and bind the new interals with a
    Vue app.

    Returns the created winbox window, find the app within `result.vueApp`

    */

    let confName = conf.name;
    let winapp = {
        class: [
            "no-min"
            , "no-max"
            , "no-full"
            // , "no-resize"
            // , "no-move"
            ]
        , x: "center"
        , y: "center"
        , width: "10%"
        , height: "20%"
        , mount: document
                    .getElementById("window_content")
                    .cloneNode(true)
        , root: document.querySelector("main")

        ,  onclose: function(force){
            console.log('Unmount app')
            // this.vueApp.unmount()
            return force;
            // return !confirm("Close window?");
        }
        , onfocus(){
            // console.log('Focus', confName)
            dispatchFocusNodeEvent({ name: confName})
        }
        ,  onmove: function(x, y){
            // console.log('Moved to', x, y)
            dispatchRequestDrawEvent()
        }

    };
    Object.assign(winapp, conf);
    let _window = new WinBox(confName, winapp);

    // pipes.winbox-app.js
    createWinboxVueApp(_window, conf)
    return _window
}
