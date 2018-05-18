const config = require('./config.json');
const options = require('./cupid-options.js');
const baseURL = config.BASE_URL;
const lineSdk = require('@line/bot-sdk');
const lineHelper = require('./line-helper.js');
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
    line.replyMessage(
      replyToken,
      [
        lineHelper.createTextMessage(text)
      ]
    );
  },

  sendGreetingMessage: (userId, replyToken) => {
    // createBlindCandidateBeforeRegisterMessage()
    //   .then((candidateMessage) => {
    let messages = [
      lineHelper.createTextMessage(`ยินดีต้อนรับสู่ Cupid Dating : บริการหาคู่ทางไลน์`),
      lineHelper.createTextMessage(`เงื่อนไขการใช้บริการ\n` +
        `1. ระบบอาจบันทึกข้อมูลส่วนตัวของคุณ ได้แก่ ชื่อโปรไฟล์ รูปโปรไฟล์ สถานะโปรไฟล์ เพื่อใช้ในการให้บริการ\n` +
        `2. ข้อมูลส่วนตัวของคุณ จะใช้แสดงต่อผู้ใช้อื่นภายในระบบนี้เท่านั้น\n` +
        `3. ระบบให้บริการอย่างเต็มประสิทธิภาพบน Smart Phone เท่านั้น\n` +
        `4. เมื่อเริ่มใช้งาน ถือว่าผู้ใช้ยอมรับเงื่อนไขการใช้งานของระบบ\n` +
        `5. ระบบอยู่ในช่วงระหว่างการทดสอบให้บริการ`)
    ];
    // if (candidateMessage) {
    //   messages.push(candidateMessage);
    //   messages.push(lineHelper.createTextMessage(`ด้านบนนี้คือตัวอย่างของผู้ใช้ในระบบของเรา\n` +
    //     `คุณจะสามารถใช้งานได้เต็มที่ หลังจากตั้งค่าตัวเลือกส่วนตัวของคุณ`));
    // }
    messages.push(lineHelper.createConfirmMessage(`ต้องการเริ่มต้นใช้งาน เดี๋ยวนี้เลยหรือไม่`, options.tosActions));
    console.log('messages', messages);
    line.replyMessage(replyToken, messages);
    // });
  },

  saveNewMember: (userId, replyToken) => {
    var memberRef = database.ref("/members/" + userId);
    memberRef.set({
      userId: userId,
      lastActionDate: Date.now(),
      status: 0,
    })
      .then(() => {
        Promise.all([
          saveMemberProfilePicture(userId),
          line.replyMessage(
            replyToken,
            [
              lineHelper.createTextMessage(`ลงทะเบียนเรียบร้อยแล้ว`),
              lineHelper.createTextMessage(`ขั้นตอนต่อไป กรุณาระบุเพศ และ อายุ ของคุณ`),
              lineHelper.createButtonMessage('ระบุเพศของคุณ', options.genderActions)
            ]
          )]
        );
      });
  },

  saveGender: (userId, replyToken, gender) => {
    updateMemberData(userId, { 'gender': gender })
      .then(() => {
        line.replyMessage(
          replyToken,
          [
            lineHelper.createButtonMessage('ระบุอายุของคุณ', options.ageActions)
          ]
        );
      })
  },

  saveAge: (userId, replyToken, age) => {
    var minAge, maxAge;
    switch (age) {
      case '18-22': minAge = 18; maxAge = 22; break;
      case '23-27': minAge = 23; maxAge = 27; break;
      case '28-32': minAge = 28; maxAge = 32; break;
      case '33UP': minAge = 33; maxAge = 99; break;
    }
    updateMemberData(userId, { 'age': age, 'min_age': minAge, 'max_age': maxAge })
      .then(() => {
        line.replyMessage(
          replyToken,
          [
            lineHelper.createTextMessage(`ขั้นตอนต่อไป กรุณาระบุเพศที่คุณสนใจ`),
            lineHelper.createButtonMessage('เพศที่คุณสนใจ', options.candidateGenderActions)
          ]
        );
      });
  },

  saveCandidateGender: (userId, replyToken, candidate_gender) => {
    updateMemberData(userId, { 'candidate_gender': candidate_gender })
      .then(() => {
        line.replyMessage(
          replyToken,
          [
            lineHelper.createButtonMessage('ระบุอายุของคนที่คุณสนใจ', options.candidateAgeActions)
          ]
        );
      });
  },

  saveCandidateAge: (userId, replyToken, candidate_age) => {
    var minAge, maxAge;
    switch (candidate_age) {
      case '18-22': minAge = 18; maxAge = 22; break;
      case '23-27': minAge = 23; maxAge = 27; break;
      case '28-32': minAge = 28; maxAge = 32; break;
      case '33UP': minAge = 33; maxAge = 99; break;
    }
    updateMemberData(userId, { 'candidate_age': candidate_age, 'candidate_min_age': minAge, 'candidate_max_age': maxAge, 'status': 1 })
      .then(() => {
        line.replyMessage(
          replyToken,
          [
            lineHelper.createTextMessage(`บันทึกข้อมูลเรียบร้อย`),
            lineHelper.createTextMessage(`เมื่อมีคู่เดทที่ตรงคุณสมบัติของคุณ ระบบจะส่งข้อมูลคู่เดทให้คุณทันที`),
          ]
        );
      })
      .then(() => {
        setTimeout(viewCandidateListAndBraodcast, 1000, userId);
      });
  },

  sendCandidateProfile: (userId, replyToken, candidateUserId) => {
    viewCandidateProfile(userId, replyToken, candidateUserId);
  },

  sendCandidateList: (userId, replyToken) => {
    viewCandidateList(userId, replyToken);
  },

  sendFriendList: (userId, replyToken) => {
    viewFriendList(userId, replyToken);
  },

  sendCandidateProfileImage: (userId, replyToken, candidateUserId) => {
    if (!candidateUserId) sendPleaseRegisterMessage(userId, replyToken);
    line.replyMessage(
      replyToken,
      [
        lineHelper.createImageMessage(getProfileUrl(candidateUserId), getProfilePreviewUrl(candidateUserId)),
      ]
    );
  },

  sendLoveToCandidate: (userId, replyToken, candidateUserId) => {
    if (!candidateUserId) sendPleaseRegisterMessage(userId, replyToken);
    var candidateName;
    var candidateProfile;
    var obj = {};
    obj['relations/' + candidateUserId] = { 'relation': 'LOVE' };
    updateMemberData(userId, obj)
      .then(() => {
        return getUserInfo(candidateUserId)
      })
      .then((profile) => {
        candidateProfile = profile;
        delete candidateProfile.relations;
        delete candidateProfile.nextCandidate;
        candidateName = candidateProfile.displayName;
        return updateMemberRelationData(userId, candidateProfile);
      })
      .then(() => {
        return readCandidateRelation(candidateUserId, userId);
      })
      .then((relation) => {
        console.log('relation', relation);
        if (relation === 'LOVE') {
          updateMemberData(userId, { 'nextMessageTo': candidateUserId })
            .then(() => {
              return line.replyMessage(
                replyToken,
                [
                  createMatchedMessage(candidateName, candidateUserId),
                  createCarouselMessage(`เพื่อนคนนี้ถูกใจคุณเหมือนกัน`, [candidateProfile], true)
                ]
              );
            })
            .then(() => {
              return getUserInfo(userId)
            })
            .then((profile) => {
              line.pushMessage(
                candidateUserId,
                [createMatchedMessage(profile.displayName, userId)]
              )
            });
        } else {
          line.replyMessage(
            replyToken,
            [
              lineHelper.createTextMessage(`ถูกใจหล่ะสิ ถ้าคุณ [${candidateName}] ถูกใจคุณเหมือนกัน เราจะบอกให้คุณรู้ทันที`),
            ]
          );
        }
      });
  },

  blockCandidate: (userId, replyToken, candidateUserId) => {
    if (!candidateUserId) sendPleaseRegisterMessage(userId, replyToken);
    var obj = {};
    obj['relations/' + candidateUserId] = { 'relation': 'BLOCK' };
    updateMemberData(userId, obj)
      .then(() => {
        line.replyMessage(
          replyToken,
          lineHelper.createTextMessage(`บล็อคเรียบร้อย จากกันชั่วนิรันดร์ '_'`),
        );
      });
  },

  chatCandidate: (userId, replyToken, candidateUserId) => {
    updateMemberData(userId, { 'nextMessageTo': candidateUserId })
      .then(() => {
        return getUserInfo(candidateUserId)
      })
      .then((profile) => {
        line.replyMessage(
          replyToken,
          lineHelper.createTextMessage(`เริ่มส่งข้อความถึง [${profile.displayName}] ได้เลย`),
        )
      });
  },

  sendMessageToFriend: (userId, replyToken, message) => {
    console.log(userId, replyToken, message);
    var candidateName;
    getUserInfo(userId)
      .then((profile) => {
        console.log('sendMessageToFriend:sender profile', JSON.stringify(profile));
        if (profile.nextMessageTo) {
          getUserInfo(profile.nextMessageTo)
            .then((candidateProfile) => {
              console.log('sendMessageToFriend:candidate profile', JSON.stringify(candidateProfile));
              candidateName = candidateProfile.displayName;
              return line.pushMessage(
                profile.nextMessageTo,
                [
                  lineHelper.createTextMessage(`ข้อความจาก [${profile.displayName}] ==>`),
                  message,
                ]
              );
              // })
              // .then(() => {
              //   return line.replyMessage(
              //     replyToken,
              //     [
              //       lineHelper.createTextMessage(`ส่งข้อความของคุณถึง [${candidateName}] เรียบร้อยแล้ว`),
              //       lineHelper.createTextMessage(`ถ้า [${candidateName}] รับคุณเป็นเพื่อน ก็เริ่มสานสัมพันธ์กันได้เล้ยยย`),
              //     ]
              //   );
              // })
              // .then(() => {
              //   updateMemberData(userId, { 'nextMessageTo': '' });
            }).catch((error) => { console.log('sendFirstMessageToCandidate Error', error + '') });
        }
      });

  },

  disableMember: (userId) => {
    updateMemberData(userId, { 'status': -1 });
  }
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// function createBlindCandidateBeforeRegisterMessage() {
//   return new Promise((resolve, reject) => {
//     try {
//       let lists = [];
//       let count = 0;
//       membersRef.orderByChild('lastActionDate')
//         .limitToLast(50)
//         .once("value", function (snapshot) {
//           snapshot.forEach(function (snap) {
//             var doc = snap.val();
//             console.log(doc);
//             if (doc.status == 1) {
//               count++;
//               if (count <= lineHelper.maxCarouselColumns) lists.push(doc);
//             }
//           });
//           var columns = lists.map(element => {
//             var title = (element.displayName || 'ไม่มีชื่อ') + ' [เพศ ' + element.gender + ' อายุ ' + element.age + ' ปี]'
//             return lineHelper.createCarouselColumns(title, element.statusMessage || 'ไม่ระบุสถานะ', config.BASE_URL + `/static/cupid.png`);
//           });
//           console.log('columns', JSON.stringify(columns));
//           if (columns.length > 0) {
//             resolve(createCarouselMessage(`ตัวอย่างคนที่อาจเป็นเพื่อนใหม่ของคุณ`, columns));
//           }
//         });
//     } catch (e) {
//       reject();
//     }
//   });
// }

