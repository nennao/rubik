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

    constructor(block, position, facing, transform) {
        this.gl = block.gl
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
        this.geometry.draw(shader)
    }
}


class Block {
    constructor(root, position) {
        this.gl = root.gl
        this.root = root
        this.position = position

        const [v, i] = cubeData()
        this.vertices = v
        this.indices = i
        // this.colors = Array(this.vertices.length/3).fill(color).flat()
        this.colors = [].concat(
            Array(this.vertices.length/3/2).fill(root.blockColor).flat(),
            Array(this.vertices.length/3/2).fill([0, 0, 0]).flat(),
        )

        this.geometry = new Geometry(gl, this.vertices, this.colors, this.indices)
        this.faces = this.createFaces(position)
        this.initPosition()
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
                faces.push(new Face(this, position, [['x', 'y', 'z'][i], p], faceTransforms[i][p+1]))
            }
        })
        return faces
    }

    initPosition() {
        const displayPosition = this.root.displayTransform(this.position)
        const _initPos = entity => {mat4.translate(entity.geometry.transform, mat4.create(), displayPosition)}
        _initPos(this)
        this.faces.forEach(_initPos)
    }

    rotate(axisId, dir, amt, isFinal) {
        const angle = rad(amt * dir)
        const axis = ['x', 'y', 'z'].map(a => a === axisId ? 1 : 0)
        const rotation = mat4.rotate(mat4.create(), mat4.create(), angle, axis)

        const _rotate = entity => {mat4.multiply(entity.geometry.transform, rotation, entity.geometry.transform)}
        _rotate(this)
        this.faces.forEach(_rotate)
        if (isFinal) {
            this.position = vec3[`rotate${axisId.toUpperCase()}`]([], this.position, axis, rad(90*dir)).map(mR)
        }
    }

    draw(shader) {
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
        this.gl.clearDepth(1)

        this.camera = camera
        this.shader = shader

        this.speed = 3
        this.spread = 1.5
        this.blockColor = [0.1, 0.1, 0.1]
        this.blocks = []
        this.rotationQueue = []

        for (let x=-1; x<2; x++) {
            for (let y=-1; y<2; y++) {
                for (let z=-1; z<2; z++) {
                    this.blocks.push(new Block(this,[x, y, z]))
                }
            }
        }

        this.initUIWatcher()
        initDOMInputs(this)
        this.handleInputEvents()
    }

    initUIWatcher() {
        const getters = [
            () => 0,  // for dom ui
            () => this.camera.aspect,
        ]

        this.uiWatcher = getters.map((getter, i) => ({val: i ? getter() : 1, get: getter}))
    }

    triggerRedraw() {
        this.uiWatcher[0].val = 1
    }

    handleInputEvents() {
        this.gl.canvas.addEventListener('click', e => {
            if (e.which === 1) {
                const [ closest, closestId ] = this.findClosestBlock(e.clientX, e.clientY)
                if (closest) {
                    console.log(closestId)
                }
            }
        })
    }

    findClosestBlock(x, y) {
        let closest, closestId, closestDist = Infinity
        const pNear= this.camera.position
        const pFar = this.camera.getPickedVector(x, y)
        for (let [i, block] of this.blocks.map((b, i) => [i, b])) {
            if (rayCubeSphere(pNear, pFar, this.displayTransform(block.position), 1)) {
                const triangles = getTriangles(block.vertices, block.indices, block.geometry.transform)
                const intersections = triangles.map(t => rayTriangle(pNear, pFar, ...t)).filter(x => x)
                if (intersections.length) {
                    const dist = Math.min(...intersections.map(v => vec3.distance(v, this.camera.position)))
                    if (dist < closestDist) {
                        closestDist = dist
                        closest = block
                        closestId = i
                    }
                }
            }
        }
        return [ closest, closestId ]
    }

    displayTransform(positions) {
        return positions.map(p => p * this.spread)
    }

    runRotation() {
        const speed = this.rotationQueue.length * this.speed
        if (speed) {
            const [axis, level, dir, rem] = this.rotationQueue[0]
            const amt = Math.min(speed, rem)
            const newRem = rem - speed
            const isFinal = newRem <= 0
            this.doRotate(axis, level, dir, amt, isFinal)
            if (isFinal) {
                this.rotationQueue.shift()
            }
            else {
                this.rotationQueue[0][3] = newRem
            }
            this.triggerRedraw()
        }
    }

    doRotate(axis, level, dir, amt, isFinal) {
        const axisId = ['x', 'y', 'z'].indexOf(axis)
        for (let block of this.blocks) {
            if (block.position[axisId] === level) {
                block.rotate(axis, dir, amt, isFinal)
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

    uiWatch() {
        for (let watcher of this.uiWatcher) {
            if (watcher.val !== watcher.get()) {
                watcher.val = watcher.get()
                return true
            }
        }
        return false
    }

    render(t) {
        const dt = t - this.clock
        if (this.rotationQueue.length) {
            this.runRotation()
        }
        const play = this.uiWatch()

        document.getElementById('fpsTxt').innerText = play ? mR(1/dt, 2) : '-'
        this.clock = t

        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.depthFunc(this.gl.LEQUAL)
        this.gl.cullFace(this.gl.BACK)

        if (play) {
            this.camera.update(dt)

            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

            this.draw()
        }
    }
}

function initDOMInputs(rubik) {
    const axes = ['x', 'y', 'z']
    document.getElementById('rubik-controls').innerHTML = strJoin(axes, axis => `
        <div id="controls-${axis}" class="flexRow">
        ${strJoin([1, 2, 3], i => `
            <div class="flexRow"><span>${axis}${i}</span><div class="flexCol"><button>^</button><button>v</button></div></div>
        `)}
        </div>
    `)

    axes.forEach(axis => {
        document.querySelectorAll(`#controls-${axis} > div`).forEach((div, i) => {
            div.querySelectorAll('button').forEach((button, j) => {
                button.onclick = () => rubik.rotationQueue.push([axis, i-1, j ? -1 : 1, 90])
            })
        })
    })
}