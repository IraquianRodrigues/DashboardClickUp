const { getClickUpClient } = require("./src/lib/clickup/client");
require("dotenv").config({ path: ".env.local" });

async function test() {
  try {
    const client = getClickUpClient();
    const spaces = await client.getSpaces();
    console.log("Spaces:", spaces.map(s => ({ id: s.id, name: s.name })));
    
    const res = await client.getAllTasks({ limit: 1 }, 1);
    console.log("Tasks spaces:", res.slice(0, 5).map(t => t.space));
  } catch (err) {
    console.error(err);
  }
}

test();
