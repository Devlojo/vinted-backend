const express = require("express");

const cloudinary = require("cloudinary").v2;

const fileupload = require("express-fileupload");
const router = express.Router();

const Offer = require("../models/Offer");
const User = require("../models/User");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};
const isAuthenticated = require("../middlewares/isAuthenticated");

router.post(
  "/offer/publish",
  fileupload(),
  isAuthenticated,
  async (req, res) => {
    try {
      // on vérifie si le parametre de files est vide dans le body form-data
      if (!req.files || !req.files.picture) {
        res.send("No file uploaded!");
        return;
      }

      console.log(req.user.account);
      const { title, description, price, brand, size, city, condition, color } =
        req.body;

      const arrayOfFilesUrl = [];

      const picturesConverted = req.files.picture;
      for (let i = 0; i < picturesConverted.length; i++) {
        const picture = picturesConverted[i];
        const result = await cloudinary.uploader.upload(
          convertToBase64(picture)
        );
        // on ajoute dans le tableau vide l'objet retourné par cloudinary et on affiche la clé secure_url
        arrayOfFilesUrl.push(result.secure_url);
      }

      const product_image = arrayOfFilesUrl[0];
      const avatar = arrayOfFilesUrl[1];

      //console.log(arrayOfFilesUrl); // Affichera les deux liens vers les images dans un tableau

      //convertis les photos en format base 64 pour donner par exemple : data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAACKCAYAAADi+rf7AAAK22lDQ1BJQ0MgUHJvZmlsZQAASImVlwdUk1kWgN//pzdKEhCQEmoognQCSAmhhd6bqIQkkFBiDAQUOzI4gmNBRQTUARVFFBwdARkLYsE2KDbsE2RQU
      //!\\ si il y a une seule photo a envoyer a l'API
      //const pictureConverted = convertToBase64(req.files.picture);

      // pour supprimer une image, mettre en parametre le public_id de l'image trouvable sur cloudinary
      //const deletePicFromCloudinary = await cloudinary.uploader.destroy();
      //const result = await cloudinary.uploader.upload(pictureConverted);

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            brand: brand,
            size: size,
            condition: condition,
            color: color,
            city: city,
          },
        ],
        owner: req.user._id,

        product_image: {
          secure_url: product_image,
        },
      });

      console.log(newOffer);
      await newOffer.save();
      res.status(201).json({
        _id: newOffer._id,
        product_name: newOffer.product_name,
        product_description: newOffer.product_description,
        product_price: newOffer.product_price,
        product_details: newOffer.product_details,
        product_image: {
          secure_url: product_image,
        },

        owner: {
          account: {
            username: req.user.account.username,
            avatar: {
              secure_url: avatar,
            },
          },
          _id: req.user._id,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    // creation d'un objet de filtres
    const filters = {};
    const sortFilters = {};
    // si un titre est fourni, alors on l'ajoute dans l'objet filters
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    // Ajout d'un filtre pour le prix minimum si fourni
    if (priceMin) {
      filters.product_price = { ...filters.product_price, $gte: priceMin };
    }

    // Ajout d'un filtre pour le prix maximum si fourni
    if (priceMax) {
      //{...} permet d'ajouter un nouvel objet dans la clé product_price sans supprimer le précédent
      filters.product_price = { ...filters.product_price, $lte: priceMax };
    }

    if (sort === "price-asc") {
      sortFilters.product_price = "asc";
    }

    if (sort === "price-desc") {
      sortFilters.product_price = "desc";
    }

    let pageNumber = 1;
    const limit = 2; //nombre d'annonce que je vais afficher par page

    if (page) {
      pageNumber = page;
    }
    //console.log(filters);
    // Rechercher les offres en utilisant les filtres
    const offers = await Offer.find(filters)
      .populate({
        path: "owner",
        select: "account",
      })
      .sort(sortFilters)
      .limit(limit)
      .skip((pageNumber - 1) * limit);

    console.log(offers);

    res.json(offers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });

    res.json(offer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
