'use strict'

const {BitlyClient} = require('bitly')
const mem = require('mem')
const conf = require('./config')

class ClearText {
    constructor (logger) {
        this.logger = logger

        this.isShortenOn = false
        this.getShorten = (str) => Promise.resolve({link: str})
        if (typeof conf.bitlyAccessToken !== 'undefined' && conf.bitlyAccessToken !== '') {
            try {
                this.bitly = new BitlyClient(conf.bitlyAccessToken, {})
                this.getShorten = mem(this.bitly.shorten).bind(this.bitly)
                this.isShortenOn = true
            } catch (error) {
                this.logger.error(error)
            }
        }
    }

    async clearMD (str) {
        let result = str

        result = result.replace(/(^|\b|\W|\s)(\*{1,2})(\S(.*?\S)?)\2(\b|\W|\s|$)/gu, '$1$3$5')
        result = result.replace(/(^|\b|\W|\s)(_{1,2})(\S(.*?\S)?)\2(\b|\W|\s|$)/gu, '$1$3$5')
        result = result.replace(/\B```([^```]+)```\B/gu, '$1')
        result = result.replace(/\B`([^`]+)`\B/gu, '$1')
        result = await this.replaceUri(result)

        return result
    }

    async replaceUri (str) {
        const regex = /\[([^\[\]]+)\]\(([^)]+)\)/gu /* eslint no-useless-escape: off */
        const promises = []

        str.replace(regex, (match, ...args) => {
            const promise = this.wrapperShorten(match, ...args)
            promises.push(promise)
        })
        const data = await Promise.all(promises)

        return str.replace(regex, () => data.shift())
    }

    async wrapperShorten (str, p1, p2) {
        try {
            const result = await this.getShorten(p2)

            return `${result.link} `
        } catch (error) {
            this.logger.error(error)

            return p1
        }
    }
}

module.exports = ClearText
