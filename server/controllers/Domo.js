const models = require('../models');

const Domo = models.Domo;

const makerPage = async (req, res) => res.render('app');

const makeDomo = async (req, res) => {
  if (!req.body.name || !req.body.age || !req.body.color) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const validColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  if (!validColors.includes(req.body.color)) {
    return res.status(400).json({ error: 'Invalid color.' });
  }

  const domoData = {
    name: req.body.name,
    age: req.body.age,
    color: req.body.color,
    lastPetted: new Date(),
    owner: req.session.account._id,
  };

  try {
    const newDomo = new Domo(domoData);
    await newDomo.save();
    return res.status(201).json({
      name: newDomo.name,
      age: newDomo.age,
      color: newDomo.color,
      lastPetted: newDomo.lastPetted,
    });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Domo already exists.' });
    }
    return res.status(500).json({ error: 'An error occurred making domo.' });
  }
};

const getDomos = async (req, res) => {
  try {
    const query = { owner: req.session.account._id };
    const docs = await Domo.find(query).select('name age color lastPetted').lean().exec();
    return res.json({ domos: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error retrieving domos!' });
  }
};

const deleteDomo = async (req, res) => {
  if (!req.body.id) {
    return res.status(400).json({ error: 'Domo ID is required.' });
  }

  try {
    const result = await Domo.deleteOne({
      _id: req.body.id,
      owner: req.session.account._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Domo not found.' });
    }

    return res.json({ message: 'Domo deleted.' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error deleting domo.' });
  }
};

// Resets
const petDomo = async (req, res) => {
  if (!req.body.id) {
    return res.status(400).json({ error: 'Domo ID is required.' });
  }

  try {
    const now = new Date();
    const updated = await Domo.findOneAndUpdate(
      { _id: req.body.id, owner: req.session.account._id },
      { lastPetted: now },
      { new: true },
    ).lean().exec();

    if (!updated) {
      return res.status(404).json({ error: 'Domo not found.' });
    }

    return res.json({ id: updated._id, lastPetted: updated.lastPetted });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error petting domo.' });
  }
};

module.exports = {
  makerPage,
  makeDomo,
  getDomos,
  deleteDomo,
  petDomo,
};