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

  let resolvedMediaUrl = '';
  let mediaType = 'link';
 
  if (req.file) {
    resolvedMediaUrl = req.file.path;
    mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
  }

  const eventData = {
    title,
    description,
    category,
    imageUrl: imageUrl || '',       // ← was imageURL
    mediaUrl: resolvedMediaUrl,     // ← was mediaURL
    mediaType,
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
      .select('title description category imageUrl mediaUrl mediaType isPublic createdDate')
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
    if (req.query.search && req.query.search.trim()) {
      query.$text = { $search: req.query.search.trim() };
    }

    const docs = await Events.find(query)
      .select('title description category imageUrl mediaUrl mediaType createdDate owner')
      .populate('owner', 'username')
      .sort(query.$text ? { score: { $meta: 'textScore' } } : { createdDate: -1 })
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

// Proxies a Google Places Nearby Search so the API key is never exposed.
const getNearbyVenues = async (req, res) => {
  const { lat, lng, radius = 10000 } = req.query;
 
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng query parameters are required.' });
  }
 
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Maps API key is not configured on the server.' });
  }
 
  // Search for latin dance venues using two keyword passes and merge results
  const keywords = ['latin dance salsa', 'salsa club bachata'];
  const seen = new Set();
  const allVenues = [];
 
  try {
    for (const keyword of keywords) {
      const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
      url.searchParams.set('location', `${lat},${lng}`);
      url.searchParams.set('radius', Math.min(Number(radius), 50000)); // cap at 50 km
      url.searchParams.set('keyword', keyword);
      url.searchParams.set('key', apiKey);
 
      const response = await fetch(url.toString());
      const data = await response.json();
 
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.log('Places API error:', data.status, data.error_message);
        // Continue to next keyword rather than failing
        continue;
      }
 
      for (const place of data.results || []) {
        if (!seen.has(place.place_id)) {
          seen.add(place.place_id);
          allVenues.push(place);
        }
      }
    }
 
    // Sort
    allVenues.sort((a, b) => {
      const aOpen = a.opening_hours?.open_now ? 1 : 0;
      const bOpen = b.opening_hours?.open_now ? 1 : 0;
      if (bOpen !== aOpen) return bOpen - aOpen;
      return (b.rating || 0) - (a.rating || 0);
    });
 
    return res.json({ venues: allVenues });
  } catch (err) {
    console.log('getNearbyVenues error:', err);
    return res.status(500).json({ error: 'Failed to fetch venues from Google Maps.' });
  }
};

module.exports = {
  eventPage,
  createEvent,
  getEvents,
  getPublicEvents,
  deleteEvent,
  getNearbyVenues,
};