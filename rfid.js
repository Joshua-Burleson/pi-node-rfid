const { Worker, isMainThread, MessageChannel } = require('worker_threads');

if( isMainThread ){
    const rfidListener = new Worker(`${__dirname}/worker.js`);
    const subchannel = new MessageChannel();
    subchannel.port2.on('message', console.log(message) );
    rfidListener.postMessage({ port: subchannel.port1, mode: 'read' }, [ subchannel.port1 ]);
}