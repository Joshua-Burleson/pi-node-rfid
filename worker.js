"use strict";
const { parentPort } = require('worker_threads');
const Mfrc522 = require("./RC522");

const RFIDReader = new Mfrc522();

parentPort.on('message', (message) => {
    const reply = (res) => message.port.postMessage(res);
    RFIDReader.runReadMode(reply);
});
