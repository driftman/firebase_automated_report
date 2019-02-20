"use strict";

class GoogleAuthentication {

    constructor(page, email, password) {
        this.page = page;
        this.email = email;
        this.password = password;
    }

    async signin() {
        // #Email in headless chrome
        // const email_field_selector = `#identifierId`;
        const email_field_selector = `#Email`;
        // #next in headless chrome
        // const button_next_selector = '#identifierNext';
        const button_next_selector = `#next`;
        // #Passwd in headless chrome
        // const password_field_selector = `#password > div.aCsJod.oJeWuf > div > div.Xb9hP > input`;
        const password_field_selector = `#Passwd`;
        // #signIn in headless chrome
        // const signin_selector = `#passwordNext`;
        const signin_selector = `#signIn`;

        // Waiting for email form elements
        await this.page.waitForSelector(email_field_selector);
        await this.page.waitForSelector(button_next_selector);

        console.log(`Typing email ...`);

        // Typing email
        await this.page.type(email_field_selector, this.email);

        // Going to the next page
        await this.page.click(button_next_selector);

        await this.page.waitFor(2000);

        // Waiting for password form elements
        await this.page.waitForSelector(password_field_selector);
        await this.page.waitForSelector(signin_selector);

        console.log(`Typing password ...`);

        // Typing password
        await this.page.type(password_field_selector, this.password);

        // Waiting for the password to be filled in
        await this.page.waitForSelector(password_field_selector, { value: this.password });

        console.log(`Now clicking on button next`);

        // Validating our credentials
        await this.page.click(signin_selector);

        // Waiting for the transition to be finished
        await this.page.waitForNavigation();
    }
}

module.exports = GoogleAuthentication;