function viewCandidateListAndBraodcast(userId) {
  viewCandidateList(userId, undefined, true);
}

function viewCandidateProfile(userId, replyToken, candidateUserId) {
  getUserInfo(candidateUserId)
    .then((candidateInfo) => {
      try {
        line.replyMessage(replyToken, [createCarouselMessage(`เราคิดว่า คุณอาจอยากรู้จักเพื่อนใหม่เหล่านี้`, [candidateInfo], false)]);
      } catch (e) {
        console.log(e);
      }
    });
};

function viewCandidateList(userId, replyToken, broadcast) {
  getUserInfo(userId)
    .then((userInfo) => {
      try {
        let lists = [];
        let count = 0;
        let nextCandidate = userInfo.nextCandidate;
        let query = membersRef.orderByChild('age');
        if (nextCandidate) {
          query = query.startAt(nextCandidate.age, nextCandidate.userId);
        }
        query.once("value", function (snapshot) {
          snapshot.forEach(function (snap) {
            var doc = snap.val();
            count++;
            if (doc.age === userInfo.candidate_age && doc.gender === userInfo.candidate_gender && doc.status == 1 && (!userInfo.relations || !userInfo.relations[doc.userId])) {
              // if (doc.status == 1 && (!userInfo.relations || !userInfo.relations[doc.userId])) {
              if (broadcast) sendSuggestFriendToCandidate(doc.userId, userInfo);
              if (count <= lineHelper.maxCarouselColumns) {
                lists.push(doc);
              } else {
                if (!nextCandidate) nextCandidate = doc;
              }
            }
          });
          if (nextCandidate) {
            delete nextCandidate.relations;
            delete nextCandidate.nextCandidate;
            delete nextCandidate.nextFriend;
            updateMemberData(userId, { 'nextCandidate': nextCandidate })
          }
          if (lists.length > 0) {
            if (replyToken) {
              line.replyMessage(replyToken, [createImageCarouselMessage(`เราคิดว่า คุณอาจอยากรู้จักเพื่อนใหม่เหล่านี้`, lists, false)]);
            } else {
              line.pushMessage(userId, [createImageCarouselMessage(`เราคิดว่า คุณอาจอยากรู้จักเพื่อนใหม่เหล่านี้`, lists, false)]);
            }
          }
        });
      } catch (e) {
        console.log(e);
      }
    });
};

