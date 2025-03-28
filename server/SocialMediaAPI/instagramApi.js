const axios = require("axios");
const dotenv = require("dotenv");
const qs = require("qs");

dotenv.config();


const getInstagramFollowers = async (instagramAccountId, accessToken) => {
    try {
        const response = await axios.get(`https://graph.instagram.com/v18.0/${instagramAccountId}?fields=username,profile_picture_url,media_count,followers_count&access_token=${accessToken}`);
        return response.data;

    } catch (error) {
        console.error("Error fetching Instagram follower count:", error.response?.data || error.message);
    }
};

const getInsights = async (instagramAccountId, accessToken) => {
    try {
        const response = await axios.get(`https://graph.instagram.com/v18.0/${instagramAccountId}?metric=reach,impressions,engagement&period=day&access_token=${accessToken}`);
        return response.data;

    } catch (error) {
        console.error("Error fetching Instagram follower count:", error.response?.data || error.message);
    }
};



const VERIFY_TOKEN = 'instagraphecholift';

const callback = async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified!');
        res.status(200).send(challenge); // Respond with the challenge
    } else {
        console.error('Webhook verification failed.');
        res.sendStatus(403); // Respond with 403 Forbidden
    }

};

const callback_app1 = async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified!');
        res.status(200).send(challenge); // Respond with the challenge
    } else {
        console.error('Webhook verification failed.');
        res.sendStatus(403); // Respond with 403 Forbidden
    }

};

const CLIENT_ID = process.env.INSTA_CLIENT_ID;
const CLIENT_SECRET = process.env.INSTA_CLIENT_SECRET;

const REDIRECT_URI = "https://echolift-production.up.railway.app/auth/redirect";

const redirect = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: "Authorization code not provided" });
    }

    try {
        
        // Exchange the authorization code for an access token
        const tokenResponse = await axios.post(
            "https://api.instagram.com/oauth/access_token",
            qs.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "authorization_code",
                redirect_uri: REDIRECT_URI,
                code: code,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token: shortLivedToken, user_id } = tokenResponse.data;
        console.log("Short-Lived Token:", shortLivedToken);

        // Step 2: Exchange the short-lived token for a long-lived token
        const longLivedTokenResponse = await axios.get(
            "https://graph.instagram.com/access_token",
            {
                params: {
                    grant_type: "ig_exchange_token",
                    client_secret: CLIENT_SECRET,
                    access_token: shortLivedToken,
                },
            }
        );

        const { access_token: longLivedToken, expires_in } = longLivedTokenResponse.data;
        console.log("Long-Lived Token:", longLivedToken);

        const expiresInDays = Math.round((expires_in / 3600) / 24);;
        console.log("Expires In:", expiresInDays, "days");

        const { followers_count, profile_picture_url, username, media_count: NoOfPosts } = await getInstagramFollowers(user_id, longLivedToken);
        console.log(await getInstagramFollowers(user_id, longLivedToken));


        // Redirect or send response to client
        return res.json({ user_id, followers_count, username, NoOfPosts, profile_picture_url });

    } catch (error) {
        console.error("Error exchanging code for access token:", error.response?.data || error.message);
        return res.status(500).json({ error: "Failed to get access token" });
    }
};


const CLIENT_ID_APP1 = process.env.INSTA_CLIENT_ID_APP1;
const CLIENT_SECRET_APP1 = process.env.INSTA_CLIENT_SECRET_APP1;

const REDIRECT_URI_APP1 = "https://echolift-production.up.railway.app/auth/redirectapp";


const redirect_app1 = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: "Authorization code not provided" });
    }


    try {
        // Exchange the authorization code for an access token
        const tokenResponse = await axios.post(
            "https://api.instagram.com/oauth/access_token",
            qs.stringify({
                client_id: CLIENT_ID_APP1,
                client_secret: CLIENT_SECRET_APP1,
                grant_type: "authorization_code",
                redirect_uri: REDIRECT_URI_APP1,
                code: code,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token: shortLivedToken, user_id } = tokenResponse.data;
        console.log("Short-Lived Token:", shortLivedToken);

        // Step 2: Exchange the short-lived token for a long-lived token
        const longLivedTokenResponse = await axios.get(
            "https://graph.instagram.com/access_token",
            {
                params: {
                    grant_type: "ig_exchange_token",
                    client_secret: CLIENT_SECRET_APP1,
                    access_token: shortLivedToken,
                },
            }
        );

        const { access_token: longLivedToken, expires_in } = longLivedTokenResponse.data;
        console.log("Long-Lived Token:", longLivedToken);

        const expiresInDays = Math.round((expires_in / 3600) / 24);;
        console.log("Expires In:", expiresInDays, "days");

        const { followers_count, profile_picture_url, username, media_count: NoOfPosts } = await getInstagramFollowers(user_id, longLivedToken);
        console.log(await getInstagramFollowers(user_id, longLivedToken));


        // Redirect or send response to client
        return res.json({ user_id, followers_count, username, NoOfPosts, profile_picture_url });

    } catch (error) {
        console.error("Error exchanging code for access token:", error.response?.data || error.message);
        return res.status(500).json({ error: "Failed to get access token" });
    }
};


module.exports = {
    getInstagramFollowers,
    callback,
    redirect,
    callback_app1,
    redirect_app1
};
