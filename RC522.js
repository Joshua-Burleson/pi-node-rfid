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
            const cardData = {
                uid: null,
                auth: true,
                memory_capacity: null,
                read_error: false
            };
            const scan = this.findCard();
            if (!scan.status) {
                return;
            }
            //console.log("Card detected, CardType: " + response.bitSize);
    
            //# Get the UID of the card
            const response = this.getUid();
            if (!response.status) {
                cardData.read_error = true;
                return callback(cardData);
            }
            //# If we have the UID, continue
            console.log(response.data);
            const uid = response.data.reduce( (uidCode, char) => `${uidCode} ${char.toString(16)}`, '' );
            cardData.uid = uid;
    
            //# Authenticate on Block 8 with key and uid
            if (!this.authenticate(8, this.authKey, uid)) {
                cardData.auth = false;
            }

            this.stopCrypto();
            callback(cardData);
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

}

module.exports = RC522;