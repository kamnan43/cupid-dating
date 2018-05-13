const config = require('./config.json');
const options = require('./cupid-options.js');
const baseURL = config.BASE_URL;
const lineSdk = require('@line/bot-sdk');
const line = new lineSdk.Client(config);
const path = require('path');
const cp = require('child_process');
const http = require('http');
const fs = require('fs');
const firebase = require("firebase-admin");
var firebaseConfig = config.firebase;
firebaseConfig.credential = firebase.credential.cert(require(firebaseConfig.serviceAccountFile));
firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var membersRef = database.ref("/members");
var relationsRef = database.ref("/members");

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
    saveMemberProfilePicture(userId);
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
      case '18-22': minAge = 18; maxAge = 22; break;
      case '23-27': minAge = 23; maxAge = 27; break;
      case '28-32': minAge = 28; maxAge = 32; break;
      case '33UP': minAge = 33; maxAge = 99; break;
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
      case '18-22': minAge = 18; maxAge = 22; break;
      case '23-27': minAge = 23; maxAge = 27; break;
      case '28-32': minAge = 28; maxAge = 32; break;
      case '33UP': minAge = 33; maxAge = 99; break;
    }
    updateMemberData(userId, { 'partner_age': partner_age, 'partner_min_age': minAge, 'partner_max_age': maxAge, 'status': 1 });
    line.replyMessage(
      replyToken,
      [
        createTextMessage(`บันทึกข้อมูลเรียบร้อย`),
        createTextMessage(`เมื่อมีคู่เดทที่ตรงคุณสมบัติของคุณ ระบบจะส่งข้อมูลคู่เดทให้คุณทันที`),
      ]
    ).then(() => {
      setTimeout(sendSuggestFriend, 1000, userId);
    });
  },

  sendPartnerProfileImage: (userId, replyToken, partnerUserId) => {
    return line.replyMessage(
      replyToken,
      [
        createImageMessage(getProfileUrl(partnerUserId), getProfilePreviewUrl(partnerUserId)),
      ]
    );
  },

  sendLoveToPartner: (userId, replyToken, partnerUserId) => {
    var partnerName;
    var obj = {};
    obj['relations/' + partnerUserId] = { 'love': true };
    updateMemberData(userId, obj);
    getUserInfo(partnerUserId)
      .then((profile) => {
        partnerName = profile.displayName;
        return alrealdyHasRelationShip(userId, partnerUserId);
      })
      .then((isLove) => {
        console.log('isLove', isLove);
        if (isLove) {
          updateMemberData(userId, { 'nextMessageTo': partnerUserId });
          line.replyMessage(
            replyToken,
            [
              createTextMessage(`ว้าววว ยินดีด้วย ${partnerName} ก็ถูกใจคุณเหมือนกัน`),
              createTextMessage(`คุณสามารถส่งข้อความไปถึง ${partnerName} ได้\nข้อความ รูปภาพ คลิปเสียง หรือวิดีโอก็ได้\nแต่อย่าลืมว่า ได้ 1 ข้อความเท่านั้น`),
              createTextMessage(`มีโอกาสครั้งเดียว อย่าให้พลาดหล่ะ เริ่ม`),
            ]
          );
        } else {
          line.replyMessage(
            replyToken,
            [
              createTextMessage(`ถูกใจหล่ะสิ ถ้าคุณ ${partnerName} ถูกใจคุณเหมือนกัน  เราจะมาบอกข่าวดีนะ`),
            ]
          );
        }
      });
  },

  sendFirstMessageToPartner: (userId, replyToken, message) => {
    var partnerName;
    getUserInfo(userId)
      .then((profile) => {
        if (profile.nextMessageTo) {
          getUserInfo(profile.nextMessageTo)
            .then((profile) => {
              partnerName = profile.displayName;
              return line.pushMessage(
                profile.nextMessageTo,
                [
                  message
                ]
              );
            })
            .then(() => {
              return line.replyMessage(
                replyToken,
                [
                  createTextMessage(`ส่งข้อความของคุณถึง ${partnerName} เรียบร้อยแล้ว`),
                  createTextMessage(`ถ้า ${partnerName} ตอบกลับ ก็เริ่มสานสัมพันธ์กันได้เล้ยยย`),
                ]
              );
            })
            .then(() => {
              updateMemberData(userId, { 'nextMessageTo': '' });
            }).catch((error) => { console.log('sendFirstMessageToPartner Error', error + '') });
        }
      });

  }
}

