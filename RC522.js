const Mfrc522 = require("mfrc522-rpi");
const { defaultAuthKey, defaultSPI } = require('./lib/defaults');


class RC522 extends Mfrc522 {

   constructor( {authKey = defaultAuthKey, authBlock= 10, spiSettings = defaultSPI, resetPin = 22, buzzerPin = 18} = {} ){
         super(spiSettings);
        //  Constant
         this.authKey = authKey;
         this.authBlock = authBlock;
         this.setResetPin(resetPin);
         this.setBuzzerPin(buzzerPin);
        //  Stateful
         this.activeOperation = null;
         this.interruptable = {
             operation: null,
             callback: null,
             interval: null
         };
         this.faultCount = 0;
    }

    // Read Modes
    readMode = callback =>  {
        const cardData = {
            uid: null,
            auth: true,
            bitSize: 0,
            memory_capacity: null,
            read_error: false,
            raw: {
                uid_data: null
            }
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
            // Set "raw" cardData
            cardData.raw.uid_data = response.data;
            
            this.stopCrypto();
            callback(cardData);
            this.faultCount = 0;
        } catch ( err ){
            this.reset();
            ++ this.faultCount;
            callback({
                ...cardData,
                read_error: true,
                message: err,
                concurrent_fault_count: this.faultCount
            });
            console.error('An unhandled error has occured in read mode. Restarting read process at default interval of 500ms.');
            this.runReadMode(callback);
        }
    }

    // Write modes
    writeAuthenticationKey( newKey, callback, address = this.authBlock ){
        const result = {
            newKey: null,
            write_error: true,
            message: null
        };
        try {
            this.reset();
            // Validation
            if ( !(address && newKey) ) {
                return callback({...result, write_error: true, message: 'Ensure address-block and new key are defined'});
            }
            if (address % 4 !== 3) {
                const offset = 3 - (address % 4);
                return callback({
                    ...result,
                    write_error: true,
                    message: `Error: Chosen block is not a sector trailer! Please write authentication key to block ${address + offset}`
                    });
            }
            if (newKey.length !== 6) {
                return callback({
                    ...result,
                    write_error: true,
                    message: `Error: Key length must be 6`
                });
            }
            // Write new key
            const newData = newKey.concat(this.getDataForBlock(address).slice(6));
            callback( this.writeDataToBlock(address, newData) );
            return this.interruptable ? this.#init( ...Object.values(this.interruptable) ) : newKey;
        } catch (err) {
            console.error(err);
            callback( {...result, write_error: true, message: err} );
        }
    }

    // Middleware
    faultCheck = (next, nextArgs = []) => {
        if( this.faultCount < 100){
            return next(...nextArgs);
        }else{
            console.log( `Fault Limit ( ${this.faultCount} ) reached. Killing the current RC522 process.` );
            this.#kill();
            return new Error(`Fault Limit ( ${this.faultCount} ) reached. Killing the current RC522 process.`);
        }
    }

    // User-Friendlier Methods
    runReadMode = (callback, interval = 500) => this.#init(this.readMode, interval, callback);


    // Object Utility Methods
    reset = () => {
        super.reset();
        this.faultCheck( clearInterval, [ this.activeOperation ] );
        this.activeOperation = null;
    }
    #init = (operation, interval, callback) => {
        this.reset();
        this.interruptable = { operation, callback, interval };
        this.activeOperation = setInterval(operation, interval, callback);
    }
    #kill = () => {
        this.reset();
        this.interruptable = null;
        this.antennaOff();
        console.log('RFID Processes Killed');
    }

}

module.exports = RC522;
