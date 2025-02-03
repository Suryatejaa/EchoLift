const puppeteer = require('puppeteer');

const getInstagramFollowers = async (username) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.instagram.com/${username}/`);

    const followerCount = await page.evaluate(() => {
        const metaTags = document.querySelectorAll('meta');
        for (let tag of metaTags) {
            if (tag.getAttribute('property') === 'og:description') {
                const content = tag.getAttribute('content');
                const match = content.match(/([\d,]+) followers/);
                return match ? match[1].replace(/,/g, '') : null;
            }
        }
        return null;
    });

    await browser.close();
    return followerCount;
};