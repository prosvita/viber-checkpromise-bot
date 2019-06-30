'use strict'

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const lodashId = require('lodash-id')

const MSECONDS = 1000

class Session {
    constructor (file = 'session.json') {
        const adapter = new FileSync(file)

        this.db = low(adapter)

        if (isPromise(this.db)) {
            this.db.then((db) => {
                this.db = db
                this.initDB()
            })
        } else {
            this.initDB()
        }
    }

    initDB () {
        this.db._.mixin(lodashId)
        this.db.defaults({sessions: []}).write()

        return true
    }

    getSession (key) {
        const session = this.db.get('sessions')
            .getById(key)
            .value() || {}

        return session.data || {}
    }

    saveSession (key, data) {
        if (!key) {
            return null
        }

        if (this.db._.isEmpty(data)) {
            return this.db.get('sessions')
                .removeById(key)
                .write()
        }

        /* Update data */
        if (this.db.get('sessions')
            .getById(key)
            .value()) {
            const session = this.db.get('sessions')
                .updateById(key, {data: data})
                .write()

            if (isPromise(session)) {
                return session.then((_session) => _session)
            }

            return {then: (cb) => cb(session)}
        }

        /* Insert data */
        const session = this.db.get('sessions')
            .push({id: key, data: data})
            .write()

        if (isPromise(session)) {
            return session.then((_session) => _session[0])
        }

        return {then: (cb) => cb(session[0])}
    }

    update (userProfile, disable = false) {
        const session = this.getSession(userProfile.id)

        if (!('counter' in session)) {
            session.counter = 0
            session.time_start = Math.floor(Date.now() / MSECONDS) /* eslint camelcase: "off" */
        }
        session.counter++
        session.disable = disable
        session.time_last = Math.floor(Date.now() / MSECONDS) /* eslint camelcase: "off" */

        for (const item of [
            'name',
            'avatar',
            'country',
            'language',
            'apiVersion'
        ]) {
            session[item] = item in userProfile ? userProfile[item] : null
        }

        this.saveSession(userProfile.id, session)
    }

    getEnabledProfiles () {
        return this.db.get('sessions')
            .filter((item) => !item.data.disable)
            .value()
            .map((item) => ({
                id: item.id,
                name: item.data.name,
                avatar: item.data.avatar,
                country: item.data.country,
                language: item.data.language,
                apiVersion: item.data.apiVersion
            }))
    }
}

/**
 * @param {object} obj - Test object
 * @returns {boolean} Return true if obj is Promise
 */
function isPromise (obj) {
    return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'
}

module.exports = Session