function viewFriendList(userId, replyToken) {
  getUserInfo(userId)
    .then((userInfo) => {
      try {
        let lists = [];
        let count = 0;
        let nextFriend = userInfo.nextFriend;
        let query = membersRef.orderByChild('lastActionDate')
        if (nextFriend) {
          query = query.startAt(nextFriend.value, nextFriend.key);
        }
        query.once("value", function (snapshot) {
          snapshot.forEach(function (snap) {
            var doc = snap.val();
            count++;
            if (doc.userId !== userId && doc.relation === 'LOVE' && doc.status == 1) {
              if (count <= lineHelper.maxCarouselColumns) {
                lists.push(doc);
              } else {
                if (!nextFriend) nextFriend = doc;
              }
            }
          });
          if (nextFriend) {
            delete nextFriend.relations;
            delete nextFriend.nextCandidate;
            delete nextFriend.nextFriend;
            updateMemberData(userId, { 'nextFriend': nextFriend })
          }
          if (lists.length > 0) {
            if (replyToken) {
              line.replyMessage(replyToken, [createCarouselMessage(`เราคิดว่า คุณอาจอยากรู้จักเพื่อนใหม่เหล่านี้`, lists, true)]);
            } else {
              line.pushMessage(userId, [createCarouselMessage(`เราคิดว่า คุณอาจอยากรู้จักเพื่อนใหม่เหล่านี้`, list, true)]);
            }
          }
        });
      } catch (e) {
        console.log(e);
      }
    });
};

