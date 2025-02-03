const axios = require('axios');

const getYouTubeSubscribers = async (username) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&forUsername=${username}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const subscriberCount = response.data.items[0].statistics.subscriberCount;
        return subscriberCount;
    } catch (error) {
        console.error('Error fetching YouTube data:', error.message);
        return null;
    }
};