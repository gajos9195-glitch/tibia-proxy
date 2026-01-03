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
//  /guild/online (wersja PRO)
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

        const world = guildData.guild.world;

        // Mapa członków: name → pełne dane
        const guildMembers = {};
        guildData.guild.members.forEach(m => {
            guildMembers[m.name] = {
                name: m.name,
                level: m.level,
                vocation: m.vocation,
                rank: m.rank,
                joined: m.joined
            };
        });

        // 2. Pobierz listę online ze świata
        const onlineUrl = `https://api.tibiadata.com/v4/world/${encodeURIComponent(world)}`;
        const onlineRes = await fetch(onlineUrl);
        const onlineData = await onlineRes.json();

        const onlinePlayers = onlineData.world.online_players.map(p => p.name);

        // 3. Filtruj tylko członków gildii
        let onlineGuildMembers = onlinePlayers
            .filter(name => guildMembers[name])
            .map(name => guildMembers[name]);

        // 4. Sortowanie po levelu malejąco
        onlineGuildMembers.sort((a, b) => b.level - a.level);

        // 5. Podział na vocation
        const byVocation = {
            "Elder Druid": [],
            "Master Sorcerer": [],
            "Royal Paladin": [],
            "Elite Knight": [],
            "Other": []
        };

        onlineGuildMembers.forEach(m => {
            if (byVocation[m.vocation]) {
                byVocation[m.vocation].push(m);
            } else {
                byVocation["Other"].push(m);
            }
        });

        // 6. Statystyki
        const onlineCount = onlineGuildMembers.length;
        const avgLevel = onlineCount > 0
            ? Math.round(onlineGuildMembers.reduce((sum, m) => sum + m.level, 0) / onlineCount)
            : 0;

        const highest = onlineGuildMembers[0] || null;
        const lowest = onlineGuildMembers[onlineGuildMembers.length - 1] || null;

        const vocationStats = {};
        for (const voc in byVocation) {
            vocationStats[voc] = byVocation[voc].length;
        }

        res.json({
            guild,
            world,
            online_count: onlineCount,
            average_level: avgLevel,
            highest_level: highest,
            lowest_level: lowest,
            vocation_stats: vocationStats,
            online_sorted: onlineGuildMembers,
            by_vocation: byVocation
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
