import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------
//  1. TibiaData API
// ----------------------
async function fetchFromTibiaData(guild) {
    const url = `https://api.tibiadata.com/v4/guild/${encodeURIComponent(guild)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.guild || !data.guild.members) return null;

    return data.guild.members.map(m => ({
        name: m.name,
        rank: m.rank,
        level: m.level,
        vocation: m.vocation,
        joined: m.joined
    }));
}

// ----------------------
//  /guild endpoint
// ----------------------
app.get("/guild", async (req, res) => {
    const guild = req.query.name || "Sleepers";

    try {
        // 1. Spróbuj TibiaData (bez Cloudflare)
        const members = await fetchFromTibiaData(guild);

        if (members && members.length > 0) {
            return res.json({ guild, members });
        }

        // 2. Jeśli API nie działa → fallback
        return res.json({
            guild,
            members: [],
            warning: "Tibia.com blocked the request (Cloudflare). TibiaData fallback returned no members."
        });

    } catch (err) {
        res.json({ error: "Proxy error", details: err.toString() });
    }
});

// ----------------------
app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});
