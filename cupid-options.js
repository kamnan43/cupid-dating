module.exports = {
  tosActions: [
    createPostBackOption('เริ่มกันเลย', 'TOS_YES'),
    createPostBackOption('ยกเลิก', 'TOS_NO')
  ],
  genderActions: [
    createPostBackOption('ชาย', 'GENDER_M'),
    createPostBackOption('หญิง', 'GENDER_F'),
    createPostBackOption('อื่นๆ', 'GENDER_X')
  ],
  ageActions: [
    createPostBackOption('18-22 ปี', 'AGE_18-22'),
    createPostBackOption('23-27 ปี', 'AGE_23-27'),
    createPostBackOption('28-32 ปี', 'AGE_28-32'),
    createPostBackOption('33 ขึ้นไป', 'AGE_33UP')
  ],
  candidateGenderActions: [
    createPostBackOption('ชาย', 'CANDIDATE-GENDER_M'),
    createPostBackOption('หญิง', 'CANDIDATE-GENDER_F'),
    createPostBackOption('อื่นๆ', 'CANDIDATE-GENDER_X')
  ],
  candidateAgeActions: [
    createPostBackOption('18-22 ปี', 'CANDIDATE-AGE_18-22'),
    createPostBackOption('23-27 ปี', 'CANDIDATE-AGE_23-27'),
    createPostBackOption('28-32 ปี', 'CANDIDATE-AGE_28-32'),
    createPostBackOption('33 ขึ้นไป', 'CANDIDATE-AGE_33UP')
  ],
  sayHiActions: [
    createPostBackOption('ส่งเลย', 'SAYHI-YES'),
    createPostBackOption('ไม่ใช่ตอนนี้', 'SAYHI-NO'),
  ],
  friendActions: [
    createPostBackOption('รับ', 'FRIEND_YES'),
    createPostBackOption('ไม่รับ', 'FRIEND_NO')
  ],
  getImageAction: () => {
    createPostBackOption('ดูรูป', 'ACTION-IMAGE');
  },
  getCandidateProfileAction: (extra, isFriend) => {
    let options = [];
    if (isFriend) {
      options = [
        createPostBackOption('ทักทาย', 'ACTION-CHAT', extra),
        createPostBackOption('บล็อค', 'ACTION-BLOCK', extra),
        createPostBackOption('แนะนำให้เพื่อน', 'ACTION-SHARE', extra),
      ];
    } else {
      options = [
        createPostBackOption('ถูกใจ', 'ACTION-LOVE', extra),
        createPostBackOption('บล็อค', 'ACTION-BLOCK', extra),
        createPostBackOption('แนะนำให้เพื่อน', 'ACTION-SHARE', extra),
      ]
    }
    return options;
  },
  getCandidateImageAction: (actionText, extra) => {
    return createPostBackOption(actionText, 'ACTION-PROFILE', extra);
  }
}

function createPostBackOption(label, key, data) {
  return { label: label, type: 'postback', data: (key + '_' + (data || '')), displayText: label };
}