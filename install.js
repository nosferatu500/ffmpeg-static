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

async function downloadFile(url, targetFile) {
    return await new Promise((resolve, reject) => {
        Https.get(url, response => {
            const code = response.statusCode ?? 0

            if (code >= 400) {
                return reject(new Error(response.statusMessage))
            }

            // handle redirects
            if (code > 300 && code < 400 && !!response.headers.location) {
                return downloadFile(response.headers.location, targetFile)
            }

            // save the file to disk
            const fileWriter = Fs
                .createWriteStream(targetFile)
                .on('finish', () => {
                    resolve({})
                })

            response.pipe(fileWriter)
        }).on('error', error => {
            reject(error)
        })
    })
}

const release = pkg['version']

const arch = OS.arch()
const platform = OS.platform()

const baseUrl = `https://github.com/nosferatu500/ffmpeg-static/releases/download/${release}`
const downloadUrl = `${baseUrl}/${platform}-${arch}`

downloadFile(downloadUrl, ffmpegPath)
    .then(() => {
        Fs.chmodSync(ffmpegPath, 0o755) // make executable
    })
    .catch(exitOnError)
