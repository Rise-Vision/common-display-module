const messaging = require("./messaging");

const RISE_PLAYER_PROFESSIONAL_PRODUCT_CODE =
  'c4b368be86245bf9501baaa6e0b00df9719869fd';
const RISE_STORAGE_PRODUCT_CODE =
  'b0cba08a4baa0c62b8cdc621b6f6a124f89a03db';

function containsSubscriptionDataForProduct(message, code) {
  return message.subscriptions && message.subscriptions[code];
}

function isSubscriptionActive(message, code) {
  return containsSubscriptionDataForProduct(message, code) &&
    message.subscriptions[code].active;
}

function containsSubscriptionDataForRisePlayerProfessional(message) {
  return containsSubscriptionDataForProduct(message, RISE_PLAYER_PROFESSIONAL_PRODUCT_CODE);
}

function isRisePlayerProfessionalSubscriptionActive(message) {
  return isSubscriptionActive(message, RISE_PLAYER_PROFESSIONAL_PRODUCT_CODE);
}

function containsSubscriptionDataForRiseStorage(message) {
  return containsSubscriptionDataForProduct(message, RISE_STORAGE_PRODUCT_CODE);
}

function isRiseStorageSubscriptionActive(message) {
  return isSubscriptionActive(message, RISE_STORAGE_PRODUCT_CODE);
}

function requestLicensingData(moduleName) {
  const message = {from: moduleName, topic: 'licensing-request'};

  return messaging.broadcastMessage(message);
}

module.exports = {
  containsSubscriptionDataForRisePlayerProfessional,
  isRisePlayerProfessionalSubscriptionActive,
  containsSubscriptionDataForRiseStorage,
  isRiseStorageSubscriptionActive,
  containsSubscriptionDataForProduct,
  isSubscriptionActive,
  requestLicensingData,
  RISE_PLAYER_PROFESSIONAL_PRODUCT_CODE,
  RISE_STORAGE_PRODUCT_CODE
};
