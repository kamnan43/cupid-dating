'use strict';

const lineSdk = require('@line/bot-sdk');
const express = require('express');
const fs = require('fs');
const git = require('./git-deploy');
const config = require('./config.json');
const cupid = require('./cupid.js');
const http = require('http');
const https = require('https');
// const bodyParser = require('body-parser');
const app = express();
// app.use(bodyParser.json());
app.use('/static', express.static('static'));
app.use('/downloaded', express.static('downloaded'));
app.post('/git', function (req, res) {
  res.status(200).end();
  git.deploy({
    origin: "origin",
    branch: "master"
  });
});
app.post('/webhooks', lineSdk.middleware(config), (req, res) => {
  // app.post('/webhooks', (req, res) => {
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  console.log(event);
  var userId = event.source.userId;
  var replyToken = event.replyToken;
  if (!userId) {
    return cupid.sendMessage(userId, replyToken, 'Error : NO_USER_ID');
  }
  switch (event.type) {
    case 'message':
      const message = event.message;
      if (message.type === 'text' && message.text.startsWith('!')) {
        return handleText(message, replyToken, event.source);
      } else {
        return cupid.sendFirstMessageToPartner(userId, replyToken, message);
      }
    // switch (message.type) {
    //   // case 'text':
    //   //   return handleText(message, replyToken, event.source);
    //   // case 'image':
    //   //   return handleImage(message, event.replyToken);
    //   // case 'video':
    //   //   return handleVideo(message, event.replyToken);
    //   // case 'audio':
    //   //   return handleAudio(message, event.replyToken);
    //   // case 'location':
    //   //   return handleLocation(message, event.replyToken);
    //   // case 'sticker':
    //   //   return handleSticker(message, event.replyToken);
    //   default:
    //     throw new Error(`Unknown message: ${JSON.stringify(message)}`);
    // }
    case 'follow':
      return cupid.sendGreetingMessage(userId, replyToken);

    case 'unfollow':
      return cupid.disableMember(userId);

    case 'postback':
      let postbackData = event.postback.data.split("_", 2);
      let mode = postbackData[0];
      let data = postbackData[1];

      switch (mode) {
        case 'TOS':
          if (data === 'YES') {
            return cupid.saveNewMember(userId, replyToken);
          } else {
            return cupid.sendMessage(userId, replyToken, 'ขอบคุณที่แวะมา หากคุณเปลี่ยนใจ สามารถกดปุ่ม ยอมรับ ด้านบนได้ทุกเมื่อ');
          }
        case 'GENDER':
          return cupid.saveGender(userId, replyToken, data);
        case 'AGE':
          return cupid.saveAge(userId, replyToken, data);
        case 'PARTNER-GENDER':
          return cupid.savePartnerGender(userId, replyToken, data);
        case 'PARTNER-AGE':
          return cupid.savePartnerAge(userId, replyToken, data);
        case 'ACTION-DOWNLOAD':
          return cupid.sendPartnerProfileImage(userId, replyToken, data);
        case 'ACTION-LOVE':
          return cupid.sendLoveToPartner(userId, replyToken, data);
        case 'ACTION-BLOCK':
          return cupid.blockCandidate(userId, replyToken, data);
        case 'SAYHI-YES':
          return cupid.confirmedToSayHi(userId, replyToken, data);
        default:
          return;
      }
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

function handleText(message, replyToken, source) {
  let postbackData = message.text.replace('!', '').split("_", 2);
  let mode = postbackData[0];
  let data = postbackData[1];

  switch (mode) {
    case 'SETTINGS':
    return cupid.saveNewMember(userId, replyToken);
    case 'GENDER':
      return cupid.saveGender(userId, replyToken, data);

    default:
      return;
  }
}


// listen on port
const port = config.PORT;

var certOptions = {
  key: fs.readFileSync('./cert/privkey.pem'),
  cert: fs.readFileSync('./cert/fullchain.pem')
};

app.listen(port, () => {
  console.log(`listening on ${port}`);
});
https.createServer(certOptions, app).listen(port + 800);
