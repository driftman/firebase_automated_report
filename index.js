const google_automated_auth = require('./google_auth');
const puppeteer = require('puppeteer');

(async () => {

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
    const google_authentication = new google_automated_auth(page);

    google_authentication.signin();

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

    await page.waitForSelector(`#nav-stability-tree-content > fb-navbar-item:nth-child(1) > a`);

    await page.evaluate(() => {
        const crashlytics_menu_item = document.querySelector(`#nav-stability-tree-content > fb-navbar-item:nth-child(1) > a`);
        crashlytics_menu_item.click();
    });

    await page.waitForSelector(`#main > ng-transclude > fb-feature-bar > div > div > div.fb-featurebar-app-selector-container.fb-featurebar-space-consumer > div > fb-resource-selector > div > div > div.selected-resource > span`);

    await page.click(`#main > ng-transclude > fb-feature-bar > div > div > div.fb-featurebar-app-selector-container.fb-featurebar-space-consumer > div > fb-resource-selector > div > div > div.selected-resource > span`);

    await page.waitForSelector(`div > div > div > button.resource-selector-option > div > span`);

    await page.evaluate(() => {

        const available_applications = Array.from(document.querySelectorAll(`div > div > div > button.resource-selector-option > div > span`));

        // Available crashlytics ranges
        const SIXTY_MINUTES = 0;
        const TWENTY_FOUR_HOURS = 1;
        const SEVEN_DAYS = 2;
        const THIRTY_DAYS = 3;
        const NINETY_DAYS = 4;

        // Simulated default range
        const DEFAULT_RANGE = NINETY_DAYS;

        for(let [index, available_application] of available_applications) {
            console.log(`- ${index + 1}: ${available_application.innerText}`);
            available_application.click();
            // We are gathering all the possible ranges from the DOM
            const time_filters = Array.from(document.querySelectorAll(`md-menu-content > div.layout-align-stretch-stretch.layout-row > div.menu-presets > md-menu-item > button > div > span`));
            // Triggering an event click on the targeted range
            time_filters[DEFAULT_RANGE].click();
        }

    });

    // await page.waitForSelector(`#main > ng-transclude > div > div > div > c9s-issues > c9s-issues-index > div > div > div > c9s-issues-metrics > div > mat-card.top-issues-container.mat-card > div.metrics-card-title`);

    await page.screenshot({
        path: 'google_auth.png'
    });

    await browser.close();

})();
