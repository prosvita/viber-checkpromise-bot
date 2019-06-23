module.exports = {
    appName: process.env.APP_NAME || 'bot',
    viberConf: {
        authToken: process.env.VIBER_TOKEN,
        name: 'Трекер влади',
        avatar: 'https://raw.githubusercontent.com/prosvita/viber-checkpromise-bot/master/icons/ua.png'
    },
    port: process.env.PORT || 8000,
    webhookUrl: process.env.VIBER_WEBHOOK_URL,
    dataUrl: process.env.DATA_JSON || 'https://www.checkpromise.info/assets/data/data.json',
    schedule: process.env.SCHEDULE || '0 10 * * *',
    logLevel: process.env.LOG_LEVEL || 'info'
}
