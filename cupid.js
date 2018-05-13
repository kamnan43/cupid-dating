const config = require('./config.json');
const options = require('./cupid-options.js');
const baseURL = config.BASE_URL;
const lineSdk = require('@line/bot-sdk');
const line = new lineSdk.Client(config);
const firebase = require("firebase-admin");
var firebaseConfig = config.firebase;
firebaseConfig.credential = firebase.credential.cert(require(firebaseConfig.serviceAccountFile));
firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var membersRef = database.ref("/members");

module.exports = {
  sendMessage: (userId, replyToken, text) => {
    return line.replyMessage(
      replyToken,
      [
        createTextMessage(text)
      ]
    );
  },

  sendGreetingMessage: (userId, replyToken) => {
    return line.replyMessage(
      replyToken,
      [
        createTextMessage(`ยินดีต้อนรับสู่ Cupid Dating : บริการหาคู่ทางไลน์`),
        createTextMessage(`เงื่อนไขการใช้บริการ\n` +
          `1. ระบบอาจบันทึกข้อมูลส่วนตัวของคุณ ได้แก่ ชื่อโปรไฟล์ รูปโปรไฟล์ สถานะโปรไฟล์ เพื่อใช้ในการให้บริการ\n` +
          `2. ข้อมูลส่วนตัวของคุณจะแสดงต่อผู้ใช้อื่นในระบบ เฉพาะคนที่ระบุความต้องการตรงตามที่คุณระบุเท่านั้น\n` +
          `3. ระบบอยู่ในช่วงระหว่างการทดสอบให้บริการ`),
        createConfirmMessage('คุณยอมรับเงื่อนไขการใช้งานหรือไม่', options.tosActions)
      ]
    );
  },

  saveNewMember: (userId, replyToken) => {
    var memberRef = database.ref("/members/" + userId);
    memberRef.set({
      userId: userId,
      status: 0,
    });

    return line.replyMessage(
      replyToken,
      [
        createTextMessage(`ลงทะเบียนเรียบร้อยแล้ว`),
        createTextMessage(`ขั้นตอนต่อไป กรุณาระบุเพศ และ อายุ ของคุณ`),
        createButtonMessage('ระบุเพศของคุณ', options.genderActions)
      ]
    );
  },

  saveGender: (userId, replyToken, gender) => {
    updateMemberData(userId, { 'gender': gender });
    return line.replyMessage(
      replyToken,
      [
        createButtonMessage('ระบุอายุของคุณ', options.ageActions)
      ]
    );
  },

  saveAge: (userId, replyToken, age) => {
    var minAge, maxAge;
    switch (age) {
      case 'AGE_18': minAge = 18; maxAge = 22; break;
      case 'AGE_23': minAge = 23; maxAge = 27; break;
      case 'AGE_28': minAge = 28; maxAge = 32; break;
      case 'AGE_33': minAge = 33; maxAge = 99; break;
    }
    updateMemberData(userId, { 'age': age, 'min_age': minAge, 'max_age': maxAge });
    return line.replyMessage(
      replyToken,
      [
        createTextMessage(`ขั้นตอนต่อไป กรุณาระบุเพศที่คุณสนใจ`),
        createButtonMessage('เพศที่คุณสนใจ', options.partnerGenderActions)
      ]
    );
  },

  savePartnerGender: (userId, replyToken, partner_gender) => {
    updateMemberData(userId, { 'partner_gender': partner_gender });
    return line.replyMessage(
      replyToken,
      [
        createButtonMessage('ระบุอายุของคนที่คุณสนใจ', options.partnerAgeActions)
      ]
    );
  },

  savePartnerAge: (userId, replyToken, partner_age) => {
    var minAge, maxAge;
    switch (partner_age) {
      case 'AGE_18': minAge = 18; maxAge = 22; break;
      case 'AGE_23': minAge = 23; maxAge = 27; break;
      case 'AGE_28': minAge = 28; maxAge = 32; break;
      case 'AGE_33': minAge = 33; maxAge = 99; break;
    }
    updateMemberData(userId, { 'partner_age': partner_age, 'partner_min_age': minAge, 'partner_max_age': maxAge, 'status': 1 });
    return line.replyMessage(
      replyToken,
      [
        createTextMessage(`บันทึกข้อมูลเรียบร้อย`),
        createTextMessage(`เมื่อมีคู่เดทที่ตรงคุณสมบัติของคุณ ระบบจะส่งข้อมูลคู่เดทให้คุณทันที`),
      ]
    ).then(() => {
      setTimeout(sendSuggestFriend, 1000, userId);
    });
  },

  // handleText(message, replyToken, source) {
  //   const buttonsImageURL = `${baseURL}/static/buttons/1040.jpg`;

  //   switch (message.text) {
  //     case 'profile':
  //       if (source.userId) {
  //         const downloadPath = path.join(__dirname, 'downloaded', `${source.userId}.jpg`);
  //         const previewPath = path.join(__dirname, 'downloaded', `${source.userId}-preview.jpg`);
  //         return client.getProfile(source.userId)
  //           .then((profile) => {
  //             replyText(
  //               replyToken,
  //               [
  //                 `Display name: ${profile.displayName}`,
  //                 `Status message: ${profile.statusMessage || '-'}`,
  //               ]
  //             ).then(() => {
  //               downloadProfilePicture(profile.pictureUrl, downloadPath);
  //             }).then(() => {
  //               cp.execSync(`convert -resize 240x jpeg:${downloadPath} jpeg:${previewPath}`);
  //               client.pushMessage(
  //                 source.userId,
  //                 {
  //                   type: 'image',
  //                   originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
  //                   previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
  //                 }
  //               ).catch((error) => { console.log('error', error) });
  //             });
  //           });
  //       } else {
  //         return replyText(replyToken, 'Bot can\'t use profile API without user ID');
  //       }
  //     case 'buttons':
  //       return line.replyMessage(
  //         replyToken,
  //         {
  //           type: 'template',
  //           altText: 'Buttons alt text',
  //           template: {
  //             type: 'buttons',
  //             thumbnailImageUrl: buttonsImageURL,
  //             title: 'My button sample',
  //             text: 'Hello, my button',
  //             actions: [
  //               { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
  //               { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
  //               { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
  //               { label: 'Say message', type: 'message', text: 'Rice=米' },
  //             ],
  //           },
  //         }
  //       );
  //     case 'confirm':
  //       return line.replyMessage(
  //         replyToken,
  //         {
  //           type: 'template',
  //           altText: 'Confirm alt text',
  //           template: {
  //             type: 'confirm',
  //             text: 'Do it?',
  //             actions: [
  //               { label: 'Yes', type: 'message', text: 'Yes!' },
  //               { label: 'No', type: 'message', text: 'No!' },
  //             ],
  //           },
  //         }
  //       )
  //     case 'carousel':
  //       return line.replyMessage(
  //         replyToken,
  //         {
  //           type: 'template',
  //           altText: 'Carousel alt text',
  //           template: {
  //             type: 'carousel',
  //             columns: [
  //               {
  //                 thumbnailImageUrl: buttonsImageURL,
  //                 title: 'hoge',
  //                 text: 'fuga',
  //                 actions: [
  //                   { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
  //                   { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
  //                 ],
  //               },
  //               {
  //                 thumbnailImageUrl: buttonsImageURL,
  //                 title: 'hoge',
  //                 text: 'fuga',
  //                 actions: [
  //                   { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
  //                   { label: 'Say message', type: 'message', text: 'Rice=米' },
  //                 ],
  //               },
  //             ],
  //           },
  //         }
  //       );
  //     case 'image carousel':
  //       return line.replyMessage(
  //         replyToken,
  //         {
  //           type: 'template',
  //           altText: 'Image carousel alt text',
  //           template: {
  //             type: 'image_carousel',
  //             columns: [
  //               {
  //                 imageUrl: buttonsImageURL,
  //                 action: { label: 'Go to LINE', type: 'uri', uri: 'https://line.me' },
  //               },
  //               {
  //                 imageUrl: buttonsImageURL,
  //                 action: { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
  //               },
  //               {
  //                 imageUrl: buttonsImageURL,
  //                 action: { label: 'Say message', type: 'message', text: 'Rice=米' },
  //               },
  //               {
  //                 imageUrl: buttonsImageURL,
  //                 action: {
  //                   label: 'datetime',
  //                   type: 'datetimepicker',
  //                   data: 'DATETIME',
  //                   mode: 'datetime',
  //                 },
  //               },
  //             ]
  //           },
  //         }
  //       );
  //     case 'datetime':
  //       return line.replyMessage(
  //         replyToken,
  //         {
  //           type: 'template',
  //           altText: 'Datetime pickers alt text',
  //           template: {
  //             type: 'buttons',
  //             text: 'Select date / time !',
  //             actions: [
  //               { type: 'datetimepicker', label: 'date', data: 'DATE', mode: 'date' },
  //               { type: 'datetimepicker', label: 'time', data: 'TIME', mode: 'time' },
  //               { type: 'datetimepicker', label: 'datetime', data: 'DATETIME', mode: 'datetime' },
  //             ],
  //           },
  //         }
  //       );
  //     case 'imagemap':
  //       return line.replyMessage(
  //         replyToken,
  //         {
  //           type: 'imagemap',
  //           baseUrl: `${baseURL}/static/rich`,
  //           altText: 'Imagemap alt text',
  //           baseSize: { width: 1040, height: 1040 },
  //           actions: [
  //             { area: { x: 0, y: 0, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/manga/en' },
  //             { area: { x: 520, y: 0, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/music/en' },
  //             { area: { x: 0, y: 520, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/play/en' },
  //             { area: { x: 520, y: 520, width: 520, height: 520 }, type: 'message', text: 'URANAI!' },
  //           ],
  //         }
  //       );

  //     case 'bye':
  //       switch (source.type) {
  //         case 'user':
  //           return replyText(replyToken, 'Bot can\'t leave from 1:1 chat');
  //         case 'group':
  //           return replyText(replyToken, 'Leaving group')
  //             .then(() => client.leaveGroup(source.groupId));
  //         case 'room':
  //           return replyText(replyToken, 'Leaving room')
  //             .then(() => client.leaveRoom(source.roomId));
  //       }


  //     default:
  //       console.log(`Echo message to ${replyToken}: ${message.text}`);
  //       return replyText(replyToken, message.text);
  //   }
  // }

  // handleImage(message, replyToken) {
  //   const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.jpg`);
  //   const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);

  //   return downloadContent(message.id, downloadPath)
  //     .then((downloadPath) => {
  //       // ImageMagick is needed here to run 'convert'
  //       // Please consider about security and performance by yourself
  //       cp.execSync(`convert -resize 240x jpeg:${downloadPath} jpeg:${previewPath}`);

  //       return line.replyMessage(
  //         replyToken,
  //         {
  //           type: 'image',
  //           originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
  //           previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
  //         }
  //       );
  //     });
  // }

  // handleVideo(message, replyToken) {
  //   const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.mp4`);
  //   const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);

  //   return downloadContent(message.id, downloadPath)
  //     .then((downloadPath) => {
  //       // FFmpeg and ImageMagick is needed here to run 'convert'
  //       // Please consider about security and performance by yourself
  //       cp.execSync(`convert mp4:${downloadPath}[0] jpeg:${previewPath}`);

  //       return line.replyMessage(
  //         replyToken,
  //         {
  //           type: 'video',
  //           originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
  //           previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
  //         }
  //       );
  //     });
  // }

  // handleAudio(message, replyToken) {
  //   const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.m4a`);

  //   return downloadContent(message.id, downloadPath)
  //     .then((downloadPath) => {
  //       var getDuration = require('get-audio-duration');
  //       var audioDuration;
  //       getDuration(downloadPath)
  //         .then((duration) => { audioDuration = duration; })
  //         .catch((error) => { audioDuration = 1; })
  //         .finally(() => {
  //           return line.replyMessage(
  //             replyToken,
  //             {
  //               type: 'audio',
  //               originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
  //               duration: audioDuration * 1000,
  //             }
  //           );
  //         });
  //     });
  // }

  // downloadContent(messageId, downloadPath) {
  //   return client.getMessageContent(messageId)
  //     .then((stream) => new Promise((resolve, reject) => {
  //       const writable = fs.createWriteStream(downloadPath);
  //       stream.pipe(writable);
  //       stream.on('end', () => resolve(downloadPath));
  //       stream.on('error', reject);
  //     }));
  // }

  // downloadProfilePicture(pictureUrl, downloadPath) {
  //   return new Promise((resolve, reject) => {
  //     http.get(pictureUrl, function (response) {
  //       const writable = fs.createWriteStream(downloadPath);
  //       response.pipe(writable);
  //       response.on('end', () => resolve(downloadPath));
  //       response.on('error', reject);
  //     });
  //   });
  // }

  // handleLocation(message, replyToken) {
  //   return line.replyMessage(
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

  // handleSticker(message, replyToken) {
  //   return line.replyMessage(
  //     replyToken,
  //     {
  //       type: 'sticker',
  //       packageId: message.packageId,
  //       stickerId: message.stickerId,
  //     }
  //   );
  // }
};
// simple reply function
function createTextMessage(text) {
  return { type: 'text', text: text };
}

function createConfirmMessage(title, actions) {
  return {
    type: 'template',
    altText: title,
    template: {
      type: 'confirm',
      text: title,
      actions: actions,
    },
  };
}

function createButtonMessage(title, actions) {
  return {
    type: 'template',
    altText: title,
    template: {
      type: 'buttons',
      text: title,
      actions: actions,
    },
  };
}

function updateMemberData(userId, object) {
  var memberRef = database.ref("/members/" + userId);
  memberRef.update(object);
}

function sendSuggestFriend(userId) {
  console.log('userId', userId);
  getUserInfo(userId, (obj) => {
    console.log('getUserInfo', obj);
    try {
      membersRef.orderByChild('age')
        .equalTo('partner_age')
        .limitToFirst(10)
        .once("value", function (snapshot) {
          snapshot.forEach(function (snap) {
            console.log('A', snap.val());
          });
        });
    } catch (e) {
      console.log(e);
      cb();
    }
  });
}

function getUserInfo(userId, cb) {
  membersRef.orderByKey()
    .equalTo(userId)
    .once("value", function (snapshot) {
      snapshot.forEach(function (snap) {
        cb(snap.val());
      });
    });
}
