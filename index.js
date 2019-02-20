"use strict";

const google_automated_auth = require("./google_auth");
const puppeteer = require("puppeteer");
const program = require("commander");
const nodemailer = require("nodemailer");

(async () => {

    const launch_time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') ;

    program.on('--help', function(){
        console.log('')
        console.log('Example:');
        console.log('  $ node index --email john@company.com --password 123456 --project MY-PROJECT --recipients jane@company.com, jack@company.com');
    });

    program
    .version('1.0.0', '-v --version')
    .option('-email, --email [email]', 'email')
    .option('-password, --password [password]', 'password')
    .option('-project, --project [project]', 'project')
    .option('-recipients, --recipients [recipients]', 'recipients')
    .parse(process.argv);

    if (program.email == null || program.password == null ||
      program.project == null || program.recipients == null) {
        console.error(`In order to correctly run the script you should provide your [email], [password], [project] and [recipients], type --help for more informations.`);
        return 0;
    }

    const email = program.email;
    const password = program.password;

    // All the informations were provided
    console.log('You runned the script with :');
    console.log(`Email: ${program.email}`);
    console.log(`Password: ${program.password}`);
    console.log(`Project name: ${program.project}`);

    // We launch our browser with the headless option which means no GUI as our script is a CLI one
    const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true
    });

    // Initiating our google email client
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
               user: program.email,
               pass: program.password
           }
    });

    // Getting the page with which we will work on, a page means a tab
    // You can use as many as you want
    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 })

    // Accessing the firebase console
    await page.goto('http://console.firebase.google.com/', {
        waitUntil: 'networkidle2'
    });

    // Using the google authentication module
    const google_authentication = new google_automated_auth(page, email, password);

    // We should authenticate in order to access to our firebase console
    await google_authentication.signin();

    // Waiting for the firebase console to show up
    await page.waitForSelector(`#firebase-projects > div:nth-child(3) > project-card:nth-child(2) > div > md-card > div.c5e-project-card-project-name`, { timeout: 60000 });

    // Check if the chosen project name is available
    await page.evaluate((program) => {
        // We are trying to query all the available projects for the given account
        let project_cards = Array.from(document.querySelectorAll(`#firebase-projects > div > project-card > div > md-card > div.c5e-project-card-project-name`));
        console.log(`You've got (${project_cards.count}) projects linked to your account.`);
        // Now that we have all the available projects, we should search for our desired project
        project_cards = project_cards.filter(project_card => project_card.innerText === program.project);
        if (project_cards.length > 0) {
            project_cards[0].click()
        } else {
            throw `The given project name ${program.project} was not found, please verify that you provided the correct name and retry.`;
        }
    }, program);

    // Waiting for crashlytics menu button to show up
    await page.waitForSelector(`#nav-stability-tree-content > fb-navbar-item:nth-child(1) > a`);

    // Now that it showed up we click on it
    await page.evaluate(() => {
        const crashlytics_menu_item = document.querySelector(`#nav-stability-tree-content > fb-navbar-item:nth-child(1) > a`);
        crashlytics_menu_item.click();
    });

    // Waiting for the crashlytics view to show up and when it is done we show the list of the available applications
    // from which we'll gather informations
    await page.waitForSelector(`#main > ng-transclude > fb-feature-bar > div > div > div.fb-featurebar-app-selector-container.fb-featurebar-space-consumer > div > fb-resource-selector > div > div > div.selected-resource > span`);
    await page.click(`#main > ng-transclude > fb-feature-bar > div > div > div.fb-featurebar-app-selector-container.fb-featurebar-space-consumer > div > fb-resource-selector > div > div > div.selected-resource > span`);
    await page.waitForSelector(`div > div > div > button.resource-selector-option > div > span`);

    // Getting the nb of the available applications
    const nb_available_applications = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(`div > div > div > button.resource-selector-option > div > span`)).length;
    });

    let crash_reports = [];
    // Now we'll loop over all the available applications to gather crash informations from them
    for (let i = 1; i <= nb_available_applications; i++) {
        await page.waitForSelector(`div > div > div > button.resource-selector-option:nth-child(${i}) > div > span`);
        const application_name = await page.evaluate((i) => {
            return document.querySelector(`div > div > div > button.resource-selector-option:nth-child(${i}) > div > span`).innerText;
        }, i);
        await page.evaluate((i) => {
            document.querySelector(`div > div > div > button.resource-selector-option:nth-child(${i}) > div > span`).click()
        }, i);
        console.log(`Getting ${application_name}'s related data ...`);
        let app_not_in_zero_state = await statsShown();
        let crash_report = null;
        if (app_not_in_zero_state) {
            crash_report = await getStatsInfos(application_name);
            console.log(JSON.stringify(crash_report));
        } else {
            crash_report = {
                "application_name": application_name,
                "nb_crashes": 0,
                "users_affected": 0
            };
        }
        // We add the crash report to the crash report list
        crash_reports.push(crash_report)
        // We should mark a delay before continuing, because Firebase may detect the bot and block the request
        await page.waitFor(2000);
        await page.waitForSelector(`#main > ng-transclude > fb-feature-bar > div > div > div.fb-featurebar-app-selector-container.fb-featurebar-space-consumer > div > fb-resource-selector > div > div > div.selected-resource > span`);
        await page.click(`#main > ng-transclude > fb-feature-bar > div > div > div.fb-featurebar-app-selector-container.fb-featurebar-space-consumer > div > fb-resource-selector > div > div > div.selected-resource > span`);
        await page.waitForSelector(`div > div > div > button.resource-selector-option > div > span`);
    }

    // Now that our crash report list is filled we should create a mail body from it
    const mail_body = createMailBody(crash_reports);

    console.log(`The body to be sent : ${mail_body}`);

    const mailOptions = {
        from: program.from,
        to: program.recipients,
        subject: `[${program.project}][${launch_time}] - Rapport crashlytics.`,
        html: mail_body
    };

    transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.error(err);
        else
          console.log(info);
     });

    /*
     * Returns an html body from a given crash_report list
     */
    function createMailBody(crash_reports) {
        let html_body_table_header = `<tr> <th>Application</th> <th>Nombre de crashes</th> <th>Utilisateurs affectés</th> </tr>`;
        let html_body_table_crash_report_rows = [];
        for (let crash_report of crash_reports) {
            html_body_table_crash_report_rows.push(getHtmlTableRowFromCrashReport(crash_report));
        }
        html_body_table_crash_report_rows = html_body_table_crash_report_rows.join("\n");
        return `
        <html>
            <head>
                <style>
                    body {
                        background-color: #ECECEC;
                        font-family: Roboto,Verdana,sans-serif;
                        font-size: 12px;
                        width: 500px;
                    }
                    header {
                        height: 100px;
                        width: 100%;
                        background-image: url('https://images.unsplash.com/photo-1473500532252-27335de9ee58?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=720&q=40');
                        background-position: center center;
                        background-size: cover;
                        padding: 35px 0px;
                    }
                    table {
                        width: 100%;
                    }
                    th, tr {
                        border-bottom: 1px solid #000;
                        text-align: center;
                    }
                    th {
                        background-color: #ffc928;
                        color: #000;
                    }
                    #application {
                        text-align: left;
                    }
                </style>
            </head>
            <body>
                <header></header>
                <table>
                    ${html_body_table_header}
                    ${html_body_table_crash_report_rows}
                </table>
            </body>
        </html>`;
    }

    /*
     * Returns an HTML table row from a given crash report
     */
    function getHtmlTableRowFromCrashReport(crash_report) {
        return `<tr> <td>${crash_report.application_name}</td> <td>${crash_report.nb_crashes}</td> <td>${crash_report.users_affected}</td> </tr>`;
    }

    /*
     * Returns a report object for a given application
     */
    async function getStatsInfos(application_name) {
        let nb_crashes = "...";
        let users_affected = "...";
        // Now that the app isn't in zero state
        // We should wait for the panel responsible for showing the app crashes infos
        while (!validStats(nb_crashes) || !validStats(users_affected)) {
            nb_crashes = await page.evaluate(() => {
                return document.querySelector(`div > fire-stat.stat.crashes > div > div.value-wrapper.ng-star-inserted > span`).innerText;
            });
            users_affected = await page.evaluate(() => {
                return document.querySelector(`div > fire-stat.stat.secondary > div > div.value-wrapper.ng-star-inserted > span`).innerText;
            });
        }
        return {
            "application_name": application_name,
            "nb_crashes": nb_crashes,
            "users_affected": users_affected
        };
    }

    /*
     * Returns true if the firebase crash reports are shown
     */
    async function statsShown() {
        // Checking whether the app is in zero state
        try {
            await page.waitForSelector(`div > fire-stat.stat.crashes > div > div.value-wrapper.ng-star-inserted > span`);
            await page.waitForSelector(`div > fire-stat.stat.secondary > div > div.value-wrapper.ng-star-inserted > span`);
        } catch (e) {
            return false;
        }
        return true;
    }

    /*
     * Returns true if the stat value is valid
     */
    function validStats(value) {
        return value !== "..." && value !== null;
    }

    await browser.close();
})();
