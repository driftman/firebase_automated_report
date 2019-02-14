const puppeteer = require('puppeteer');

(async () => {
    // EMAIL
    const EMAIL_LOGIN = '[EMAIL]';
    // EMAIL PASSWORD
    const EMAIL_PASSWORD = '[PASSWORD]';
    // Project name
    const PROJECT_NAME = '[PROJECT_NAME]';

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
        const projects = await page.$$(`#firebase-projects > div > project-card > div > md-card > div.c5e-project-card-project-name`);

				console.log(projects.length);

				console.log(JSON.stringify(projects));

			  if (projects.count <= 0) {
						throw `There is no project linked to your account.`;
				}

				console.log(`You've got ${projects.count} projects linked to your account.`);

				console.log(`Trying to target the desired project [${PROJECT_NAME}]`);

				// console.log(projects[0].innerText);

        // await page.screenshot({
        //    path: 'google_auth.png'
        // });

        await browser.close();

    } catch (error) {
        console.error(error);
    }

})();
