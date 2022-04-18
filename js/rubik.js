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
        const [faces, faceNormals] = this.createFaces(position)
        this.faces = faces
        this.faceNormals = Object.fromEntries(faceNormals.map(n => [idFrom3d(n), n]))
        this.faceTriangles = getTriangles(this.vertices, this.indices).map(t => [getTriangleNormId(t), t])
        this.initPosition()
    }

    createFaces(position) {
        const faceTransforms = [
            {0: ['Y', -90], 2: ['Y',  90]},
            {0: ['X',  90], 2: ['X', -90]},
            {0: ['Y', 180], 2: ['Y',   0]},
        ]
        const faces = []
        const faceNormals = []
        position.forEach((p, i) => {
            if (p) {
                faceNormals.push(Array.from(position).map((q, j) => j === i ? q : 0))
                faces.push(new Face(this, position, [['x', 'y', 'z'][i], p], faceTransforms[i][p+1]))
            }
        })
        return [faces, faceNormals]
    }

    getFaceNormals() {
        const res = {}
        for (let i=0; i<this.faceTriangles.length; i++) {
            const [normId] = this.faceTriangles[i]
            if (this.faceNormals[normId]) {
                const normIdT = this.transformedTriangles[i][0]
                res[normIdT] = res[normIdT] || idTo3d(normIdT)
            }
        }
        return res
    }

    initPosition() {
        const displayPosition = this.root.displayTransform(this.position)
        const _initPos = entity => {mat4.translate(entity.geometry.transform, mat4.create(), displayPosition)}
        _initPos(this)
        this.faces.forEach(_initPos)
        this.updateFaceTriangles()
    }

    updateFaceTriangles() {
        const triangles = this.faceTriangles.map(([nI, t]) => transformTriangle(t, this.geometry.transform))
        //this assumes the normals dont ever need the root's transform...
        this.transformedTriangles = triangles.map(t => [getTriangleNormId(t), transformTriangle(t, this.root.transform)])
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
        this.updateFaceTriangles()
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
        this.rotationQueue = []

        this.transform = mat4.create()
        this.createBlocks()
        this.initUIWatcher()
        this.initDOMInputs()
        this.handleInputEvents()

        this.rotate(-45, [0, 1, 0])
        this.rotate( 35, [1, 0, 0])
    }

    createBlocks() {
        this.blocks = []

        for (let x=-1; x<2; x++) {
            for (let y=-1; y<2; y++) {
                for (let z=-1; z<2; z++) {
                    this.blocks.push(new Block(this,[x, y, z]))
                }
            }
        }
    }

    initUIWatcher() {
        const getters = [
            () => 0,  // for dom ui
            () => this.camera.aspect,
            () => this.camera.distance,
            () => this.camera.rotation,
        ]

        this.uiWatcher = getters.map((getter, i) => ({val: i ? getter() : 1, get: getter}))
    }

    initDOMInputs(){
        document.getElementById('shuffle').onclick = () => this.shuffle()
        document.getElementById('reset').onclick = () => this.reset()
    }

    triggerRedraw() {
        this.uiWatcher[0].val = 1
    }

    queueRotation(axis, level, dir) {
        this.rotationQueue.push([axis, level, dir, 90])
    }

    rotate(angle, rotAxis) {
        const rotation = mat4.rotate(mat4.create(), mat4.create(), rad(angle), rotAxis)
        mat4.multiply(this.transform, rotation, this.transform)
        this.blocks.forEach(b => b.updateFaceTriangles())
        this.triggerRedraw()
    }

    shuffle() {
        const axes = ['x', 'y', 'z']
        this.shuffling = true
        const a = [...axes]
        const randAxes = [a.splice(randInt(3), 1)[0], a.splice(randInt(2), 1)[0], a[0]]
        for (let _ of Array(randInt(3)+3)) {
            for (let axis of randAxes) {
                const level = [-1, 0, 1][randInt(3)]
                const dir = [-1, 1][randInt(2)]
                this.queueRotation(axis, level, dir)
            }
        }
    }

    reset() {
        this.rotationQueue = []
        const oldTransform = this.transform
        this.transform = mat4.create()
        this.createBlocks()

        this.transform = oldTransform
        this.blocks.forEach(b => b.updateFaceTriangles())
        this.triggerRedraw()
    }

    handleInputEvents() {
        const canvas = this.gl.canvas

        const mousedownBlockMoveHandler = e => {
            if (this.blockMovePath.length) {
                e.preventDefault()
                const [ closest, closestId, normId ] = this.findClosestBlock(e.clientX, e.clientY)
                if (closest) {
                    if (!this.blockMovePath.find(([id]) => id === closestId)) {
                        if (this.blockMovePath.length > 1) {
                            this.blockMovePath = []
                            return
                        }
                        this.blockMovePath.push([closestId])
                    }
                    const [block1, norm1] = this.blockMovePath[0]
                    if (block1 === closestId ^ norm1 === normId) {
                        const rotAxis = vec3.cross([],
                            idTo3d(norm1), norm1 !== normId ? idTo3d(normId)
                                                            : vec3.normalize([], vec3.subtract([], closest.position, this.blocks[block1].position)))
                        const [aI, axis, dir] = getAxisInfo(rotAxis)
                        if (axis && (dir === 1 || dir === -1)) {
                            this.queueRotation(axis, closest.position[aI], dir)
                        }
                        this.blockMovePath = []
                    }
                }
            }
        }

        const mouseupBlockHandler = e => {
            if (e.which === 1) {
                this.blockMovePath = []
                window.removeEventListener('pointermove', mousedownBlockMoveHandler)
                window.removeEventListener('pointerup',   mouseupBlockHandler)
            }
        }

        canvas.addEventListener('pointerdown', e => {
            if (e.which === 1 && !this.shuffling) {
                const [ closest, closestId, normId ] = this.findClosestBlock(e.clientX, e.clientY)
                if (closest && closest.getFaceNormals()[normId]) {  // todo handle this better
                    this.blockMovePath = [[closestId, normId]]
                    window.addEventListener('pointermove', mousedownBlockMoveHandler)
                    window.addEventListener('pointerup',   mouseupBlockHandler)
                }
            }
        })
    }

    findClosestBlock(x, y) {
        let closest, closestId, closestDist = Infinity, normId
        const pNear= this.camera.position
        const pFar = this.camera.getPickedVector(x, y)
        for (let [i, block] of this.blocks.map((b, i) => [i, b])) {
            if (rayCubeSphere(pNear, pFar, this.displayTransform(block.position), 1)) {
                const intersections = block.transformedTriangles.map(([nI, t]) => [nI, rayTriangle(pNear, pFar, ...t)]).filter(([nI, v]) => v)
                if (intersections.length) {
                    const [nI, dist] = min(intersections.map(([nI, v]) => [nI, vec3.distance(v, this.camera.position)]), k=>k[1])
                    if (dist < closestDist) {
                        closestDist = dist
                        closest = block
                        closestId = i
                        normId = nI
                    }
                }
            }
        }
        return [ closest, closestId, normId ]
    }

    displayTransform(positions) {
        return vec3.transformMat4([], positions.map(p => p * this.spread), this.transform)
    }

    runRotation() {
        if (this.rotationQueue.length) {
            const speed = (this.shuffling ? 2 : 1) * this.speed
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
            if (!this.rotationQueue.length && this.shuffling) {
                this.shuffling = false
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
        this.shader.setUniformMat4('u_RubikMatrix', this.transform)
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
