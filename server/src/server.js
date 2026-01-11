require("dotenv").config();
const express = require("express");
const path = require('path');
const { sequelize } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//статика для фотографий сотрудников
app.use('/uploads', express.static(path.join(__dirname, './uploads')));
// Подключаем роуты
app.use("/api", require("./routes"));

// Health check
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "OK", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "ERROR", error: err.message });
  }
});

// 404 обработчик
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
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
