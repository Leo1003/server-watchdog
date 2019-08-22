
const TGBot = require('node-telegram-bot-api')

const token = ''
const gid = ''

let bot = new TGBot(token, { polling: false })

function sendMessage(msg) {
	bot.sendMessage(gid, msg)
}

module.exports = {
	sendMessage
}
