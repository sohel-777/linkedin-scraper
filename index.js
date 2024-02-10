const puppeteer = require("puppeteer");
const fs = require("fs");

const companies = require("./companiesList");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // headless: true for background scraping
  const page = await browser.newPage();

  const companiesData = [];

  //Logging in in LinkedIn
  await page.goto("https://www.linkedin.com/login");
  await page.type("#username", "sk43sohel@gmail.com");
  await page.type("#password", "sohel@2001");
  await page.click(".btn__primary--large");
  await page.waitForSelector(".feed-identity-module__actor-meta", {
    timeout: 10 * 60 * 1000,
  });

  for (const company of companies) {
    const companyName = company;
    let websiteLink = "";
    let linkedinPageUrl = "";

    //Searching for the company website on Google because LinkedIn does not allow scraping company website URLs for free members
    await page.goto(
      `https://www.google.com/search?q=${encodeURIComponent(
        company
      )} oficial website`
    );

    // Wait for the Search results
    await page.waitForSelector('a[jsname="UWckNb"]');

    // Extract href attribute of the anchor (a) element
    websiteLink = await page.$eval('a[jsname="UWckNb"]', (anchor) => {
      return anchor.getAttribute("href");
    });

    const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(
      company
    )}`;

    //searching for the company
    await page.goto(searchUrl);

    // Check if "No results found" element exists using page.evaluate
    const noResultsElement = await page.evaluate(() => {
      const noResults = document.querySelector(
        "h2.artdeco-empty-state__headline"
      );
      return noResults && noResults.innerText.trim() === "No results found";
    });

    if (noResultsElement) {
      linkedinPageUrl = `No company results found for ${company} on linkedin`;
      companiesData.push({
        companyName,
        websiteLink,
        linkedinPageUrl,
      });
      continue;
    }

    //waiting for results to load
    await page.waitForSelector(".reusable-search__entity-result-list");

    //clicking on first search results
    await page.click(".reusable-search__result-container");

    // // Wait for the element to be present and visible (if needed)
    // await page.waitForSelector(".t-black--light.text-body-medium-bold");
    await sleep(5000);
    linkedinPageUrl = await page.url();

    console.log("name", companyName);
    console.log("website", websiteLink);
    console.log("linkedinPageUrl", linkedinPageUrl);

    companiesData.push({
      companyName,
      websiteLink,
      linkedinPageUrl,
    });
  }

  await browser.close();

  // Write data to CSV
  // Convert data to CSV format
  const csvContent = companiesData
    .map(
      (company) =>
        `${company.companyName},${company.websiteLink},${company.linkedinPageUrl}`
    )
    .join("\n");

  // Write CSV content to a file
  fs.writeFileSync(
    "company details.csv",
    "Company Name,Website,LinkedIn\n" + csvContent,
    "utf8"
  );

  console.log("CSV file created successfully.");
})();
