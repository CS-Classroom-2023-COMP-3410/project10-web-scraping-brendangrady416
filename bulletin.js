const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const URL = 'https://bulletin.du.edu/undergraduate/majorsminorscoursedescriptions/traditionalbachelorsprogrammajorandminors/computerscience/#coursedescriptionstext';
const OUTPUT_FILE = path.join(__dirname, 'results/bulletin.json');

async function scrapeCourses() {
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);
        const courses = [];

        $('div.courseblock').each((_, element) => {
            const titleElement = $(element).find('p.courseblocktitle strong');
            const descElement = $(element).find('p.courseblockdesc');

            if (titleElement.length === 0) return;

            const fullTitle = titleElement.text().trim();
            const courseMatch = fullTitle.match(/(COMP\s*\d{4})\s*[:-]?\s*(.+?)\s*\((\d+(-\d+)?) Credits\)/);

            if (!courseMatch) return;

            const courseCode = courseMatch[1].replace(/\s+/g, '-');
            const courseTitle = courseMatch[2].trim();
            const description = descElement.text().trim().toLowerCase();
            const courseNumber = parseInt(courseCode.split('-')[1]);

            // Check if it's an upper-division course (3000 level or higher) and has no 'Prerequisite:'
            if (courseNumber >= 3000 && !description.includes('prerequisite')) {
                courses.push({ course: courseCode, title: courseTitle });
            }
        });

        // Ensure results directory exists
        fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
        
        // Write data to JSON file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ courses }, null, 4));
        console.log(`Scraped ${courses.length} courses and saved to ${OUTPUT_FILE}`);
    } catch (error) {
        console.error('Error scraping courses:', error);
    }
}

scrapeCourses();
