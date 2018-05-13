module.exports = {
  tosActions: [
    createPostBackOption('ยอมรับ', 'TOS_YES'),
    createPostBackOption('ไม่ยอมรับ', 'TOS_NO')
  ],
  genderActions: [
    createPostBackOption('ชาย', 'GENDER_M'),
    createPostBackOption('หญิง', 'GENDER_F'),
    createPostBackOption('อื่นๆ', 'GENDER_X')
  ],
  ageActions: [
    createPostBackOption('18-22 ปี', 'AGE_18'),
    createPostBackOption('23-27 ปี', 'AGE_23'),
    createPostBackOption('28-32 ปี', 'AGE_28'),
    createPostBackOption('33 ขึ้นไป', 'AGE_33')
  ],
  partnerGenderActions: [
    createPostBackOption('ชาย', 'PARTNER_GENDER_M'),
    createPostBackOption('หญิง', 'PARTNER_GENDER_F'),
    createPostBackOption('อื่นๆ', 'PARTNER_GENDER_X')
  ],
  partnerAgeActions: [
    createPostBackOption('18-22 ปี', 'PARTNER_AGE_18'),
    createPostBackOption('23-27 ปี', 'PARTNER_AGE_23'),
    createPostBackOption('28-32 ปี', 'PARTNER_AGE_28'),
    createPostBackOption('33 ขึ้นไป', 'PARTNER_AGE_33')
  ],
  partnerProfileActions: [
    createPostBackOption('ดูรูป', 'ACTION_DOWNLOAD'),
    createPostBackOption('รักเลย', 'ACTION_LOVE'),
    createPostBackOption('กลัวๆ', 'ACTION_BLOCK'),
  ]
}

function createPostBackOption(label, key) {
  return { label: label, type: 'postback', data: key, displayText: label };
}