const options = require('./cupid-options.js');
const maxCarouselColumns = 10;
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

function createCarouselColumns(title, text, imageUrl, extra, isFriend) {
  // var dup_array = JSON.parse(JSON.stringify(options.candidateProfileActions))
  // columnOptions = dup_array.map(element => {
  //   if (extra) element.data = element.data + '_' + extra;
  //   return element;
  // });
  let columnOptions = options.getCandidateProfileAction(extra, isFriend);
  return {
    thumbnailImageUrl: imageUrl,
    title: title,
    text: text,
    defaultAction: options.imageAction,
    actions: columnOptions

  };
}

module.exports = {
  createTextMessage: createTextMessage,
  createImageMessage: createImageMessage,
  createButtonMessage: createButtonMessage,
  createConfirmMessage: createConfirmMessage,
  createCarouselMessage: createCarouselMessage,
  createCarouselColumns: createCarouselColumns,
  maxCarouselColumns: maxCarouselColumns
};