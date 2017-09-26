const { machine } = require('../machine')
const assert = require('assert')
const { Subject, Observable } = require('rxjs')

const testKey = {
    "start": "A",
    "layout": [
        "AAAAA",
        "AAAAB",
        "BBBBB",
        "BBCCC",
        "CCCCX"
    ]
}
const testWords = 'ABCDEFGHIJKLMNOPQRSTUVWXY'.split('')

const test = (key, words, actions, checkState) => (done) => {
    const topA = { id: 1, name: 'topA', input: new Subject() }
    const spiesA = [{ id: 2, name: 'spiesA', input: new Subject() }]
    const topB = { id: 3, name: 'topB', input: new Subject() }
    const spiesB = [{ id: 4, name: 'spiesB', input: new Subject() }]

    const next = state => {
        if (state['@type'] === 'state') {
            // console.log('incoming state', JSON.stringify(state))
            const player = state.turn
            const p =
                player === 'topA' ? topA
                : player === 'spyA' ? spiesA[0]
                : player === 'topB' ? topB
                : player === 'spyB' ? spiesB[0]
                : null
            const step = actions.shift()
            if (!step) {
                finish(state)
            } else if (!step[player]) {
                done(new Error(`Expected ${player}, got ${Object.keys(step)[0]}.`))
            } else {
                // console.log('input', player, JSON.stringify(step[player]))
                p.input.next(step[player])
            }
        }
    }
    const finish = state => {
        for (var key in checkState) {
            if (state[key] !== checkState[key]) {
                return done(new Error(`Expected ${key}=${checkState[key]}, got ${key}=${state[key]}.`))
            }
        }
        done()
    }

    machine(words, key, topA, spiesA, topB, spiesB)
        .do(next, console.error, () => console.log('complete'))
        .subscribe()
}

describe('machine', () => {
    it('should exist', () => {
        assert(machine !== null, 'machine does not exist')
    })
    it('should continue if A and B have 8', test(testKey, testWords, [
        {topA: {clueWord: 'FOO', clueNumber: 3}},
        {spyA: {select: 0}},
        {spyA: {select: 1}},
        {spyA: {select: 2}},
        {spyA: {pass: true}},
        {topB: {clueWord: 'BAR', clueNumber: 3}},
        {spyB: {select: 9}},
        {spyB: {select: 10}},
        {spyB: {select: 11}},
        {spyB: {pass: true}},
        {topA: {clueWord: 'BAZ', clueNumber: 3}},
        {spyA: {select: 3}},
        {spyA: {select: 4}},
        {spyA: {select: 5}},
        {spyA: {pass: true}},
        {topB: {clueWord: 'BIZ', clueNumber: 3}},
        {spyB: {select: 12}},
        {spyB: {select: 13}},
        {spyB: {select: 14}},
        {spyB: {pass: true}},
        {topA: {clueWord: 'FOZ', clueNumber: 2}},
        {spyA: {select: 6}},
        {spyA: {select: 7}},
        {spyA: {pass: true}},
        {topB: {clueWord: 'Bot', clueNumber: 3}},
        {spyB: {select: 15}},
        {spyB: {select: 16}}
    ], {win: undefined, lose: undefined}))
    it('should win A if A gets 9', test(testKey, testWords, [
        {topA: {clueWord: 'FOO', clueNumber: 3}},
        {spyA: {select: 0}},
        {spyA: {select: 1}},
        {spyA: {select: 2}},
        {spyA: {pass: true}},
        {topB: {clueWord: 'BAR', clueNumber: 3}},
        {spyB: {select: 9}},
        {spyB: {select: 10}},
        {spyB: {select: 11}},
        {spyB: {pass: true}},
        {topA: {clueWord: 'BAZ', clueNumber: 3}},
        {spyA: {select: 3}},
        {spyA: {select: 4}},
        {spyA: {select: 5}},
        {spyA: {pass: true}},
        {topB: {clueWord: 'BIZ', clueNumber: 3}},
        {spyB: {select: 12}},
        {spyB: {select: 13}},
        {spyB: {select: 14}},
        {spyB: {pass: true}},
        {topA: {clueWord: 'FOZ', clueNumber: 3}},
        {spyA: {select: 6}},
        {spyA: {select: 7}},
        {spyA: {select: 8}}
    ], {win: 'A'}))
    it('should lose A if A gets X', test(testKey, testWords, [
        {topA: {clueWord: 'FOO', clueNumber: 3}},
        {spyA: {select: 24}}
    ], {lose: 'A'}))
    it('should lose B if B gets X', test(testKey, testWords, [
        {topA: {clueWord: 'FOO', clueNumber: 3}},
        {spyA: {pass: true}},
        {topB: {clueWord: 'BAR', clueNumber: 3}},
        {spyB: {select: 24}}
    ], {lose: 'B'}))
    it('should advance to B if A gets wrong', test(testKey, testWords, [
        {topA: {clueWord: 'FOO', clueNumber: 3}},
        {spyA: {select: 23}}
    ], {lose: undefined, turn: 'topB'}))
    it('should advance to A if B gets wrong', test(testKey, testWords, [
        {topA: {clueWord: 'FOO', clueNumber: 3}},
        {spyA: {pass: true}},
        {topB: {clueWord: 'BAR', clueNumber: 3}},
        {spyB: {select: 23}}
    ], {lose: undefined, turn: 'topA'}))

})
