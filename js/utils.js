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
