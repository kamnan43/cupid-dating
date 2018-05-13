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
    cupid.sendMessage(userId, replyToken, 'Error : NO_USER_ID');
  }
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, replyToken, event.source);
        // case 'image':
        //   return handleImage(message, event.replyToken);
        // case 'video':
        //   return handleVideo(message, event.replyToken);
        // case 'audio':
        //   return handleAudio(message, event.replyToken);
        // case 'location':
        //   return handleLocation(message, event.replyToken);
        // case 'sticker':
        //   return handleSticker(message, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case 'follow':
      return cupid.sendGreetingMessage(userId, replyToken);

    case 'unfollow':
      return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

    case 'postback':
      let data = event.postback.data;
      console.log('postback', data);
      switch (data) {
        case 'TOS_YES':
          cupid.saveNewMember(userId, replyToken);
          break;
        case 'TOS_NO':
          cupid.sendMessage(userId, replyToken, 'ขอบคุณที่แวะมา หากคุณเปลี่ยนใจ สามารถกดปุ่ม ยอมรับ ด้านบนได้ทุกเมื่อ');
          break;
        case 'GENDER_M':
        case 'GENDER_F':
        case 'GENDER_X':
          cupid.saveGender(userId, replyToken, data);
          break;
        case 'AGE_18':
        case 'AGE_23':
        case 'AGE_28':
        case 'AGE_33':
          cupid.saveAge(userId, replyToken, data);
          break;
        case 'PARTNER_GENDER_M':
        case 'PARTNER_GENDER_F':
        case 'PARTNER_GENDER_X':
          cupid.savePartnerGender(userId, replyToken, data);
          break;
        case 'PARTNER_AGE_18':
        case 'PARTNER_AGE_23':
        case 'PARTNER_AGE_28':
        case 'PARTNER_AGE_33':
          cupid.savePartnerAge(userId, replyToken, data);
          break;
        default:
          return;
      }
      break;
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

function handleText(message, replyToken, source) {
  switch (message.text) {
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