function getProfilePath(userId) {
  return path.join(__dirname, 'downloaded', `${userId}-profile.jpg`);
}

function getProfilePreviewPath(userId) {
  return path.join(__dirname, 'downloaded', `${userId}-profile-preview.jpg`);
}

function getProfileUrl(userId) {
  return config.BASE_URL + `/downloaded/${userId}-profile.jpg`;
}

function getProfilePreviewUrl(userId) {
  return config.BASE_URL + `/downloaded/${userId}-profile-preview.jpg`;
}

function saveMemberProfilePicture(userId) {
  return line.getProfile(userId)
    .then((profile) => {
      console.log(profile);
      updateMemberData(userId, profile);
      return downloadProfilePicture(profile.pictureUrl, getProfilePath(userId));
    })
    .then(() => {
      // createPreviewImage
      cp.execSync(`convert -resize 240x jpeg:${getProfilePath(userId)} jpeg:${getProfilePreviewPath(userId)}`);
    }).catch((error) => { console.log('saveMemberProfilePicture Error', error + '') });
}

function downloadProfilePicture(pictureUrl, downloadPath) {
  return new Promise((resolve, reject) => {
    console.log(pictureUrl);
    http.get(pictureUrl, function (response) {
      const writable = fs.createWriteStream(downloadPath);
      response.pipe(writable);
      response.on('end', () => resolve(downloadPath));
      response.on('error', reject);
    });
  });
}

function createTextMessage(text) {
  return {
    type: 'text',
    text: text
  };
}

function createImageMessage(originalContentUrl, previewImageUrl) {
  return {
    type: 'image',
    originalContentUrl: originalContentUrl,
    previewImageUrl
  };
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

function createCarouselMessage(title, columns) {
  return {
    type: 'template',
    altText: title,
    template: {
      type: 'carousel',
      columns: columns,
    },
  };
}

function createCarouselColumns(title, text, imageUrl, extra) {
  var dup_array = JSON.parse(JSON.stringify(options.partnerProfileActions))
  columnOptions = dup_array.map(element => {
    if (extra) element.data = element.data + '_' + extra;
    return element;
  });
  return {
    thumbnailImageUrl: imageUrl,
    title: title,
    text: text,
    defaultAction: columnOptions[0],
    actions: columnOptions
  };
}

function updateMemberData(userId, object) {
  var memberRef = database.ref("/members/" + userId);
  memberRef.update(object);
}

function getUserInfo(userId) {
  return new Promise((resolve, reject) => {
    membersRef.orderByKey()
      .equalTo(userId)
      .once("value", function (snapshot) {
        snapshot.forEach(function (snap) {
          resolve(snap.val());
        });
      });
  });
}

function alrealdyHasRelationShip(userId, partnerUserId) {
  return new Promise((resolve, reject) => {
    var partnerRelationRef = database.ref("/members/" + partnerUserId + "/relations");
    partnerRelationRef.orderByKey()
      .equalTo(userId)
      .once("value", function (snapshot) {
        snapshot.forEach(function (snap) {
          var doc = snap.val();
          resolve(doc.love);
        });
      });
  });
}

function sendSuggestFriend(userId) {
  getUserInfo(userId)
    .then((obj) => {
      try {
        let lists = [];
        membersRef.orderByChild('age')
          .equalTo(obj.partner_age)
          .limitToFirst(10)
          .once("value", function (snapshot) {
            snapshot.forEach(function (snap) {
              var doc = snap.val();
              if (doc.userId !== userId && doc.gender === obj.partner_gender) {
                lists.push(doc);
              }
            });
            var columns = lists.map(element => {
              return createCarouselColumns(element.displayName || 'ไม่มีชื่อ', element.statusMessage || 'ไม่ระบุสถานะ', getProfileUrl(element.userId), element.userId);
            });
            console.log('columns', JSON.stringify(columns));

            line.pushMessage(
              userId,
              [
                createCarouselMessage(`เราคิดว่า คุณอาจอยากรู้จักเพื่อนใหม่เหล่านี้`, columns)
              ]
            );
          });
      } catch (e) {
        console.log(e);
      }
    });
}
