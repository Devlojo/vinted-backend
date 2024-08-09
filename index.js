const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);
// Données qui vont servir a se connecter a l'api de cloudinary :
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET,
});

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");

// ajout d'un prefixe user qui fait que toutes les routes de userRoutes commenceront par /user
app.use("/user", userRoutes);

app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exists" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
