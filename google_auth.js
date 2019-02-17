"use strict";

class GoogleAuthentication {

    constructor(page, email, password) {
        this.page = page;
        this.email = email;
        this.password = password;
    }

    signin() {
        (async () => {
            // await this.page.screenshot({ path: 'google_auth.png' });
            // Waiting for email form elements
            await this.page.waitForSelector(`#Email`);
            await this.page.waitForSelector(`#next`);

            console.log(`Typing email ...`);

            // Typing email
            await this.page.type(`#Email`, this.email);

            // Going to the next page
            await this.page.click('#next');

            // Waiting for the transition to be finished
            await this.page.waitFor(2000);

            // Waiting for password form elements
            await this.page.waitForSelector(`#Passwd`);
            await this.page.waitForSelector('#signIn');

            console.log(`Typing password ...`);

            // Typing password
            await this.page.type(`#Passwd`, this.password);

            // Waiting for the password to be filled in
            await this.page.waitForSelector(`#Passwd`, { value: this.password });

            console.log(`Now clicking on button next`);

            // Validating our credentials
            await this.page.click('#signIn');

            // Waiting for the transition to be finished
            await this.page.waitForNavigation();
        })();
    }
}

module.exports = GoogleAuthentication;