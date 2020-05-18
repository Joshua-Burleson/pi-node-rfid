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
    }


    readMode = ( mainThread ) => setInterval( () => {
        //# reset card
        this.reset();

        //# Get the UID of the scanned card
        const response = this.getUid();

        if ( !response.status ) {
            // Emit scan-read error
            mainThread.port.postMessage("UID Scan Error");
            return;
        }

        const uid = response.data.reduce( (uidCode, char) => `${uidCode} ${char.toString(16)}`, '' );
        //Emit card UID to parent thread
        mainThread.port.postMessage(`Card read UID: ${uid}`);

        //# Key for authentication
        const key = this.authKey;

        //# Authenticate on Block 8 with key and uid
        if (!this.authenticate(8, key, uid)) {
            mainThread.port.postMessage("Authentication Error");
            return;
        }

        /*
        const memCap = this.selectCard(uid);
        //mainThread.port.postMessage(`Card Memory Capacity: ${memCap}`);
        */

        //# Stop
        this.stopCrypto();
        }, 500);


}

module.exports = RC522;