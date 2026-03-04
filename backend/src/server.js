require("dotenv").config();
const serialize = require("./utils/bigint");
const app = require("./app");
const prisma = require("./prisma"); // ✅ ADD THIS LINE

const PORT = process.env.PORT || 5000;

// TEMP DB TEST ROUTEs
app.get("/test-db", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    res.json({ connected: true, result: serialize(result) });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
