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
    setInterval(function() {
        //# reset card
        mfrc522.reset();

        //# Scan for cards
        let response = mfrc522.findCard();
        if (!response.status) {
            //console.log("No Card");
            return;
        }
        //console.log("Card detected, CardType: " + response.bitSize);

        //# Get the UID of the card
        response = mfrc522.getUid();
        if (!response.status) {
            //console.log("UID Scan Error");
            return;
        }
        //# If we have the UID, continue
        const uid = response.data.reduce( (uidCode, char) => `${uidCode} ${char.toString(16)}`, '' );
        //console.log(`Card read UID: ${uid}`);
        message.port.postMessage(`Card read UID: ${uid}`)

        //# Select the scanned card
        const memoryCapacity = mfrc522.selectCard(uid);
        //console.log("Card Memory Capacity: " + memoryCapacity);

        //# This is the default key for authentication
        const key = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

        //# Authenticate on Block 8 with key and uid
        if (!mfrc522.authenticate(8, key, uid)) {
            //console.log("Authentication Error");
            return;
        }

        //# Dump Block 8
        //console.log("Block: 8 Data: " + mfrc522.getDataForBlock(8));

        //# Stop
        mfrc522.stopCrypto();
        }, 500);
})