function sendSuggestFriendToCandidate(sendToUserId, userInfo) {
  console.log('candidate userInfo', sendToUserId, JSON.stringify(userInfo));
  // var title = (userInfo.displayName || 'ไม่มีชื่อ') + ' [เพศ ' + userInfo.gender + ' อายุ ' + userInfo.age + ' ปี]'
  // var columns = lineHelper.createCarouselColumns(title, userInfo.statusMessage || 'ไม่ระบุสถานะ', getProfileUrl(userInfo.userId), userInfo.userId);
  // console.log('columns send to candidate', JSON.stringify(columns));
  line.pushMessage(
    sendToUserId,
    [
      createCarouselMessage(`เราคิดว่า คุณอาจอยากรู้จักเพื่อนใหม่คนนี้`, [userInfo], false)
    ]
  );
}

function readCandidateRelation(candidateUserId, userId) {
  return new Promise((resolve, reject) => {
    var candidateRelationRef = database.ref("/members/" + candidateUserId + "/relations");
    candidateRelationRef.orderByKey()
      .equalTo(userId)
      .once("value", (snapshot) => {
        if (snapshot.val() !== null) {
          snapshot.forEach(function (snap) {
            var doc = snap.val();
            resolve(doc.relation);
          });
        } else {
          resolve(false);
        }
      }, (error) => {
        console.error(error + '');
      });
  });
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

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
  // return config.BASE_URL + `/downloaded/${userId}-profile.jpg`;
  return config.BASE_URL + `/downloaded/${userId}-profile-preview.jpg`;
}

