const cubeData = () => {
    const vertices = [
        -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
        -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
    ];
    const indices = [
        0, 1, 2,    0, 2, 3,
        7, 4, 5,    7, 5, 6,
        3, 2, 6,    3, 6, 5,
        4, 7, 1,    4, 1, 0,
        1, 7, 6,    1, 6, 2,
        4, 0, 3,    4, 3, 5,
    ]
    return [vertices, indices]
}


class Block {
    constructor(position, color) {
        this.id = sum(position.map((p, i) => p * (3**(3-1-i))))
        this.id3 = position
        this.position = position.map(p => (p-1) * 1.5)

        const [v, i] = cubeData()
        this.vertices = v
        this.indices = i
        this.colors = Array(this.vertices.length/3).fill(color).flat()

        this.geometry = new Geometry(gl, this.vertices, this.colors, this.indices)
    }

    draw(shader) {
        this.geometry.update(this.position)
        this.geometry.draw(shader)
    }
}


class Rubik {
    clock = 0

    constructor(gl, camera, shader) {
        this.gl = gl

        this.gl.clearColor(1.0, 1.0, 1.0, 1.0)
        gl.clearDepth(1)

        this.camera = camera
        this.shader = shader

        this.blockColor = [0.1, 0.1, 0.1]
        this.blocks = []

        for (let x=0; x<3; x++) {
            for (let y=0; y<3; y++) {
                for (let z=0; z<3; z++) {
                    this.blocks.push(new Block([x, y, z], this.blockColor))
                }
            }
        }
    }

    drawBlocks() {
        for (let block of this.blocks) {
            block.draw(this.shader)
        }
    }


    draw() {
        this.shader.bind()
        this.shader.setUniforms(this.camera)
        this.drawBlocks()
    }

    render(t) {
        const dt = t - this.clock
        const play = !this.paused

        document.getElementById('fpsTxt').innerText = play ? mR(1/dt, 2) : '-'
        this.clock = t

        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.depthFunc(this.gl.LEQUAL)
        this.gl.cullFace(this.gl.BACK)

        if (play) {
            this.camera.update(dt)

            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

            this.draw()
            this.paused = true
        }
    }
}
