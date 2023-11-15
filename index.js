'use strict'

const OS = require('os')
const path = require('path')

const binaries = Object.assign(Object.create(null), {
    darwin: ['x64'],
    win32: ['x64']
})

const platform = OS.platform()
const arch = OS.arch()

let ffmpegPath = path.join(
    __dirname,
    platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
)

if (!binaries[platform] || binaries[platform].indexOf(arch) === -1) {
    ffmpegPath = null
}

module.exports = ffmpegPath
