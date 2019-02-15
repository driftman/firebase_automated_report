"use strict";

const scrapping_utils = require('./utils');

class GoogleAuthentication {

    constructor(page) {
        this.page = page;
        this.utils = new scrapping_utils();
    }

    signin() {
        // Check if the user provided the Google Auth credentials
        let email, password;
        [email, password] = this.utils.getGoogleAuthCredentials();

        if (email == null || password == null) {
            throw `Please provide your Google Auth credentials \n For example : node index.js [YOUR EMAIL] [YOUR PASSWORD]`;
        }

        (async () => {
            // Waiting for email form elements
            await this.page.waitForSelector(`#identifierId`);
            await this.page.waitForSelector(`#identifierNext`);

            // Typing email
            await this.page.type(`#identifierId`, email);

            // Going to the next page
            await this.page.click('#identifierNext');

            await this.page.waitFor(1500);

            // Waiting for password form elements
            await this.page.waitForSelector(`input[type="password"]`);

            console.log(`Typing password ...`);

            // Typing password
            await this.page.type(`input[type="password"]`, password);

            console.log(`Password typed !`);

            console.log(`Now clicking on button next`);

            // Validating our credentials
            await this.page.click('#passwordNext');

            console.log(`Button next clicked !`);
        })();
    }
}

module.exports = GoogleAuthentication;