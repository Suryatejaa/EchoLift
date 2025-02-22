const axios = require("axios");
const dotenv = require("dotenv");
const { any } = require("joi");

dotenv.config();

const clientId = process.env.FACEBOOK_ID;
const clientSecret = process.env.FACEBOOK_SECRET;
const redirectUri = "http://localhost:5000/auth/callback";

const exchangeCodeForToken = async (code) => {

    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;

    try {
        const response = await axios.get(tokenUrl);
        return response.data.access_token;
    } catch (error) {
        console.error("Error exchanging code for token:", error.response.data);
    }
};

const getFacebookPages = async (accessToken) => {
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
        );
        return response.data.data;
    } catch (error) {
        console.error("Error fetching pages:", error.response.data);
    }
};

const getFollowerCount = async (pageId, pageAccessToken) => {
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v18.0/${pageId}?fields=followers_count&access_token=${pageAccessToken}`
        );
        return response.data.followers_count;
    } catch (error) {
        console.error("Error fetching follower count:", error.response.data);
    }
};

const oAuthFb = async (req, res) => {
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?
    client_id=563634166657527
    &redirect_uri=https://www.calcie.site/auth/callback
    &scope=public_profile,email,pages_show_list
    &response_type=code`;
    res.redirect(authUrl);
};

const callback = async (req, res) => {
    const { code } = req.query;

    try {
        const tokenResponse = await axios.get(
            `https://graph.facebook.com/v18.0/oauth/access_token`,
            {
                params: {
                    client_id: clientId,
                    redirect_uri: redirectUri,
                    client_secret: clientSecret,
                    code: code,
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;
        const userResponse = await axios.get(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
        const pages = await getFacebookPages(accessToken);
        const followerCountPromises = pages.map((page) => getFollowerCount(page.id, page.access_token));
        console.log('User Data:', userResponse.data);
        res.send(`Access Token: ${accessToken},
            User Data: ${JSON.stringify(userResponse.data, null, 2)},
             Pages: ${JSON.stringify(pages, null, 2)}
             followerCounts: ${await Promise.all(followerCountPromises)}
             `);
    } catch (error) {
        console.error("Error getting access token:", error.response.data);
        res.status(500).send("Authentication failed");
    }
};


module.exports = { exchangeCodeForToken, getFacebookPages, getFollowerCount, oAuthFb, callback };

