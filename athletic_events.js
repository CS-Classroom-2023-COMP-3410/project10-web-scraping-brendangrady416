const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const URL = 'https://denverpioneers.com/index.aspx';
const OUTPUT_FILE = path.join(__dirname, 'results/athletic_events.json');

async function scrapeAthletics() {
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);

        const scriptContent = $('section[aria-labelledby="h2_scoreboard"] script').html();
        const jsonString = scriptContent.match(/var obj = (\{.*\});/)[1];
        const eventData = JSON.parse(jsonString);

        const events = eventData.data.map(event => ({
            duTeam: event.sport?.title,  // DU Team Name
            opponent: event.opponent?.title,  // Opponent Team Name
            date: event.date  // Event Date
        }));

        fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
        
        // Write data to JSON file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ events }, null, 4));
        console.log(`Scraped ${events.length} events and saved to ${OUTPUT_FILE}`);
    } catch (error) {
        console.error('Error scraping athletics:', error);
    }
}

scrapeAthletics();