function sendPleaseRegisterMessage(userId, replyToken, text) {
  line.replyMessage(
    replyToken,
    [
      lineHelper.createConfirmMessage(`ต้องการเริ่มต้นใช้งาน เดี๋ยวนี้เลยหรือไม่`, options.tosActions)
    ]
  );
}

function saveMemberProfilePicture(userId) {
  line.getProfile(userId)
    .then((profile) => {
      return Promise.all([
        downloadProfilePicture(profile.pictureUrl, getProfilePath(userId)),
        updateMemberData(userId, profile)
      ])
    })
    .then(() => {
      // createPreviewImage
      cp.execSync(`convert -resize 240x jpeg: ${getProfilePath(userId)} jpeg: ${getProfilePreviewPath(userId)}`);
    }).catch((error) => { console.log('saveMemberProfilePicture Error', error + '') });
}

function downloadProfilePicture(pictureUrl, downloadPath) {
  return new Promise((resolve, reject) => {
    http.get(pictureUrl, function (response) {
      const writable = fs.createWriteStream(downloadPath);
      response.pipe(writable);
      response.on('end', () => resolve(downloadPath));
      response.on('error', reject);
    });
  });
}

function updateMemberData(userId, object) {
  object['lastActionDate'] = Date.now();
  var memberRef = database.ref("/members/" + userId);
  return memberRef.update(object);
}

function updateMemberRelationData(userId, candidateProfile) {
  candidateProfile['lastActionDate'] = Date.now();
  var memberRelationRef = database.ref("/members/" + userId + "/relations/" + candidateProfile.userId);
  return memberRelationRef.update(candidateProfile);
}

function getUserInfo(userId) {
  return new Promise((resolve, reject) => {
    membersRef.orderByKey()
      .equalTo(userId)
      .once("value", (snapshot) => {
        snapshot.forEach(function (snap) {
          let profile = snap.val();
          console.log('getUserInfo', userId, profile);
          resolve(profile);
        });
      }, (error) => {
        console.error(error + '');
        reject();
      });
  });
}

function createMatchedMessage(candidateName, candidateId) {
  var dup_array = JSON.parse(JSON.stringify(options.sayHiActions))
  actionsOptions = dup_array.map(element => {
    element.data = element.data + '_' + candidateId;
    return element;
  });
  return
  lineHelper.createTextMessage(`ว้าววว ยินดีด้วย [${candidateName}] ก็ถูกใจคุณเหมือนกัน\nคุณสามารถส่งข้อความไปถึง [${candidateName}] ได้เลย`);
  // lineHelper.createConfirmMessage('คุณต้องการส่งข้อความเลยหรือไม่', actionsOptions),
  ;
}

function createCarouselMessage(altText, lists, isFriend) {
  var columns = lists.map(element => {
    var title = (element.displayName || 'ไม่มีชื่อ') + ' [เพศ ' + element.gender + ' อายุ ' + element.age + ' ปี]'
    return lineHelper.createCarouselColumns(title, element.statusMessage || 'ไม่ระบุสถานะ', getProfileUrl(element.userId), element.userId, isFriend);
  });
  return lineHelper.createCarouselMessage(altText, columns)
}

function createImageCarouselMessage(altText, lists) {
  var columns = lists.map(element => {
    var title = (element.displayName || 'ไม่มีชื่อ');
    return lineHelper.createImageCarouselColumns(title, getProfileUrl(element.userId), element.userId);
  });
  return lineHelper.createImageCarouselMessage(altText, columns)
}
