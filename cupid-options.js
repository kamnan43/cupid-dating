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
    createPostBackOption('18-22 ปี', 'AGE_18-22'),
    createPostBackOption('23-27 ปี', 'AGE_23-27'),
    createPostBackOption('28-32 ปี', 'AGE_28-32'),
    createPostBackOption('33 ขึ้นไป', 'AGE_33UP')
  ],
  partnerGenderActions: [
    createPostBackOption('ชาย', 'PARTNER-GENDER_M'),
    createPostBackOption('หญิง', 'PARTNER-GENDER_F'),
    createPostBackOption('อื่นๆ', 'PARTNER-GENDER_X')
  ],
  partnerAgeActions: [
    createPostBackOption('18-22 ปี', 'PARTNER-AGE_18-22'),
    createPostBackOption('23-27 ปี', 'PARTNER-AGE_23-27'),
    createPostBackOption('28-32 ปี', 'PARTNER-AGE_28-32'),
    createPostBackOption('33 ขึ้นไป', 'PARTNER-AGE_33UP')
  ],
  partnerProfileActions: [
    createPostBackOption('ดูรูป', 'ACTION-DOWNLOAD'),
    createPostBackOption('รักเลย', 'ACTION-LOVE'),
    createPostBackOption('กลัวๆ', 'ACTION-BLOCK'),
    createPostBackOption('กลัวdddๆ', 'ACTION-BL'),
  ]
}

function createPostBackOption(label, key) {
  return { label: label, type: 'postback', data: key, displayText: label };
}