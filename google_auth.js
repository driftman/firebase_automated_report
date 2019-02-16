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

            console.log(`Typing email ...`);

            // Typing email
            await this.page.type(`#identifierId`, email);

            // Going to the next page
            await this.page.click('#identifierNext');

            // Waiting for the transition to be finished
            await this.page.waitFor(2000);

            // Waiting for password form elements
            await this.page.waitForSelector(`#password > div > div > div > input`);
            await this.page.waitForSelector('#passwordNext');

            console.log(`Typing password ...`);

            // Typing password
            await this.page.type(`#password > div > div > div > input`, password);

            // Waiting for the password to be filled in
            await this.page.waitForSelector(`#password > div > div > div > input`, { value: password });

            console.log(`Now clicking on button next`);

            // Validating our credentials
            await this.page.click('#passwordNext');

            // Waiting for the transition to be finished
            await this.page.waitForNavigation();
        })();
    }
}

module.exports = GoogleAuthentication;