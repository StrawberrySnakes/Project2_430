//event.jsx - shows event feed, user's events, and form to post new event
const helper = require('./helper.js');
const React = require('react');
const { useState, useEffect } = React;
const { createRoot } = require('react-dom/client');

const EVENT_CATEGORIES_ALL = ['all', 'social', 'lesson', 'workshop', 'festival', 'other'];
const EVENT_CATEGORIES = ['social', 'lesson', 'workshop', 'festival', 'other'];

const EventCategoryFilter = ({ active, onChange }) => (
  <div className="categoryFilter">
    {EVENT_CATEGORIES_ALL.map((cat) => (
      <button
        key={cat}
        className={`catBtn${active === cat ? ' catBtn--active' : ''}`}
        onClick={() => onChange(cat)}
      >
        {cat.charAt(0).toUpperCase() + cat.slice(1)}
      </button>
    ))}
  </div>
);

// Renders the media attached to an event (uploaded file or external image URL).
const EventMedia = ({ event }) => {
  if (!event.mediaUrl && !event.imageUrl) return null;
 
  if (event.mediaUrl) {
    if (event.mediaType === 'video') {
      return <video className="eventCard__media" src={event.mediaUrl} controls preload="metadata" />;
    }
    return <img className="eventCard__media" src={event.mediaUrl} alt={event.title} loading="lazy" />;
  }
 
  // Fallback: external image URL
  return (
    <>
      <img className="eventCard__image" src={event.imageUrl} alt={event.title} loading="lazy" />
      <a className="eventCard__imageLink" href={event.imageUrl} target="_blank" rel="noreferrer">
        View Image
      </a>
    </>
  );
};

const EventCard = ({ event, onDelete }) => {
  const categoryColors = {
    social:   '#e8443a',
    lesson:   '#c0392b',
    workshop: '#f0a500',
    festival: '#e67e22',
    other:    '#8a7070',
  };

  const accentColor = categoryColors[event.category] || '#8a7070';

  return (
    <article className="eventCard" style={{ '--accent': accentColor }}>
      <div className="eventCard__header">
        <span className="eventCard__category">{event.category}</span>
        {onDelete && (
          <button
            className="eventCard__delete"
            onClick={() => onDelete(event._id)}
            aria-label="Delete event"
          >
            ✕
          </button>
        )}
      </div>

      <h3 className="eventCard__title">{event.title}</h3>

      {event.owner?.username && (
        <p className="eventCard__author">by {event.owner.username}</p>
      )}

      <p className="eventCard__desc">{event.description}</p>

      <EventMedia event={event} />

      <time className="eventCard__date">
        {new Date(event.createdDate).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })}
      </time>
    </article>
  );
};



// Fetches and displays public events. Supports category filtering. Also Re-fetches when reloadTrigger changes.
const EventFeed = ({ reloadTrigger }) => {
  const [events, setEvents] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const url = category === 'all'
        ? '/getPublicEvents'
        : `/getPublicEvents?category=${category}`;
      const response = await fetch(url);
      const data = await response.json();
      setEvents(data.events || []);
      setLoading(false);
    };
    fetchEvents();
  }, [category, reloadTrigger]);

  return (
    <section className="feedSection">
      <h2 className="sectionTitle">Event Feed</h2>
      <EventCategoryFilter active={category} onChange={setCategory} />
 
      {loading && <p className="feedEmpty">Loading...</p>}
 
      {!loading && events.length === 0 && (
        <p className="feedEmpty">No events posted yet. Be the first!</p>
      )}
 
      <div className="moveGrid">
        {events.map((event) => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>
    </section>
  );
};

// Shows the logged-in user's own posts, with delete capability.
const MyEvents = ({ reloadTrigger }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    const response = await fetch('/getEvents');
    const data = await response.json();
    setEvents(data.events || []);
    setLoading(false);
  };

  useEffect(() => { loadEvents(); }, [reloadTrigger]);

  const handleDelete = (id) => {
    helper.sendPost('/deleteEvent', { id }, () => {
      setEvents((prev) => prev.filter((e) => e._id !== id));
    });
  };

  return (
    <section className="feedSection">
      <h2 className="sectionTitle">My Events</h2>

      {loading && <p className="feedEmpty">Loading...</p>}

      {!loading && events.length === 0 && (
        <p className="feedEmpty">You haven't posted any events yet.</p>
      )}

      <div className="moveGrid">
        {events.map((event) => (
          <EventCard key={event._id} event={event} onDelete={handleDelete} />
        ))}
      </div>
    </section>
  );
};

