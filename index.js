const puppeteer = require('puppeteer');

(async () => {
    // EMAIL
    const EMAIL_LOGIN = 'elbaz.soufiane92@gmail.com';
    // EMAIL PASSWORD
    const EMAIL_PASSWORD = 'azerty123@';

    try {

        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-popup-blocking'],
        });

        const page = await browser.newPage();

        await page.goto('http://console.firebase.google.com/', {
            waitUntil: 'networkidle2'
        });

        // Waiting for email form elements
        await page.waitForSelector(`#identifierId`);
        await page.waitForSelector(`#identifierNext`);

        // Typing email
        await page.type(`#identifierId`, EMAIL_LOGIN);

        // Going to the next page
        await page.click('#identifierNext');

        await page.waitFor(1500);

        // Waiting for password form elements
        await page.waitForSelector(`input[type="password"]`);

        console.log(`Typing password ...`);

        // Typing password
        await page.type(`input[type="password"]`, EMAIL_PASSWORD);

        console.log(`Password typed !`);

        console.log(`Now clicking on button next`);

        // Validating our credentials
        await page.click('#passwordNext');

        console.log(`Button next clicked !`);

        // Wait for the redirection to firebase to be done ;)
        await page.waitFor(2500);

        await page.waitForSelector(`#firebase-projects > div:nth-child(3) > project-card:nth-child(2) > div > md-card > div.c5e-project-card-project-name`, {
            timeout: 60000
        });

        await page.waitFor(2500);

        // Check if the chosen project name is available
        await page.evaluate(() => {
            // Project name
            const PROJECT_NAME = 'Atos-facteo';
            // We are trying to query all the available projects for the given account
            let project_cards = Array.from(document.querySelectorAll(`#firebase-projects > div > project-card > div > md-card > div.c5e-project-card-project-name`));
            console.log(`You've got (${project_cards.count}) projects linked to your account.`);
            // Now that we have all the available projects, we should search for our desired project
            project_cards = project_cards.filter(project_card => project_card.innerText === PROJECT_NAME);
            if (project_cards.length > 0) {
                project_cards[0].click()
            } else {
                throw `The given project name ${PROJECT_NAME} was not found, please verify that you provided the correct name and retry.`;
            }
        });

        // I will need it for sure ...
        // Array.from(document.querySelectorAll(`#menu_container_297 > md-menu-content > div.layout-align-stretch-stretch.layout-row > div.menu-presets > md-menu-item > button`))[4].click()

        await page.screenshot({
            path: 'google_auth.png'
        });

        await browser.close();

    } catch (error) {
        console.error(error);
    }

})();
