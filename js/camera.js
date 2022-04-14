class Camera {
    position = [10.0, 10.0, 10.0]
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
        const width = window.innerWidth - document.getElementById('controlsCont').clientWidth - 15  // scroll bar
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
}
