"use strict";

class GoogleAuthentication {

    constructor(page, email, password) {
        this.page = page;
        this.email = email;
        this.password = password;
    }

    signin() {
        (async () => {
            // Waiting for email form elements
            await this.page.waitForSelector(`#identifierId`);
            await this.page.waitForSelector(`#identifierNext`);

            console.log(`Typing email ...`);

            // Typing email
            await this.page.type(`#identifierId`, this.email);

            // Going to the next page
            await this.page.click('#identifierNext');

            // Waiting for the transition to be finished
            await this.page.waitFor(2000);

            // Waiting for password form elements
            await this.page.waitForSelector(`#password > div > div > div > input`);
            await this.page.waitForSelector('#passwordNext');

            console.log(`Typing password ...`);

            // Typing password
            await this.page.type(`#password > div > div > div > input`, this.password);

            // Waiting for the password to be filled in
            await this.page.waitForSelector(`#password > div > div > div > input`, { value: this.password });

            console.log(`Now clicking on button next`);

            // Validating our credentials
            await this.page.click('#passwordNext');

            // Waiting for the transition to be finished
            await this.page.waitForNavigation();
        })();
    }
}

module.exports = GoogleAuthentication;