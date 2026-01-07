require("dotenv").config();
const express = require("express");
const { sequelize } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Проверка работы
app.get("/", (req, res) => {
  res.json({ message: "Employee Tracker API" });
});

app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "OK", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "ERROR", error: err.message });
  }
});

// Запуск
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    if (process.env.NODE_ENV === "development") {
      await sequelize.sync();
      console.log("Tables synced");
    }

    app.listen(PORT, () => {
      console.log(`Server: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
};

start();
