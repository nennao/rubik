function uID() {
    return Date.now() - 1649800000000
}

function rad(d) {
    return d * Math.PI / 180
}

function deg(r) {
    return r * 180 / Math.PI
}

function mR(x, dp) {
    return Math.round((x + Number.EPSILON) * Math.pow(10, dp || 0)) /  Math.pow(10, dp || 0)
}

function sum(a) {
    return a.reduce((x, y) => x + y, 0)
}


function randInt(x) {
    return Math.floor(Math.random() * x)
}

function strJoin(arr, f) {
    return arr.map(f).join('')
}

async function fetchAndDecode(url, type='text') {
    let response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    else {
        if (type === 'text') {
            return await response.text();
        }
        if (type === 'blob') {
            return await response.blob();
        }
        throw new Error(`fetch error! unknown type "${type}"`)
    }
}


function raySphere(p1, p2, center, r) {
    // p1, p2 of the ray. center, r radius of sphere
    const p = vec3.subtract([], p1, center)
    const v = vec3.subtract([], p2, p1)

    const a = vec3.dot(v, v)
    const b = 2 * vec3.dot(p, v)
    const c = vec3.dot(p, p) - (r * r)

    return (b * b) >= (4 * a * c)
}

function rayCubeSphere(p1, p2, center, side) {
    return raySphere(p1, p2, center, 0.5 * side * Math.sqrt(3))
}


function rayTriangle(p1, p2, A, B, C) {
    const EPSILON = 0.0000001;

    const dir = vec3.subtract([], p2, p1)

    let e1, e2, h, s, q;  // vec3s
    let a, f, u, v;  // floats

    e1 = vec3.subtract([], B, A);
    e2 = vec3.subtract([], C, A);

    h = vec3.cross([], dir, e2);
    a = vec3.dot(e1, h);
    if (a > -EPSILON && a < EPSILON) {
        return false;
    }

    f = 1.0 / a;
    s = vec3.subtract([], p1, A);
    u = f * vec3.dot(s, h);
    if (u < 0.0 || u > 1.0) {
        return false;
    }

    q = vec3.cross([], s, e1);
    v = f * vec3.dot(dir, q);
    if (v < 0.0 || u + v > 1.0) {
        return false;
    }

    const t = f * vec3.dot(e2, q);
    if (t > EPSILON) {
        return vec3.add([], p1, vec3.scale([], dir, t));
    }
    return false;
}

function getTriangles(vertices, indices, transform) {
    vertices = Array.from({length: vertices.length/3}).map((_, i) => [
        vertices[i*3    ],
        vertices[i*3 + 1],
        vertices[i*3 + 2],
    ])
    return Array.from({length: indices.length/3}).map((_, i) => [
        vertices[indices[i*3    ]],
        vertices[indices[i*3 + 1]],
        vertices[indices[i*3 + 2]],
    ].map(v => transform ? vec3.transformMat4([], v, transform) : v))
}
