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
        const members = await fetchFromTibiaData(guild);

        if (members && members.length > 0) {
            return res.json({ guild, members });
        }

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
//  /guild/online endpoint
// ----------------------
app.get("/guild/online", async (req, res) => {
    const guild = req.query.name || "Sleepers";

    try {
        // 1. Pobierz dane gildii
        const guildUrl = `https://api.tibiadata.com/v4/guild/${encodeURIComponent(guild)}`;
        const guildRes = await fetch(guildUrl);
        const guildData = await guildRes.json();

        if (!guildData.guild || !guildData.guild.members) {
            return res.json({ error: "Guild not found" });
        }

        const members = guildData.guild.members.map(m => m.name);

        // 2. Pobierz listę online ze świata gildii
        const world = guildData.guild.world;
        const onlineUrl = `https://api.tibiadata.com/v4/world/${encodeURIComponent(world)}`;
        const onlineRes = await fetch(onlineUrl);
        const onlineData = await onlineRes.json();

        const onlinePlayers = onlineData.world.online_players.map(p => p.name);

        // 3. Filtruj tylko tych, którzy są w gildii
        const onlineGuildMembers = members.filter(name => onlinePlayers.includes(name));

        res.json({
            guild,
            world,
            online: onlineGuildMembers
        });

    } catch (err) {
        res.json({ error: "Proxy error", details: err.toString() });
    }
});

// ----------------------
//  Start server
// ----------------------
app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});
