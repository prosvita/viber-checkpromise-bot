'use strict'

const TextMessage = require('viber-bot').Message.Text
const UrlMessage = require('viber-bot').Message.Url
const Sessions = require('./sessions')
const ClearText = require('./clear_text')

class Notifier {
    constructor (logger, bot) {
        this.logger = logger
        this.bot = bot
        this.sessions = new Sessions('db/session.json')
        this.clearText = new ClearText(logger)
    }

    started () {
        return (response) => {
            this.sessions.update(response.userProfile)
            response.send([
                new TextMessage(`Привіт!
Я буду тебе сповіщати, якщо щось зміниться серед важливих економічних показників, чи будуть виконуватись обіцянки влади.
Щоб розпочати відстежувати натисніть "Стежити!".`,
                    {/* eslint indent: "off" */
                        Type: 'keyboard',
                        Buttons: [{
                            ActionType: 'reply',
                            ActionBody: '/subscribe',
                            Text: 'Стежити!'
                        }]
                    }
                )
            ])
            this.logger.info(`Started: ${response.userProfile.id}`)
        }
    }

    subscribe () {
        return (response) => {
            this.sessions.update(response.userProfile)
            this.logger.info(`Subscribed: ${response.userProfile.id}`)
        }
    }

    subscribed () {
        return (message, response) => {
            response.send([
                new UrlMessage('https://www.checkpromise.info/?utm_medium=referral&utm_source=viber_bot&utm_campaign=start'),
                new TextMessage('Дякую за небайдужість!\nТільки твій контроль зможе створити відповідальну владу 🇺🇦')
            ])
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

        const that = this
        const userProfiles = this.sessions.getEnabledProfiles()
        const message = await this.makeMessage(changes)
        if (!message.length) {
            return
        }

        for (const userProfile of userProfiles) {
            this.bot.sendMessage(userProfile, [...message])
                .then(() => {
                    that.logger.info(`MADE notify ${userProfile.id}`)
                })
                .catch((error) => {
                    that.logger.error(`ERROR notify ${userProfile.id}`)
                    that.logger.error(error)
                })
        }
    }

    async makeMessage (changes) {
        const message = []

        for (const change of changes) {
            if (change.news) {
                const news = await this.clearText.clearMD(change.news) /* eslint no-await-in-loop: "off" */
                message.push(new TextMessage(news))
            } else if (change.measure === 'promise') {
                await this.addPromiseMessage(change, message) /* eslint no-await-in-loop: "off" */
            } else {
                const refURI = `https://www.checkpromise.info/${change.id}?utm_medium=referral&utm_source=viber_bot`
                const {url} = this.clearText.isShortenOn ? await this.clearText.getShorten(refURI) : {url: ''} /* eslint no-await-in-loop: "off" */
                message.push(new TextMessage(
                    `${(change.oldValue < change.newValue) === change.invertArrow ? '😀 Покращення!' : '🤢 Зрада!'
                    }\n${change.description} ${change.oldValue < change.newValue ? '↑' : '↓'
                    } ${change.newValue} ${change.quantity} ${change.measure} ${url}`)
                )
                if (!this.clearText.isShortenOn) {
                    message.push(new UrlMessage(refURI))
                }
            }
        }

        return message
    }

    async addPromiseMessage (change, message) {
        let statusMessage = ''

        if (change.newValue === 1) {
            statusMessage = '✅ Виконано!'
        } else if (change.newValue === 2) {
            statusMessage = '⛔️ Не виконано!'
        } else {
            return
        }

        const description = await this.clearText.clearMD(change.description)
        message.push(new TextMessage(`${statusMessage}\n${description}`))
    }
}

module.exports = Notifier
