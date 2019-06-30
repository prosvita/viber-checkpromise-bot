module.exports = {
    appName: process.env.APP_NAME || 'bot',
    viberConf: {
        authToken: process.env.VIBER_TOKEN,
        name: 'Трекер влади (тест)',
        avatar: 'https://raw.githubusercontent.com/prosvita/viber-checkpromise-bot/master/icons/ua.png'
    },
    port: process.env.PORT || 8000,
    webhookUrl: process.env.VIBER_WEBHOOK_URL,
    bitlyAccessToken: process.env.BITLY_ACCESS_TOKEN,
    dataUrl: process.env.DATA_JSON || 'http://127.0.0.1:8080/test/data.json',
    schedule: process.env.SCHEDULE || '*/15 * * * * *',
    logLevel: process.env.LOG_LEVEL || 'debug'
}
