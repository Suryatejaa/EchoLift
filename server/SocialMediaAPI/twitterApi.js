const getTwitterFollowers = async (username, bearerToken) => {
    const url = `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics`;
    const headers = { Authorization: `Bearer ${bearerToken}` };

    try {
        const response = await axios.get(url, { headers });
        return response.data.data.public_metrics.followers_count;
    } catch (error) {
        console.error('Error fetching Twitter data:', error.message);
        return null;
    }
};