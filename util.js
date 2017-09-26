const randomRange = (arr, count) => {
    const copy = arr.slice(0)
    const selection = []
    while (selection.length < count && copy.length) {
        selection.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
    }
    return selection
}

const randomSingle = arr =>
    arr[Math.floor[Math.random() * arr.length]]

module.exports = {
    randomRange,
    randomSingle
}
