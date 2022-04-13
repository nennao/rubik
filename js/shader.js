class Shader {
    constructor(gl, loadCallback) {
        this.gl = gl
        this.key = `${this.constructor.name}_${uID()}`

        loadCallback(this.key)

        Promise.all(['vs', 'fs'].map(x => fetchAndDecode(`shaders/${x}_source.glsl`)))
            .then(response => {
                this.onload(response, loadCallback)
            }, err => {
                console.error(err)
            })
            .catch((err) => {
                console.error(err)
            })
    }

    onload([vsSource, fsSource], loadCallback) {
        const gl = this.gl
        this.vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource)
        this.fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource)
        this.program = this.initShaderProgram()
        this.uniformLocations = this.getUniformLocations()

        this.vertexPosition = gl.getAttribLocation(this.program, 'a_VertexPosition')
        this.vertexColor = gl.getAttribLocation(this.program, 'a_VertexColor')

        loadCallback(this.key)
    }

    loadShader(type, source) {
        const shader = this.gl.createShader(type)

        this.gl.shaderSource(shader, source)
        this.gl.compileShader(shader)

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader))
            this.gl.deleteShader(shader)
            return null
        }
        return shader
    }

    initShaderProgram() {
        const shaderProgram = this.gl.createProgram()
        this.gl.attachShader(shaderProgram, this.vertexShader)
        this.gl.attachShader(shaderProgram, this.fragmentShader)
        this.gl.linkProgram(shaderProgram)

        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram))
            return null
        }
        return shaderProgram
    }

    getUniformLocations() {
        const locations = {}
        for (let i = 0; i < this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS); i++) {
            const name = this.gl.getActiveUniform(this.program, i).name
            locations[name] = this.gl.getUniformLocation(this.program, name)
        }
        return locations
    }

    bind() {
        this.gl.useProgram(this.program)
        if (this.vertexPosition > -1) this.gl.enableVertexAttribArray(this.vertexPosition)
        if (this.vertexColor > -1) this.gl.enableVertexAttribArray(this.vertexColor)
    }
}
