'use strict'

const Fs = require("fs");
const OS = require("os");
const Https = require("https");

const ffmpegPath = require(".");
const pkg = require("./package");

const exitOnError = (err) => {
    console.error(err)
    process.exit(1)
}

if (!ffmpegPath) {
    exitOnError('ffmpeg-static install failed: No binary found for architecture')
}

try {
    if (Fs.statSync(ffmpegPath).isFile()) {
        console.info('ffmpeg is installed already.')
        process.exit(0)
    }
} catch (err) {
    if (err && err.code !== 'ENOENT') exitOnError(err)
}

function downloadFile(url, targetFile) {
    const client = Https.get(url, response => {
        const code = response.statusCode ?? 0

        if (code >= 400) {
            const error = new Error(response.statusMessage)
            exitOnError(error)
        }

        // handle redirects
        if (code > 300 && code < 400 && !!response.headers.location) {
            downloadFile(response.headers.location, targetFile)
            return
        }

        // save the file to disk
        const fileWriter = Fs
            .createWriteStream(targetFile)
            .on('finish', () => {
                Fs.chmodSync(ffmpegPath, 0o755) // make executable
                client.end()
                process.exit(0)
            })

        response.pipe(fileWriter)
    }).on('error', error => {
        exitOnError(error)
    })
}

const release = pkg['tag']

const arch = OS.arch()
const platform = OS.platform()

const baseUrl = `https://github.com/nosferatu500/ffmpeg-static/releases/download/${release}`
const downloadUrl = platform === 'win32' ? `${baseUrl}/${platform}-${arch}.exe` : `${baseUrl}/${platform}-x64`
// TODO: Use this when arm64 build available
// const downloadUrl = platform === 'win32' ? `${baseUrl}/${platform}-${arch}.exe` : `${baseUrl}/${platform}-${arch}`

downloadFile(downloadUrl, ffmpegPath)
