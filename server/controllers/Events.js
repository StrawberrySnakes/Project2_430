// controllers/Events.js
// Handles all CRUD operations for event posts.
// Owners can create, read, and delete their own events.
// Public events are readable by any logged-in user.

const models = require('../models');

const { Events } = models;

const VALID_CATEGORIES = ['social', 'lesson', 'workshop', 'festival', 'other'];

// Renders the main app shell
const eventPage = (req, res) => res.render('events');

// Creates a new event for the logged-in user
const createEvent = async (req, res) => {
  const { title, description, category, imageUrl, isPublic } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'Title, description, and category are required.' });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  const eventData = {
    title,
    description,
    category,
    imageURL: imageUrl || '',
    isPublic: isPublic === true || isPublic === 'true',
    owner: req.session.account._id,
  };

  try {
    const newEvent = new Events(eventData);
    await newEvent.save();
    return res.status(201).json(Events.toAPI(newEvent));
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'An error occurred creating the event.' });
  }
};

// Returns only the logged-in user's own events
const getEvents = async (req, res) => {
  try {
    const docs = await Events.find({ owner: req.session.account._id })
      .select('title description category imageURL isPublic createdDate')
      .lean()
      .exec();
    return res.json({ events: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error retrieving events.' });
  }
};

// Returns all public events (the community feed)
// ?category=salsa to filter by style
const getPublicEvents = async (req, res) => {
  try {
    const query = { isPublic: true };
    if (req.query.category && VALID_CATEGORIES.includes(req.query.category)) {
      query.category = req.query.category;
    }

    const docs = await Events.find(query)
      .select('title description category imageURL createdDate owner')
      .populate('owner', 'username') // attach username to each post
      .sort({ createdDate: -1 })     // newest first
      .lean()
      .exec();

    return res.json({ events: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error retrieving public events.' });
  }
};

// Deletes an event only if the logged-in user owns it
const deleteEvent = async (req, res) => {
  if (!req.body.id) {
    return res.status(400).json({ error: 'Event ID is required.' });
  }

  try {
    const result = await Events.deleteOne({
      _id: req.body.id,
      owner: req.session.account._id, // prevents deleting someone else's event
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Event not found or not authorized.' });
    }

    return res.json({ message: 'Event deleted.' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error deleting event.' });
  }
};

module.exports = {
  eventPage,
  createEvent,
  getEvents,
  getPublicEvents,
  deleteEvent,
};