import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Connection": "keep-alive"
};

// ----------------------
//  /guild
// ----------------------
app.get("/guild", async (req, res) => {
    const guild = req.query.name || "Sleepers";
    const url = `https://www.tibia.com/community/?subtopic=guilds&page=view&GuildName=${encodeURIComponent(guild)}`;

    try {
        const response = await fetch(url, { headers: HEADERS });
        const html = await response.text();

        const regex = /\?subtopic=characters&amp;name=([^"]+)">([^<]+)<\/a>/g;
        const members = [];
        let match;

        while ((match = regex.exec(html)) !== null) {
            members.push({ name: match[2] });
        }

        res.json({
            guild,
            members
        });

    } catch (err) {
        res.json({ error: "Proxy error", details: err.toString() });
    }
});

// ----------------------
//  /debug
// ----------------------
app.get("/debug", async (req, res) => {
    const guild = req.query.name || "Sleepers";
    const url = `https://www.tibia.com/community/?subtopic=guilds&page=view&GuildName=${encodeURIComponent(guild)}`;

    try {
        const response = await fetch(url, { headers: HEADERS });
        const html = await response.text();

        res.send(html.slice(0, 1000)); // pokaż pierwsze 1000 znaków
    } catch (err) {
        res.send("Error: " + err.toString());
    }
});

app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});
