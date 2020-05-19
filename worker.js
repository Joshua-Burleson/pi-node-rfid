const Mfrc522 = require("./RC522");
const { parentPort, MessagePort } = require('worker_threads');

const mfrc522 = new Mfrc522();

parentPort.on('message', message => {

    switch( message.mode ) {
        case 'read': mfrc522.readMode( message.port.postMessage );
                     break;
        
        case 'write': console.log('Write mode will go here');
                      break;

        case 'write_auth_key': console.log('Auth Key write mode will go here');
                               break;

        case 'dump': console.log('Dump mode will go here');
                     break;
        
        default: console.log(`Invalid Mode selected: ${ message.mode }`);
    }

});


