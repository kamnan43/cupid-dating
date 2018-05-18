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
    return cupid.sendTextMessage(userId, replyToken, 'Error : NO_USER_ID');
  }
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          if (message.text.startsWith('!')) {
            return handleCommand(message, replyToken, event.source);
          }
        // case 'image':
        //   return cupid.sendImageMessage(userId, replyToken, message);
        // case 'video':
        //   return cupid.sendVideoMessage(userId, replyToken, message);
        // case 'audio':
        //   return cupid.sendAudioMessage(userId, replyToken, message);
        // case 'location':
        //   return handleLocation(message, event.replyToken);
        // case 'sticker':
        //   return handleSticker(message, event.replyToken);
        default:
          return cupid.sendMessageToFriend(userId, replyToken, message);
      }
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
            return cupid.sendTextMessage(userId, replyToken, 'ขอบคุณที่แวะมา หากคุณเปลี่ยนใจ สามารถกดปุ่ม ตกลง ด้านบนได้ทุกเมื่อ');
          }
        case 'GENDER':
          return cupid.saveGender(userId, replyToken, data);
        case 'AGE':
          return cupid.saveAge(userId, replyToken, data);
        case 'CANDIDATE-GENDER':
          return cupid.saveCandidateGender(userId, replyToken, data);
        case 'CANDIDATE-AGE':
          return cupid.saveCandidateAge(userId, replyToken, data);
        case 'ACTION-PROFILE':
          return cupid.sendCandidateProfile(userId, replyToken, data);
        case 'ACTION-IMAGE':
          return cupid.sendCandidateProfileImage(userId, replyToken, data);
        case 'ACTION-LOVE':
          return cupid.sendLoveToCandidate(userId, replyToken, data);
        case 'ACTION-BLOCK':
          return cupid.blockCandidate(userId, replyToken, data);
        case 'ACTION-CHAT':
          return cupid.chatCandidate(userId, replyToken, data);
        // case 'SAYHI-YES':
        //   return cupid.confirmedToSayHi(userId, replyToken, data);
        default:
          return;
      }
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

// function handleLocation(message, replyToken) {
//   return client.replyMessage(
//     replyToken,
//     {
//       type: 'location',
//       title: message.title,
//       address: message.address,
//       latitude: message.latitude,
//       longitude: message.longitude,
//     }
//   );
// }

// function handleSticker(message, replyToken) {
//   return client.replyMessage(
//     replyToken,
//     {
//       type: 'sticker',
//       packageId: message.packageId,
//       stickerId: message.stickerId,
//     }
//   );
// }

function handleCommand(message, replyToken, source) {
  let postbackData = message.text.replace('!', '').split("_", 2);
  let mode = postbackData[0];
  let data = postbackData[1];

  switch (mode) {
    case 'FILTER':
      return cupid.saveNewMember(source.userId, replyToken);
    case 'EXPLORE':
      return cupid.sendCandidateList(source.userId, replyToken);
    case 'FRIENDS':
      return cupid.sendFriendList(source.userId, replyToken);
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
