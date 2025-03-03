const { google } = require("googleapis");
const express = require("express");
const app = express();
const dotenv = require('dotenv');

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "https://echolift-production.up.railway.app/auth/youtube/callback";

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);


const youtube = (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/youtube.readonly"],
    });
    res.redirect(authUrl);
};

const callback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: "Authorization code not provided" });
    }

    try {
        // Exchange the authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch the YouTube channel data
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });
        const response = await youtube.channels.list({
            part: "snippet,statistics",
            mine: true,
        });

        const channel = response.data.items[0];
        const channelId = channel.id;
        const channelName = channel.snippet.title;
        const subscriberCount = channel.statistics.subscriberCount;
        const customUrl = channel.snippet.customUrl;

        // Store the tokens securely (in a database or session)
        console.log("Channel Id:", channelId);
        console.log("Channel Name:", channelName);
        console.log("Channel URL:", customUrl);
        console.log("Subscriber Count:", subscriberCount);

        // Redirect or send response to client
        return res.json({ channelId, channelName, customUrl, subscriberCount });

    } catch (error) {
        console.error("Error exchanging code for access token:", error.message);
        return res.status(500).json({ error: "Failed to get access token" });
    }
};

module.exports = {
    youtube,
    callback
};