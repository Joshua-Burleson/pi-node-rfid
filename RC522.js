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

    /**
     * Recieve and process result of card-read
     * @callback cardReadCallback
     */
    /**
     * RFID Read Mode.
     * Set RC522 to read-mode. Define callback and checking interval.
     * @param {cardReadCallback} callback
     * @param {number} interval - Interval frequency (in ms)
     */
    readMode = (callback, interval = 500) => setInterval( () => {
        //# reset card
        this.reset();

        //# Get the UID of the scanned card
        const response = this.getUid();

        if ( ! response.status ) {
            // Emit scan-read error
            callback("UID Scan Error");
            return;
        }

        const uid = response.data.reduce( (uidCode, char) => `${uidCode} ${char.toString(16)}`, '' );
        //Emit card UID to parent thread
        callback(`Card read UID: ${uid}`);

        //# Key for authentication
        const key = this.authKey;

        //# Authenticate on Block 8 with key and uid
        if ( ! this.authenticate(8, key, uid) ) {
            callback("Authentication Error");
            return;
        }

        /*
        const memCap = this.selectCard(uid);
        //callback(`Card Memory Capacity: ${memCap}`);
        */

        //# Stop
        this.stopCrypto();
        }, interval);

    writeCard = () => {
        this.reset();
    }
}

module.exports = RC522;