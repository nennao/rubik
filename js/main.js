function initGL() {
    const canvas = document.getElementById('glCanvas')
    const gl = canvas.getContext('webgl', {alpha: false})

    if (gl === null) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.')
        return;
    }
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.CULL_FACE)
    window.gl = gl
    return gl
}


function main() {
    const gl = initGL()

    const loading = {}
    const loadCallback = (key) => {
        if (loading[key]) {
            delete loading[key]
        }
        else {
            loading[key] = true
        }
    }

    const camera = new Camera(gl)
    const shader = new Shader(gl, loadCallback)
    const rubik = new Rubik(gl, camera, shader)

    window.addEventListener("resize", camera.resize.bind(camera))

    function render(now) {
        if (!Object.keys(loading).length) {
            rubik.render(now*0.001)
        }
        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
}


window.onload = main
