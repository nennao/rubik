class Rubik {
    clock = 0

    constructor(gl, camera, shader) {
        this.gl = gl

        this.gl.clearColor(1.0, 0.5, 0.5, 1.0)
        gl.clearDepth(1)

        this.camera = camera
        this.shader = shader

    }

    drawBlocks() {}


    render() {
        this.shader.bind();
        this.drawBlocks()
    }

    draw(t) {
        const dt = t - this.clock
        const play = true

        document.getElementById('fpsTxt').innerText = play ? mR(1/dt, 2) : '-'
        this.clock = t

        if (play) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

            this.render()
        }
    }
}
