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

function createButtonMessageWithImage(title, text, imageUrl, extra, isFriend) {
  let columnOptions = options.getCandidateProfileAction(extra, isFriend);
  console.log('createButtonMessageWithImage', columnOptions);
  return {
    type: 'template',
    altText: title,
    template: {
      type: 'buttons',
      thumbnailImageUrl: imageUrl,
      title: title,
      text: text,
      defaultAction: options.getImageAction(extra),
      actions: columnOptions,
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
  let columnOptions = options.getCandidateProfileAction(extra, isFriend);
  return {
    thumbnailImageUrl: imageUrl,
    title: title,
    text: text,
    defaultAction: options.getImageAction(extra),
    actions: columnOptions

  };
}

function createImageCarouselMessage(title, columns) {
  return {
    type: 'template',
    altText: title,
    template: {
      type: 'image_carousel',
      columns: columns,
    },
  };
}

function createImageCarouselColumns(actionText, imageUrl, extra) {
  return {
    imageUrl: imageUrl,
    action: options.getCandidateImageAction(actionText, extra)
  };
}

module.exports = {
  createTextMessage: createTextMessage,
  createImageMessage: createImageMessage,
  createButtonMessage: createButtonMessage,
  createButtonMessageWithImage: createButtonMessageWithImage,
  createConfirmMessage: createConfirmMessage,
  createCarouselMessage: createCarouselMessage,
  createCarouselColumns: createCarouselColumns,
  createImageCarouselMessage: createImageCarouselMessage,
  createImageCarouselColumns: createImageCarouselColumns,
  maxCarouselColumns: maxCarouselColumns
};