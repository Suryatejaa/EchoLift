const getFacebookFollowers = async (pageId, accessToken) => {
    const url = `https://graph.facebook.com/v12.0/${pageId}?fields=followers_count&access_token=${accessToken}`;

    try {
        const response = await axios.get(url);
        return response.data.followers_count;
    } catch (error) {
        console.error('Error fetching Facebook data:', error.message);
        return null;
    }
};