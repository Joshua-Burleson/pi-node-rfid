"use strict";
const Mfrc522 = require("./RC522");
const { parentPort, MessagePort } = require('worker_threads');

//# This loop keeps checking for chips. If one is near it will get the UID and authenticate
//console.log("scanning...");
//console.log("Please put chip or keycard in the antenna inductive zone!");
//console.log("Press Ctrl-C to stop.");

// GPIO 24 can be used for buzzer bin (PIN 18), Reset pin is (PIN 22).
// I believe that channing pattern is better for configuring pins which are optional methods to use.
const mfrc522 = new Mfrc522();

parentPort.on('message', (message) => {
    console.log(message)
    mfrc522.runReadMode(message.port.postMessage);
})
