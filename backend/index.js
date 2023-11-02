const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const indexRoutes = require("./controller/index.routes");
dotenv.config({ path: "./.env" });
const app = express();
const port = process.env.PORT || 3001;

// middlewares
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Setup Mongoose connection
require("./config/db")(process.env.MONGO_URL);
// require("./dummyData");

//Load all routes
app.use("/api", indexRoutes);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
