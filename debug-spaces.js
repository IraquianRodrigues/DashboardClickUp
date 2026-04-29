require("dotenv").config({ path: ".env.local" });

const API = "https://api.clickup.com/api/v2";
const headers = { Authorization: process.env.CLICKUP_API_KEY };

async function main() {
  const spacesRes = await fetch(`${API}/team/${process.env.CLICKUP_TEAM_ID}/space?archived=false`, { headers });
  const { spaces } = await spacesRes.json();
  
  const inactive = spaces.find(s => s.name.toLowerCase().includes("inativos"));
  if (inactive) {
    console.log(`Found inactive space: "${inactive.name}" → ID: ${inactive.id}`);
  } else {
    console.log("No inactive space found");
    for (const s of spaces) console.log(`  - "${s.name}" (${s.id})`);
  }
}
main().catch(console.error);
