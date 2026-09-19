'use strict';
globalThis.scrollReaderMode = chrome.storage.local.get({mode:'batch'})
  .then(({mode}) => ['batch','all'].includes(mode) ? mode : 'batch')
  .catch(() => 'batch');
