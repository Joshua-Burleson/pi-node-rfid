const Mfrc522 = require("mfrc522-rpi");
const SoftSPI = require("rpi-softspi");

const defaultSPI = new SoftSPI({
    clock: 23, // pin number of SCLK
    mosi: 19, // pin number of MOSI
    miso: 21, // pin number of MISO
    client: 24 // pin number of CS
  });

const defaultAuthKey = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

class RC522 extends Mfrc522 {

   constructor(authKey = defaultAuthKey, spiSettings = defaultSPI, resetPin = 22, buzzerPin = 18){
         super(spiSettings);
         this.authKey = authKey;
         this.setResetPin(resetPin);
         this.setBuzzerPin(buzzerPin);
         this.activeOperation = null;
    }

    readMode = callback =>  {
            //# reset card
            //# Scan for cards
            let response = this.findCard();
            if (!response.status) {
                //console.log("No Card");
                return;
            }
            //console.log("Card detected, CardType: " + response.bitSize);
    
            //# Get the UID of the card
            response = this.getUid();
            if (!response.status) {
                //console.log("UID Scan Error");
                return;
            }
            //# If we have the UID, continue
            const uid = response.data.reduce( (uidCode, char) => `${uidCode} ${char.toString(16)}`, '' );
            //console.log(`Card read UID: ${uid}`);
            callback(`Card read UID: ${uid}`)
    
            //# Select the scanned card
            const memoryCapacity = this.selectCard(uid);
            //console.log("Card Memory Capacity: " + memoryCapacity);
    
            //# This is the default key for authentication
            const key = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
    
            //# Authenticate on Block 8 with key and uid
            if (!this.authenticate(8, key, uid)) {
                //console.log("Authentication Error");
                return;
            }
    
            //# Dump Block 8
            //console.log("Block: 8 Data: " + this.getDataForBlock(8));
    
            //# Stop
            this.stopCrypto();
            }

    reset = () => {
        super.reset();
        clearInterval(this.activeOperation);
        this.activeOperation = null;
    }

    runReadMode = (callback, interval = 500) => this.#run(this.readMode, interval, callback);

    #run = (mode, interval, callback) => {
        this.reset();
        this.#init(mode, interval, callback);
    }

    #init = (operation, interval, callback) => this.activeOperation = setInterval(operation, interval, callback);


    /* readMode = ( message ) => setInterval(() => {
        //# reset card
        this.reset();

        //# Scan for cards
        const scanResponse = this.findCard();
        if ( !scanResponse.status ) {
            //console.log("No Card");
            return;
        }
        //console.log("Card detected, CardType: " + response.bitSize);

        //# Get the UID of the card
        const response = this.getUid();
        if (!response.status) {
            //console.log("UID Scan Error");
            return;
        }
        //# If we have the UID, continue
        const uid = response.data.reduce( (uidCode, char) => `${uidCode} ${char.toString(16)}`, '' );
        //console.log(`Card read UID: ${uid}`);
        message.port.postMessage(`Card read UID: ${uid}`)

        //# Select the scanned card
        const memoryCapacity = this.selectCard(uid);
        //console.log("Card Memory Capacity: " + memoryCapacity);

        //# This is the default key for authentication
        const key = this.authKey;

        //# Authenticate on Block 8 with key and uid
        if (!this.authenticate(8, key, uid)) {
            //console.log("Authentication Error");
            return;
        }

        //# Dump Block 8
        //console.log("Block: 8 Data: " + this.getDataForBlock(8));

        //# Stop
        this.stopCrypto();
        }, 500); */


}

module.exports = RC522;