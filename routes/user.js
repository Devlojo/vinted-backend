const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const router = express.Router();

const User = require("../models/User");

router.post("/signup", async (req, res) => {
  try {
    // utilisation d'un destructuring qui va permettre de creer plusieurs variables d'un coup sera égale a req.body
    // par exemple si dans req.body il y a un clé username, sa valeur sera stocké dans la variable username
    const { username, email, password, newsletter } = req.body;

    // on vérifie si les informations dans le body sont false en controlant si les différents parametres sont bien renseignés
    if (!username || !email || !password) {
      return res.status(400).json({ message: "missing parameters" });
    }

    //recuperation de l'utilisation dont l'email est correspondant à celui renseigné dans le body
    const user = await User.findOne({ email: email });

    // si c'est le cas, l'utilisateur est bien existant donc l'email est déjà utilisé
    if (user) {
      return res.status(400).json({ message: "email already use" });
    }

    const salt = uid2(64);

    const hash = SHA256(req.body.password + salt).toString(encBase64);
    const token = uid2(64);

    const newUser = new User({
      email: email,
      account: {
        username: username,
      },
      newsletter: newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    await newUser.save();
    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: newUser.account,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    const passwordToVerify = SHA256(req.body.password + user.salt).toString(
      encBase64
    );
    //console.log(passwordToVerify);

    // on teste si le mot de passe de la req correspond aux mdp hash du user
    if (passwordToVerify === user.hash) {
      return res.json({
        _id: user._id,
        token: user.token,
        account: user.account,
      });
    } else {
      return res.status(400).json({ message: "email or password incorrect" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
