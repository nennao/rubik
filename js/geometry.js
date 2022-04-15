class Geometry {

    constructor(gl, positions, colors, indices) {
        this.gl = gl

        this.positions = new Buffer(gl, positions, 3, gl.FLOAT)
        this.colors = new Buffer(gl, colors, 3, gl.FLOAT)
        this.indices = new IndexBuffer(gl, indices)

        this.transform = mat4.create()
    }

    draw(shader) {
        shader.setUniformMat4('u_ModelMatrix', this.transform)

        this.positions.bind(shader.vertexPosition)
        this.colors.bind(shader.vertexColor)
        this.indices.bind()
        this.gl.drawElements(this.gl.TRIANGLES, this.indices.indexCount, this.gl.UNSIGNED_SHORT, 0)
    }
}