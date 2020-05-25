const Mfrc522 = require("mfrc522-rpi");
const SoftSPI = require("rpi-softspi");

const defaultSPI = new SoftSPI({
    clock: 23, // pin number of SCLK
    mosi: 19, // pin number of MOSI
    miso: 21, // pin number of MISO
    client: 24 // pin number of CS
  });

// Most common default authkey
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
                bitSize: 0,
                memory_capacity: null,
                read_error: false
            };
            try {
                const scan = this.findCard();
                if (!scan.status) {
                    return;
                }

                const response = this.getUid();
                if (!response.status) {
                    cardData.read_error = true;
                    return callback(cardData);
                }
                
                // Set cardData values
                cardData.bitSize = scan.bitSize;
                cardData.uid = response.data.reduce( (uidCode, char, index) => `${uidCode.concat(char.toString(16))}${index === response.data.length - 1 ? '' : ' '}`, '' );
                cardData.memory_capacity = this.selectCard(response.data);
                cardData.auth = this.authenticate(8, this.authKey, response.data);

            } catch ( err ){
                callback({
                    ...cardData,
                    read_error: true,
                    error_message: err
                });
            }

            this.stopCrypto();
            callback(cardData);
            }

    reset = () => {
        super.reset();
        clearInterval(this.activeOperation);
        this.activeOperation = null;
    }

    runReadMode = (callback, interval = 500) => this.#init(this.readMode, interval, callback);

    #init = (operation, interval, callback) => {
        this.reset();
        this.activeOperation = setInterval(operation, interval, callback);
    }

}

module.exports = RC522;