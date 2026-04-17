// controllers/DanceMove.js
// Handles all CRUD operations for dance move posts.
// Owners can create, read, and delete their own moves.
// Public moves are readable by any logged-in user.

const models = require('../models');

const { DanceMove } = models;

const VALID_CATEGORIES = ['salsa', 'bachata', 'merengue', 'chacha', 'other'];

// Renders the main app shell
const appPage = async (req, res) => res.render('app');

// Creates a new dance move post for the logged-in user
const createMove = async (req, res) => {
  const { title, description, category, videoUrl, isPublic } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'Title, description, and category are required.' });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  const moveData = {
    title,
    description,
    category,
    videoUrl: videoUrl || '',
    isPublic: isPublic === true || isPublic === 'true',
    owner: req.session.account._id,
  };

  try {
    const newMove = new DanceMove(moveData);
    await newMove.save();
    return res.status(201).json(DanceMove.toAPI(newMove));
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'An error occurred creating the move.' });
  }
};

// Returns only the logged-in user's own moves
const getMoves = async (req, res) => {
  try {
    const docs = await DanceMove.find({ owner: req.session.account._id })
      .select('title description category videoUrl isPublic createdDate')
      .lean()
      .exec();
    return res.json({ moves: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error retrieving moves.' });
  }
};

// Returns all public moves (the community feed)
// ?category=salsa to filter by style
const getPublicMoves = async (req, res) => {
  try {
    const query = { isPublic: true };
    if (req.query.category && VALID_CATEGORIES.includes(req.query.category)) {
      query.category = req.query.category;
    }

    const docs = await DanceMove.find(query)
      .select('title description category videoUrl createdDate owner')
      .populate('owner', 'username') // attach username to each post
      .sort({ createdDate: -1 })     // newest first
      .lean()
      .exec();

    return res.json({ moves: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error retrieving public moves.' });
  }
};

// Deletes a move only if the logged-in user owns it
const deleteMove = async (req, res) => {
  if (!req.body.id) {
    return res.status(400).json({ error: 'Move ID is required.' });
  }

  try {
    const result = await DanceMove.deleteOne({
      _id: req.body.id,
      owner: req.session.account._id, // prevents deleting someone else's move
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Move not found or not authorized.' });
    }

    return res.json({ message: 'Move deleted.' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error deleting move.' });
  }
};

module.exports = {
  appPage,
  createMove,
  getMoves,
  getPublicMoves,
  deleteMove,
};