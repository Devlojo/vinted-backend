const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    // si il n'y a pas de token, alors il n'y a pas d'utilisateur donc renvois une erreur
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = req.headers.authorization.replace("Bearer ", ""); // je récupère le token dans le header

    // je vais chercher dans ma BDD si j'ai bien un user lié a ce token
    const user = await User.findOne({ token: token });

    //si l'utilisateur existe, c'est que le token correspond bien a celui de la requete donc on va stocker stocker la clé user pour reutiliser
    // puis passer à la fonction suivante
    if (user) {
      req.user = user;
      return next(); // je passe au prochain middleware
    } else {
      return res.status(401).json({ message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = isAuthenticated;