// Form for submitting a new event.
const CreateEventForm = ({ onSuccess }) => {
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) { setMediaPreview(null); setMediaType(null); return; }
    setMediaType(file.type.startsWith('video') ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
  };
 
  const clearFile = () => {
    document.getElementById('eventFile').value = '';
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    helper.hideError();

    const title       = e.target.querySelector('#eventTitle').value.trim();
    const description = e.target.querySelector('#eventDesc').value.trim();
    const category    = e.target.querySelector('#eventCategory').value;
    const imageUrl    = e.target.querySelector('#eventImage').value.trim();
    const isPublic    = e.target.querySelector('#eventPublic').checked;
    const file        = e.target.querySelector('#eventFile').files[0];
 
    if (!title || !description || !category) {
      helper.handleError('Title, description, and category are required.');
      return false;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('imageUrl', imageUrl);
    formData.append('isPublic', isPublic);
    if (file) formData.append('media', file);

    helper.sendPost('/createEvent', formData, (result) => {
      if (!result.error) {
        e.target.reset();
        setMediaPreview(null);
        setMediaType(null);
        if (onSuccess) onSuccess();
      }
    });
 
    return false;
  };

  return (
    <section className="formSection">
      <h2 className="sectionTitle">Post an Event</h2>
      <form id="createEventForm" className="eventForm" onSubmit={handleSubmit}>
 
        <div className="formGroup">
          <label htmlFor="eventTitle">Event Name</label>
          <input
            id="eventTitle"
            type="text"
            name="title"
            placeholder="e.g. Salsa Night at Club XYZ"
            maxLength={60}
          />
        </div>
 
        <div className="formGroup">
          <label htmlFor="eventCategory">Type</label>
          <select id="eventCategory" name="category" className="eventSelect">
            {EVENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
 
        <div className="formGroup">
          <label htmlFor="eventDesc">Description</label>
          <textarea
            id="eventDesc"
            name="description"
            placeholder="Describe the event details, location, time, and any other relevant info..."
            rows={4}
            maxLength={500}
          />
        </div>
 
        {/* ── Upload flyer / photo / video ── */}
        <div className="formGroup">
          <label htmlFor="eventFile">
            Upload Flyer or Photo <span className="optional">(optional)</span>
          </label>
          <input
            id="eventFile"
            type="file"
            name="media"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="fileInput"
          />
          {mediaPreview && (
            <div className="mediaPreviewWrap">
              {mediaType === 'video'
                ? <video src={mediaPreview} controls className="mediaPreview" />
                : <img src={mediaPreview} alt="Preview" className="mediaPreview" />
              }
              <button type="button" className="clearMediaBtn" onClick={clearFile}>
                Remove
              </button>
            </div>
          )}
        </div>
 
        {/* ── Or paste an external URL ── */}
        <div className="formGroup">
          <label htmlFor="eventImage">
            Or paste an Image URL <span className="optional">(optional)</span>
          </label>
          <input
            id="eventImage"
            type="url"
            name="imageUrl"
            placeholder="https://example.com/flyer.jpg"
          />
        </div>
 
        <div className="formGroup formGroup--inline">
          <input id="eventPublic" type="checkbox" name="isPublic" defaultChecked />
          <label htmlFor="eventPublic">Post to community feed</label>
        </div>
 
        <button className="submitBtn" type="submit">Post Event</button>
      </form>
    </section>
  );
};


// Single venue card from the Google Places results.
const VenueCard = ({ venue }) => {
  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${venue.place_id}`;
  const stars = venue.rating ? '★'.repeat(Math.round(venue.rating)) + '☆'.repeat(5 - Math.round(venue.rating)) : null;
 
  return (
    <article className="eventCard" style={{ '--accent': '#e8443a' }}>
      <div className="eventCard__header">
        <span className="eventCard__category">venue</span>
        {venue.opening_hours && (
          <span className={venue.opening_hours.open_now ? 'venueOpen' : 'venueClosed'}>
            {venue.opening_hours.open_now ? 'Open now' : 'Closed'}
          </span>
        )}
      </div>
 
      <h3 className="eventCard__title">{venue.name}</h3>
      <p className="eventCard__desc">{venue.vicinity}</p>
 
      {stars && (
        <p className="venueRating">
          <span className="venueStars">{stars}</span>
          {' '}{venue.rating} ({venue.user_ratings_total?.toLocaleString()} reviews)
        </p>
      )}
 
      {venue.types && (
        <p className="venueTags">
          {venue.types
            .filter((t) => !['point_of_interest', 'establishment'].includes(t))
            .slice(0, 3)
            .map((t) => t.replace(/_/g, ' '))
            .join(' · ')}
        </p>
      )}
 
      <a href={mapsUrl} className="moveCard__videoLink" target="_blank" rel="noreferrer">
        View on Google Maps →
      </a>
    </article>
  );
};
 
// Prompts for geolocation then fetches nearby latin dance venues via our API.
const NearbyVenues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [radius, setRadius] = useState(10);  // km
 
  const findVenues = () => {
    setError('');
    setLoading(true);
 
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
 
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `/api/venues?lat=${latitude}&lng=${longitude}&radius=${radius * 1000}`
          );
          const data = await res.json();
          if (data.error) {
            setError(data.error);
          } else {
            setVenues(data.venues || []);
          }
        } catch {
          setError('Failed to fetch venues. Please try again.');
        }
        setLoading(false);
        setSearched(true);
      },
      () => {
        setError('Location access denied. Please enable location permissions and try again.');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };
 
  return (
    <section className="feedSection">
      <h2 className="sectionTitle">Latin Dance Venues Near You</h2>
      <p className="feedSubtitle">
        Discover salsa clubs, dance studios, and social nights in your area.
      </p>
 
      <div className="venueControls">
        <label htmlFor="radiusSelect" className="venueRadiusLabel">Search radius:</label>
        <select
          id="radiusSelect"
          className="moveSelect venueRadiusSelect"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        >
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
          <option value={25}>25 km</option>
          <option value={50}>50 km</option>
        </select>
        <button className="submitBtn venueSearchBtn" onClick={findVenues} disabled={loading}>
          {loading ? 'Searching...' : searched ? 'Search Again' : 'Find Venues'}
        </button>
      </div>
 
      {error && <p className="feedEmpty feedEmpty--error">{error}</p>}
 
      {!loading && searched && venues.length === 0 && !error && (
        <p className="feedEmpty">
          No latin dance venues found within {radius} km. Try expanding your search radius.
        </p>
      )}
 
      <div className="moveGrid">
        {venues.map((venue) => (
          <VenueCard key={venue.place_id} venue={venue} />
        ))}
      </div>
    </section>
  );
};

// Manages the active tab and the reload trigger for feeds.
const App = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [reloadTrigger, setReloadTrigger] = useState(false);

  const triggerReload = () => setReloadTrigger((r) => !r);

  // After posting -- switch back to feed and reload it
  const handlePostSuccess = () => {
    triggerReload();
    setActiveTab('feed');
  };

  return (
    <div className="appContainer">
      <div className="tabBar">
        <button
          className={`tabBtn${activeTab === 'feed' ? ' tabBtn--active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          Event Feed
        </button>
        <button
          className={`tabBtn${activeTab === 'mine' ? ' tabBtn--active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          My Events
        </button>
        <button
          className={`tabBtn${activeTab === 'post_event' ? ' tabBtn--active' : ''}`}
          onClick={() => setActiveTab('post_event')}
        >
          + Post an Event
        </button>
        <button
          className={`tabBtn${activeTab === 'venues' ? ' tabBtn--active' : ''}`}
          onClick={() => setActiveTab('venues')}
        >
          📍 Nearby Venues
        </button>
      </div>
 
      {activeTab === 'feed'       && <EventFeed reloadTrigger={reloadTrigger} />}
      {activeTab === 'mine'       && <MyEvents reloadTrigger={reloadTrigger} />}
      {activeTab === 'post_event' && <CreateEventForm onSuccess={handlePostSuccess} />}
      {activeTab === 'venues'     && <NearbyVenues />}
    </div>
  );
};

window.onload = () => {
  createRoot(document.getElementById('eventApp')).render(<App />);
};