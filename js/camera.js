class Camera {
    position = [0.0, 0.0, 15.0]
    up = [0, 1, 0]
    target = [0, 0, 0]

    fov = rad(45)
    aspect = 1
    zNear = 0.1
    zFar = 100.0
    projectionMatrix = mat4.create()
    viewMatrix = mat4.create()

    constructor(gl) {
        this.gl = gl
        this.resize()
    }

    resize() {
        const width = window.innerWidth
        const height = window.innerHeight
        this.gl.canvas.width = width * window.devicePixelRatio
        this.gl.canvas.height = height * window.devicePixelRatio
        this.gl.canvas.style.width = "" + width + "px"
        this.gl.canvas.style.height = "" + height + "px"
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
        this.aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight
    }

    update(dt) {
        mat4.perspective(this.projectionMatrix, this.fov, this.aspect, this.zNear, this.zFar)
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up)
    }

    clipXY(mouseX, mouseY) {
        const w2 = this.gl.canvas.clientWidth/2, h2 = this.gl.canvas.clientHeight/2
        return [(mouseX - w2)/w2, (h2 - mouseY)/h2]  // -1 to 1
    }

    getPickedVector(x, y) {
        const pf = [...this.clipXY(x, y), 1]
        const PV = mat4.multiply(mat4.create(), this.projectionMatrix, this.viewMatrix)
        const invVP = mat4.invert(mat4.create(), PV)
        return vec3.transformMat4([], pf, invVP)
    }
}
