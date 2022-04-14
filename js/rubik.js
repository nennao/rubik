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

const squareData = (s=1, z=0) => {
    const r = 0.5 * s
    const vertices = [
        [-r, -r, z],
        [ r, -r, z],
        [ r,  r, z],
        [-r,  r, z],
    ]
    const indices = [
        0, 1, 2,    0, 2, 3,
    ]
    return [vertices, indices]
}

class Face {
    faceColors = {
        'x-1': [0, 1, 1],
         'x1': [1, 0, 0],
        'y-1': [1, 0, 1],
         'y1': [0, 1, 0],
        'z-1': [1, 1, 0],
         'z1': [0, 0, 1],
    }
    epsilon = 0.01

    constructor(gl, block, position, facing, transform) {
        this.gl = gl
        this.block = block
        const [v, i] = squareData(0.8, 0.5 + this.epsilon)

        this.vertices = this.orientFace(v, ...transform)
        this.indices = i
        this.colors = this.getFaceColor(...facing)

        this.geometry = new Geometry(gl, this.vertices, this.colors, this.indices)
    }

    orientFace(vertices, rAxis, angle) {
        if (!angle) {
            return vertices.flat()
        }
        const res = vertices.map(v => vec3[`rotate${rAxis}`]([], v, [0, 0, 0], rad(angle)))
        return res.flat()
    }

    getFaceColor(axis, dir) {
        const color = this.faceColors[`${axis}${dir}`]
        return Array(this.vertices.length/3).fill(color).flat()
    }

    draw(shader) {
        this.geometry.update(this.block.position)
        this.geometry.draw(shader)
    }
}


class Block {
    constructor(gl, position, color) {
        this.gl = gl
        this.position = position.map(p => p * 1.5)

        const [v, i] = cubeData()
        this.vertices = v
        this.indices = i
        // this.colors = Array(this.vertices.length/3).fill(color).flat()
        this.colors = [].concat(
            Array(this.vertices.length/3/2).fill(color).flat(),
            Array(this.vertices.length/3/2).fill([0, 0, 0]).flat(),
        )

        this.geometry = new Geometry(gl, this.vertices, this.colors, this.indices)
        this.faces = this.createFaces(position)
    }

    createFaces(position) {
        const faceTransforms = [
            {0: ['Y', -90], 2: ['Y',  90]},
            {0: ['X',  90], 2: ['X', -90]},
            {0: ['Y', 180], 2: ['Y',   0]},
        ]
        const faces = []
        position.forEach((p, i) => {
            if (p) {
                faces.push(new Face(this.gl, this, position, [['x', 'y', 'z'][i], p], faceTransforms[i][p+1]))
            }
        })
        return faces
    }

    draw(shader) {
        this.geometry.update(this.position)
        this.geometry.draw(shader)
        for (let face of this.faces) {
            face.draw(shader)
        }
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

        for (let x=-1; x<2; x++) {
            for (let y=-1; y<2; y++) {
                for (let z=-1; z<2; z++) {
                    this.blocks.push(new Block(this.gl,[x, y, z], this.blockColor))
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
