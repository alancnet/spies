const { randomRange, randomSingle } = require('./util')
const words = require('./words.json')
const keys = require('./keys.json')
const { Observable } = require('rxjs')

const game = (teamA, teamB) => {
    const words = randomRange(words, 25)
    const key = randomSingle(keys)
    return teamA.toArray().zip(teamB.toArray())
        .flatMap(([teamA, teamB]) => {
            const topA = randomSingle(teamA)
            const topB = randomSingle(teamB)
            const spiesA = teamA.filter(x => x != topA)
            const spiesB = teamB.filter(x => x != topB)
            return game(words, key, topA, spiesA, topB, spiesB)
        })
}

// teamN: Obs<{id:string, name:string, input:Obs<input>}>
// return: Obs<message>
const machine = (words, key, topA, spiesA, topB, spiesB) => {
    const assignmentMessage = {
        '@type': 'assignment',
        topA: topA.id,
        topB: topB.id,
        spiesA: spiesA.map(x => x.id),
        spiesB: spiesB.map(x => x.id),
        key,
        words
    }

    var state = {
        '@type': 'state',
        turn: 'top' + key.start,
        clueWord: '',
        clueNumber: '',
        selection: Array(25).fill(null)
    }

    return Observable.from([])
    .merge(topA.input.map(x => Object.assign(
        {id: topA.id, type: 'top', team: 'A'}, x)))
    .merge(topB.input.map(x => Object.assign(
        {id: topB.id, type: 'top', team: 'B'}, x)))
    .merge(Observable.from(spiesA.map(spy =>
        spy.input.map(x => Object.assign(
            {id: spy.id, type: 'spy', team: 'A'}, x))
        )).mergeAll())
    .merge(Observable.from(spiesB.map(spy =>
        spy.input.map(x => Object.assign(
            {id: spy.id, type: 'spy', team: 'B'}, x))
        )).mergeAll())
    .map(message => {
        // console.log('message', JSON.stringify(message))
        const myTurn = `${message.type}${message.team}`
        if (myTurn === state.turn) {
            switch (myTurn) {
                case 'topA':
                case 'topB':
                    if (message.hasOwnProperty('clueWord')) {
                        state.clueWord = message.clueWord
                        state.clueNumber = message.clueNumber
                        state.turn = `spy${message.team}`
                    }
                    break;
                case 'spyA':
                case 'spyB':
                    if (message.hasOwnProperty('select')) {
                        if (!state.selection[message.select]) {
                            const who = key.layout[
                                Math.floor(message.select / 5)
                            ][message.select % 5]
                            state.selection[message.select] = who
                            if (who !== message.team) {
                                const next = message.team === 'A' ? 'B' : 'A'
                                state.turn = `top${next}`
                            }
                            if (who === 'X') {
                                state.lose = message.team
                            }
                        }
                    } else if (message.pass) {
                        const next = message.team === 'A' ? 'B' : 'A'
                        state.turn = `top${next}`
                    }
                    break;
            }
        }
        if (state.selection.filter(x => x === 'A').length === 9) {
            state.win = 'A'
        }
        if (state.selection.filter(x => x === 'B').length === 9) {
            state.win = 'B'
        }
        return state
    })
    .merge(Observable.from([assignmentMessage, state]))
}

module.exports = { machine, game }
