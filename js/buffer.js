class Buffer {
    constructor(gl, data, numComponents, componentType) {
        this.gl = gl
        this.numComponents = numComponents
        this.componentType = componentType
        this.buffer = gl.createBuffer()
        this.write(data)
    }

    write(data) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW)
    }

    bind(attrLocation) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
        this.gl.vertexAttribPointer(attrLocation, this.numComponents, this.componentType, false, 0, 0)
    }
}


class IndexBuffer extends Buffer {

    write(data) {
        this.indexCount = data.length
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffer)
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), this.gl.STATIC_DRAW)
    }

    bind() {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffer)
    }
}
