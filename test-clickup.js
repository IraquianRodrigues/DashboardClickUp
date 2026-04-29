require("dotenv").config({ path: ".env.local" });

async function test() {
  try {
    const res = await fetch(`https://api.clickup.com/api/v2/team/${process.env.CLICKUP_TEAM_ID}/task`, {
      headers: {
        Authorization: process.env.CLICKUP_API_KEY
      }
    });
    console.log("Status:", res.status);
    const body = await res.text();
    console.log("Body:", body.substring(0, 500));
  } catch (err) {
    console.error(err);
  }
}

test();
