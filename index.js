const google_automated_auth = require("./google_auth");
const puppeteer = require("puppeteer");
const program = require('commander');

(async () => {

    program.on('--help', function(){
        console.log('')
        console.log('Example:');
        console.log('  $ node index -e john@doe.com -p 123456');
    });

    program
    .version('1.0.0', '-v --version')
    .option('-e, --email [email]', 'email')
    .option('-p, --password [password]', 'password')
    .parse(process.argv);

    if (program.email == null || program.password == null) {
        console.error(`In order to correctly run the script you should provide your [email] and [password], type --help for more informations.`);
        return 0;
    }

    const email = program.email;
    const password = program.password;

    // All the informations were provided
    console.log('You runned the script with :');
    if (program.email) console.log(`Email: ${program.email}`);
    if (program.password) console.log(`Password: ${program.password}`);

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-popup-blocking'],
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 })

    // Accessing the firebase console 
    await page.goto('http://console.firebase.google.com/', {
        waitUntil: 'networkidle2'
    });

    // Using the google authentication module
    const google_authentication = new google_automated_auth(page, email, password);

    google_authentication.signin();

    await page.waitForSelector(`#firebase-projects > div:nth-child(3) > project-card:nth-child(2) > div > md-card > div.c5e-project-card-project-name`, {
        timeout: 60000
    });

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

    await page.waitForSelector(`#nav-stability-tree-content > fb-navbar-item:nth-child(1) > a`);

    await page.evaluate(() => {
        const crashlytics_menu_item = document.querySelector(`#nav-stability-tree-content > fb-navbar-item:nth-child(1) > a`);
        crashlytics_menu_item.click();
    });

    await page.waitForSelector(`#main > ng-transclude > fb-feature-bar > div > div > div.fb-featurebar-app-selector-container.fb-featurebar-space-consumer > div > fb-resource-selector > div > div > div.selected-resource > span`);

    await page.click(`#main > ng-transclude > fb-feature-bar > div > div > div.fb-featurebar-app-selector-container.fb-featurebar-space-consumer > div > fb-resource-selector > div > div > div.selected-resource > span`);

    await page.waitForSelector(`div > div > div > button.resource-selector-option > div > span`);

    const nb_available_applications = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(`div > div > div > button.resource-selector-option > div > span`)).length;
    });

    for (i = 1; i <= nb_available_applications; i++) {
        await page.waitForSelector(`div > div > div > button.resource-selector-option:nth-child(${i}) > div > span`);
        const application_name = await page.evaluate((i) => {
            return document.querySelector(`div > div > div > button.resource-selector-option:nth-child(${i}) > div > span`).innerText;
        }, i);
        await page.evaluate((i) => {
            document.querySelector(`div > div > div > button.resource-selector-option:nth-child(${i}) > div > span`).click()
        }, i);
        console.log(`Getting ${application_name}'s related data ...`);
        let app_not_in_zero_state = true;
        // Checking wether the app is in zero state
        try {
            await page.waitForSelector(`div > fire-stat.stat.crashes > div > div.value-wrapper.ng-star-inserted > span`);
        } catch (e) {
            app_not_in_zero_state = false;
        }
        if (app_not_in_zero_state) {
            // Now that the app isn't in zero state
            // We should wait for the panel responsible for showing the app crashes infos
            await page.waitFor(2000);
            const application_nb_crashes = await page.evaluate(() => {
                return document.querySelector(`div > fire-stat.stat.crashes > div > div.value-wrapper.ng-star-inserted > span`).innerText;
            });
            console.log(`[nb_crashes=${application_nb_crashes}]`);
        } else {
            console.log(`[nb_crashes=0]`)
        }
        await page.click(`#main > ng-transclude > fb-feature-bar > div > div > div.fb-featurebar-app-selector-container.fb-featurebar-space-consumer > div > fb-resource-selector > div > div > div.selected-resource > span`);
        await page.waitForSelector(`div > div > div > button.resource-selector-option > div > span`);
    }

    // await page.waitForSelector(`#main > ng-transclude > div > div > div > c9s-issues > c9s-issues-index > div > div > div > c9s-issues-metrics > div > mat-card.top-issues-container.mat-card > div.metrics-card-title`);

    await page.screenshot({ path: 'google_auth.png' });

    await browser.close();

})();
