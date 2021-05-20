const TelegramBot = require("node-telegram-bot-api");
const { EMAIL_REGEX } = require("./constants");
const ApprovedEmail = require("./models/ApprovedEmail.schema");

module.exports = async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("TELEGRAM_BOT_TOKEN environment variable not set.");
    return;
  }

  let admins = [];
  try {
    admins = JSON.parse(process.env.TELEGRAM_ADMINS);
  } catch (err) {
    console.log(err);
    return;
  }

  let approvedChats = [];
  try {
    approvedChats = JSON.parse(process.env.TELEGRAM_CHATS);
  } catch (err) {
    console.log(err);
    return;
  }

  const bot = new TelegramBot(token, { polling: { interval: 500 } });

  bot.onText(/id/, async (msg, match) => {
    bot.sendMessage(
      msg.chat.id,
      `User ID: ${msg.from.id}\nChat ID: ${msg.chat.id}`
    );
  });

  bot.onText(/\/approve (.+)/, async (msg, match) => {
    if (admins.includes(msg.from.id) && approvedChats.includes(msg.chat.id)) {
      const email = match[1];
      if (EMAIL_REGEX.test(email)) {
        const isApproved =
          typeof (await ApprovedEmail.findOne({ email })) !== "undefined";
        if (isApproved) {
          bot.sendMessage(msg.chat.id, "Already approved: " + email);
        } else {
          await ApprovedEmail.findOneAndUpdate({ email }, { email });
          bot.sendMessage(msg.chat.id, "Approved email: " + email);
        }
      } else {
        bot.sendMessage(msg.chat.id, "Invalid email.", {
          reply_to_message_id: msg.message_id,
        });
      }
    } else {
      bot.sendMessage(msg.chat.id, "You are not an admin.", {
        reply_to_message_id: msg.message_id,
      });
    }
  });

  bot.onText(/\/approve/, (msg, match) => {
    if (admins.includes(msg.from.id) && approvedChats.includes(msg.chat.id)) {
      if (msg.text.replace(/\/approve /g, "").length === 0) {
        bot.sendMessage(
          msg.chat.id,
          "Invalid usage. Usage: /approve username@email.com"
        );
      }
    } else {
      bot.sendMessage(msg.chat.id, "You are not an admin.", {
        reply_to_message_id: msg.message_id,
      });
    }
  });
};