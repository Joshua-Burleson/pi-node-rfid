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
         this.activeOperation = null;
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
    readMode = (callback, interval = 500) => this.init( () => {

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

    writeMode = (callback, interval) => this.#init(() => {
        console.log(callback);
    }, interval)

    reset = () => {
        super.reset();
        clearInterval(this.activeOperation);
        this.activeOperation = null;
    }

    /**
     * Operation mode callback
     * @callback RC522Callback
     */
    /**
     * Initialize RC522 with interval and mode (via callback)).
     * Set RC522 to read-mode. Define callback and checking interval.
     * @param {RC522Callback} callback
     * @param {number} interval - Interval frequency (in ms)
     */
    init = ( cb, interval ) => {
        this.reset();
        this.activeOperation = setInterval(cb, interval);
    }
}

module.exports = RC522;