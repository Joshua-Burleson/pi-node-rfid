const SoftSPI = require("rpi-softspi");

module.exports = {
    defaultSPI: new SoftSPI({
        clock: 23, // pin number of SCLK
        mosi: 19, // pin number of MOSI
        miso: 21, // pin number of MISO
        client: 24 // pin number of CS
      }),
    defaultAuthKey: [0xff, 0xff, 0xff, 0xff, 0xff, 0xff]
};