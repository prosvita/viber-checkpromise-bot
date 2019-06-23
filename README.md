# Viber bot для стеження за успіхами влади

## Розробка

```sh
# Встановлення залежностей
npm i

# Піднімаємо тунель балансера з https
[local ~]$ ssh -N -R 4040:localhost:4040 remotehost
[remote ~]$ ssh -N -L remoteip:4040:127.0.0.1:4040 remotehost

# Запуск сервера для завантаження даних
npm run dev-static

# Запуск бота
VIBER_TOKEN=xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx PORT=4040 VIBER_WEBHOOK_URL=https://remotehost npm run dev
```

## Конфігурація

Бот налаштовується зміною конфігураційних файлів в `/configs/*/node.js` в залежності від змінної оточення `NODE_ENV`.
