'use strict'

const TextMessage = require('viber-bot').Message.Text
const UrlMessage = require('viber-bot').Message.Url
const Sessions = require('./sessions')

class Notifier {
    constructor (logger, bot) {
        this.logger = logger
        this.bot = bot
        this.sessions = new Sessions('db/session.json')
    }

    subscribe () {
        return (response) => {
            this.sessions.update(response.userProfile)
            response.send([
                new TextMessage(`Привіт!
Я буду тебе сповіщати, якщо щось зміниться серед важливих економічних показників, чи будуть виконуватись обіцянки влади.
Подробиці на сайті`),
                new UrlMessage('https://www.checkpromise.info/?utm_medium=referral&utm_source=viber_bot&utm_campaign=start')
            ])
            this.logger.info(`Subscribed: ${response.userProfile.id}`)
        }
    }

    unsubscribe () {
        return (userId) => {
            this.sessions.update({id: userId}, true)
            this.logger.info(`Unsubscribed: ${userId}`)
        }
    }

    received () {
        return (message, response) => {
            this.sessions.update(response.userProfile)

            if (!(message instanceof TextMessage)) {
                response.send(new TextMessage('Підтримую, хоча і не розумію цього повідомлення :)'))
            }
        }
    }

    anyText () { /* eslint class-methods-use-this: "off" */
        return (message, response) => {
            response.send(new TextMessage('Вибач, я ще не вмію читати повідомлення, все буде згодом ;)'))
        }
    }

    async notify (changes) {
        if (!changes.length) {
            return
        }

        const userProfiles = this.sessions.getEnabledProfiles()
        const message = this.makeMessage(changes)

        for (const userProfile of userProfiles) {
            try {
                await this.bot.sendMessage(userProfile, message) /* eslint no-await-in-loop: "off" */
                this.logger.info(`MADE sendMessage ${userProfile.id}`)
            } catch (error) {
                this.logger.error(`ERROR sendMessage ${error.message}`)
            }
        }
    }

    makeMessage (changes) { /* eslint class-methods-use-this: "off" */
        const message = []

        for (const change of changes) {
            if (change.news) {
                message.push(new TextMessage(change.news))
            } else if (change.measure === 'completed') {
                if (change.newValue) {
                    message.push(new TextMessage(`✅ Виконане!\n${change.description}`))
                }
            } else {
                message.push(new TextMessage(`${(change.oldValue < change.newValue) === change.invertArrow ? '😀 Покращення!' : '🤢 Зрада!'
                }\n${change.description} ${change.oldValue < change.newValue ? '↑' : '↓'
                } ${change.newValue} ${change.quantity} ${change.measure}`))
                message.push(new UrlMessage(`https://www.checkpromise.info/${change.id}?utm_medium=referral&utm_source=viber_bot`))
            }
        }

        return message
    }
}

module.exports = Notifier
