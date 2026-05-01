

class DivGeom {

    getScale(expected, current) {
        const canvasRect = cvs.getBoundingClientRect()
        const scaleX = cvs.width  / canvasRect.width
        const scaleY = cvs.height / canvasRect.height
    }

    quantize(node, value=100, keys=['x', 'y', 'w','h']) {
        /* quantize the numbers to the value */
    }

    static getCenter(node) {
        if(point != undefined) {
            return point
        }

        let scaleX = 1, scaleY = 1;

        const rect = node.getBoundingClientRect()
        point = {
            x: (rect.x + rect.width  * 0.5 - canvasRect.left) * scaleX
            , y: (rect.y + rect.height * 0.5 - canvasRect.top) * scaleY
        }
        return point
    }

    static getOffset(node, offset={x:.5, y:.5}) {
        if(point != undefined) {
            return point
        }

        let scaleX = 1, scaleY = 1;

        const rect = node.getBoundingClientRect()
        point = {
            x: (rect.x + rect.width  * offset.x - canvasRect.left) * scaleX
            , y: (rect.y + rect.height * offset.y - canvasRect.top) * scaleY
        }
        return point
    }


}