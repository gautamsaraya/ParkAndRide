const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/metro-stations", require("./routes/metroStations"));
app.use("/api/parking-lots", require("./routes/parkingLots"));
app.use("/api/reservations", require("./routes/reservations"));
app.use("/api/rides", require("./routes/rides"));

// Admin Routes
app.use("/api/admin/metro-stations", require("./routes/admin/metroStations"));
app.use("/api/admin/parking-lots", require("./routes/admin/parkingLots"));
app.use("/api/admin/parking-slots", require("./routes/admin/parkingSlots"));
app.use("/api/admin/drivers", require("./routes/admin/drivers"));
app.use("/api/admin/vehicles", require("./routes/admin/vehicles"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
