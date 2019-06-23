'use strict'

const conf = require('./lib/config')

const ViberBot = require('viber-bot').Bot
const BotEvents = require('viber-bot').Events
const http = require('http')
const schedule = require('node-schedule') // https://github.com/node-schedule/node-schedule

const State = require('./lib/state')
const Notifier = require('./lib/notifier')

const logger = require('loglevel') // https://github.com/pimterry/loglevel
    .getLogger(conf.appName)

logger.setLevel(conf.logLevel)
logger.debug(conf)

if (!conf.viberConf.authToken) {
    logger.error('Could not find the Viber account access token key in your environment variable.')

    return
}
if (!conf.webhookUrl) {
    logger.error('Could not find the Webhook URL in your environment variable.')

    return
}

const bot = new ViberBot(logger, conf.viberConf)
const state = new State(logger)
const notifier = new Notifier(logger, bot)

bot.onSubscribe(notifier.subscribe())
bot.onUnsubscribe(notifier.unsubscribe())
bot.on(BotEvents.MESSAGE_RECEIVED, notifier.received())
bot.onTextMessage(/./u, notifier.anyText())

state.check()
schedule.scheduleJob(conf.schedule, async () => {
    const changes = await state.check()
    logger.info(`GOT changes ${changes.length}`)
    await notifier.notify(changes)
})

http.createServer(bot.middleware())
    .listen(conf.port, () => bot.setWebhook(conf.webhookUrl, false))
