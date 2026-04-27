//event.jsx - shows event feed, user's events, and form to post new event
const helper = require('./helper.js');
const React = require('react');
const { useState, useEffect } = React;
const { createRoot } = require('react-dom/client');

const EVENT_CATEGORIES = ['social', 'lesson', 'workshop', 'festival', 'other'];

const EventCategoryFilter = ({ active, onChange }) => (
  <div className="categoryFilter">
    {EVENT_CATEGORIES.map((cat) => (
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

      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="eventCard__image"
        />
      )}

      {event.imageUrl && (
        <a
        className="eventCard__imageLink"
        href={event.imageUrl}
        target="_blank"
        rel="noreferrer"
        >
            View Image
        </a>
     )}

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
  const handleSubmit = (e) => {
    e.preventDefault();
    helper.hideError();

    const title       = e.target.querySelector('#eventTitle').value.trim();
    const description = e.target.querySelector('#eventDesc').value.trim();
    const category    = e.target.querySelector('#eventCategory').value;
    const image    = e.target.querySelector('#eventImage').value.trim();
    const isPublic    = e.target.querySelector('#eventPublic').checked;

    if (!title || !description || !category) {
      helper.handleError('Title, description, and category are required.');
      return false;
    }

    helper.sendPost('/createEvent', { title, description, category, image, isPublic }, (result) => {
      if (!result.error) {
        e.target.reset();
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
            placeholder="e.g. salsa night at Club XYZ"
            maxLength={60}
          />
        </div>

        <div className="formGroup">
          <label htmlFor="eventCategory">Type</label>
          <select id="eventCategory" name="category" className="eventSelect">
            {EVENT_CATEGORIES.filter((c) => c !== 'all').map((cat) => (
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

        <div className="formGroup">
          <label htmlFor="eventImage">Image URL <span className="optional">(optional)</span></label>
          <input
            id="eventImage"
            type="url"
            name="image"
            placeholder="https://example.com/image.jpg"
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
          className={`tabBtn${activeTab === 'post_event' ? ' tabBtn--active' : ''}`}
          onClick={() => setActiveTab('post_event')}
        >
          + Post an Event
        </button>
      </div>

      {activeTab === 'feed' && <EventFeed reloadTrigger={reloadTrigger} />}
      {activeTab === 'mine' && <MyEvents reloadTrigger={reloadTrigger} />}
      {activeTab === 'post' && <CreateEventForm onSuccess={handlePostSuccess} />}
      {activeTab === 'post_event' && <CreateEventForm onSuccess={handlePostSuccess} />}
    </div>
  );
};

window.onload = () => {
  createRoot(document.getElementById('eventApp')).render(<EventsPage />);
};