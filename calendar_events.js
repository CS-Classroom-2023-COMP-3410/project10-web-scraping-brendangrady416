const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = "https://www.du.edu";
const CALENDAR_URL = `${BASE_URL}/calendar?search=&start_date=2025-01-01&end_date=2025-12-31#events-listing-date-filter-anchor`;
const RESULTS_FILE = path.join(__dirname, "results/calendar_events.json");

async function fetchPage(url) {
    try {
        const { data } = await axios.get(url);
        return cheerio.load(data);
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
    }
}

async function getEventDescription(eventUrl) {
    const $ = await fetchPage(eventUrl);
    if (!$) return undefined;
    console.log(`Scraping ${eventUrl}`);
    
    const description = $('.description').text().trim().replace(/\s+/g, ' ');
    return description || undefined;
}

async function scrapeEvents() {
    console.log("Fetching events page...");
    const $ = await fetchPage(CALENDAR_URL);
    if (!$) return;

    const events = [];
    
    const eventElements = $('.events-listing__item');
    console.log(`Found ${eventElements.length} events.`);

    for (let i = 0; i < eventElements.length; i++) {
        const eventElement = eventElements.eq(i);
        const title = eventElement.find('h3').text().trim();
        const date = eventElement.find('p').first().text().trim();
        const time = eventElement.find('.icon-du-clock').parent().text().trim().replace(/\s+/g, ' ') || undefined;
        const eventUrl = eventElement.find('a.event-card').attr('href');
        const fullEventUrl = eventUrl.startsWith('http') ? eventUrl : `${BASE_URL}${eventUrl}`;
        
        const description = await getEventDescription(fullEventUrl);

        events.push({
            title,
            date,
            ...(time ? { time } : {}),
            ...(description ? { description } : {})
        });
    }

    saveResults({ events });
    console.log(`Saved ${events.length} results to ${RESULTS_FILE}`);
}

function saveResults(data) {
    fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2));
}

scrapeEvents();
