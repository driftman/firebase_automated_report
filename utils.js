"use strict";

class Utils {

    // A function responsible for gathering Google Auth related credentials
    getGoogleAuthCredentials() {
        let email, password = null;
        process.argv.forEach(function (val, index, array) {
            switch (index) {
                case 2:
                    email  = val;
                    break;
                case 3:
                    password = val;
                    break;
                default:
                    break;
            }
        });
        return [email, password];
    }

}

module.exports = Utils;