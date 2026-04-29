// client/app.jsx
// Manages top-level view state and renders the page (Feed, My Moves, or Post) based on the active tab.

const helper = require('./helper.js');
const React = require('react');
const { useState, useEffect } = React;
const { createRoot } = require('react-dom/client');

const CATEGORIES = ['all', 'salsa', 'bachata', 'merengue', 'chacha', 'other'];

// Row of pill buttons that filter the move feed by dance style.
const CategoryFilter = ({ active, onChange }) => (
  <div className="categoryFilter">
    {CATEGORIES.map((cat) => (
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

// Renders the media attached to a move (uploaded file or external link).
const MoveMedia = ({ move }) => {
  if (!move.mediaUrl && !move.videoUrl) return null;

  // Uploaded file takes priority
  if (move.mediaUrl) {
    if (move.mediaType === 'video') {
      return (
        <video
          className="moveCard__media"
          src={move.mediaUrl}
          controls
          preload="metadata"
        />
      );
    }
    return (
      <img
        className="moveCard__media"
        src={move.mediaUrl}
        alt={move.title}
        loading="lazy"
      />
    );
  }

  // Fallback: external video link
  return (
    <a
      className="moveCard__videoLink"
      href={move.videoUrl}
      target="_blank"
      rel="noreferrer"
    >
      Watch Video
    </a>
  );
};

// Displays a single dance move post. Shows delete button only on owner's posts.
const MoveCard = ({ move, onDelete }) => {
  const categoryColors = {
    salsa:    '#e8443a',
    bachata:  '#c0392b',
    merengue: '#f0a500',
    chacha:   '#e67e22',
    other:    '#8a7070',
  };

  const accentColor = categoryColors[move.category] || '#8a7070';

  return (
    <article className="moveCard" style={{ '--accent': accentColor }}>
      <div className="moveCard__header">
        <span className="moveCard__category">{move.category}</span>
        {onDelete && (
          <button
            className="moveCard__delete"
            onClick={() => onDelete(move._id)}
            aria-label="Delete move"
          >
            ✕
          </button>
        )}
      </div>

      <h3 className="moveCard__title">{move.title}</h3>

      {move.owner?.username && (
        <p className="moveCard__author">by {move.owner.username}</p>
      )}

      <p className="moveCard__desc">{move.description}</p>

      <MoveMedia move={move} />

      <time className="moveCard__date">
        {new Date(move.createdDate).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })}
      </time>
    </article>
  );
};

const SearchBar = ({ value, onChange }) => (
  <div className="searchBar">
    <input
      type="text"
      className="searchBar__input"
      placeholder="Search moves by name or description..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {value && (
      <button className="searchBar__clear" onClick={() => onChange('')}>✕</button>
    )}
  </div>
);

// Fetches and displays public moves. Supports category filtering.
const MoveFeed = ({ reloadTrigger }) => {
  const [moves, setMoves] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoves = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());
      const url = `/getPublicMoves${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setMoves(data.moves || []);
      setLoading(false);
    };
    fetchMoves();
  }, [category, search, reloadTrigger]);// add search

  return (
    <section className="feedSection">
      <h2 className="sectionTitle">Archive</h2>
      <SearchBar value={search} onChange={setSearch} />
      <CategoryFilter active={category} onChange={setCategory} />
      {loading && <p className="feedEmpty">Loading...</p>}
      {!loading && moves.length === 0 && (
        <p className="feedEmpty">
          {search ? `No moves found for "${search}".` : 'No moves posted yet. Be the first!'}
        </p>
      )}
      <div className="moveGrid">
        {moves.map((move) => <MoveCard key={move._id} move={move} />)}
      </div>
    </section>
  );
};

// Shows the logged-in user's own posts, with delete capability.
const MyMoves = ({ reloadTrigger }) => {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMoves = async () => {
    setLoading(true);
    const response = await fetch('/getMoves');
    const data = await response.json();
    setMoves(data.moves || []);
    setLoading(false);
  };

  useEffect(() => { loadMoves(); }, [reloadTrigger]);

  const handleDelete = (id) => {
    helper.sendPost('/deleteMove', { id }, () => {
      setMoves((prev) => prev.filter((m) => m._id !== id));
    });
  };

  return (
    <section className="feedSection">
      <h2 className="sectionTitle">My Moves</h2>

      {loading && <p className="feedEmpty">Loading...</p>}

      {!loading && moves.length === 0 && (
        <p className="feedEmpty">You haven't posted any moves yet.</p>
      )}

      <div className="moveGrid">
        {moves.map((move) => (
          <MoveCard key={move._id} move={move} onDelete={handleDelete} />
        ))}
      </div>
    </section>
  );
};

// Form for submitting a new dance move post.
// Supports both a direct file upload (video or photo) and an external URL.
const CreateMoveForm = ({ onSuccess }) => {
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) { setMediaPreview(null); setMediaType(null); return; }
    setMediaType(file.type.startsWith('video') ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    document.getElementById('moveFile').value = '';
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    helper.hideError();

    const title       = e.target.querySelector('#moveTitle').value.trim();
    const description = e.target.querySelector('#moveDesc').value.trim();
    const category    = e.target.querySelector('#moveCategory').value;
    const videoUrl    = e.target.querySelector('#moveVideo').value.trim();
    const isPublic    = e.target.querySelector('#movePublic').checked;
    const file        = e.target.querySelector('#moveFile').files[0];

    if (!title || !description || !category) {
      helper.handleError('Title, description, and category are required.');
      return false;
    }

    // Use FormData so we can attach the file
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('videoUrl', videoUrl);
    formData.append('isPublic', isPublic);
    if (file) formData.append('media', file);

    helper.sendPost('/createMove', formData, (result) => {
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
      <h2 className="sectionTitle">Post a Move</h2>
      <form id="createMoveForm" className="moveForm" onSubmit={handleSubmit}>

        <div className="formGroup">
          <label htmlFor="moveTitle">Move Name</label>
          <input
            id="moveTitle"
            type="text"
            name="title"
            placeholder="e.g. Cross Body Lead"
            maxLength={60}
          />
        </div>

        <div className="formGroup">
          <label htmlFor="moveCategory">Style</label>
          <select id="moveCategory" name="category" className="moveSelect">
            {CATEGORIES.filter((c) => c !== 'all').map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="formGroup">
          <label htmlFor="moveDesc">Description</label>
          <textarea
            id="moveDesc"
            name="description"
            placeholder="Describe the footwork, timing, and lead/follow cues..."
            rows={4}
            maxLength={500}
          />
        </div>

        {/* ── Upload your own file ── */}
        <div className="formGroup">
          <label htmlFor="moveFile">
            Upload Video or Photo <span className="optional">(optional)</span>
          </label>
          <input
            id="moveFile"
            type="file"
            name="media"
            accept="video/*,image/*"
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
          <label htmlFor="moveVideo">
            Or paste a Video URL <span className="optional">(optional)</span>
          </label>
          <input
            id="moveVideo"
            type="url"
            name="videoUrl"
            placeholder="https://youtube.com/..."
          />
        </div>

        <div className="formGroup formGroup--inline">
          <input id="movePublic" type="checkbox" name="isPublic" defaultChecked />
          <label htmlFor="movePublic">Post to community feed</label>
        </div>

        <button className="submitBtn" type="submit">Post Move</button>
      </form>
    </section>
  );
};

// Manages the active tab and the reload trigger for feeds.
const App = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [reloadTrigger, setReloadTrigger] = useState(false);

  const triggerReload = () => setReloadTrigger((r) => !r);

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
          Community Feed
        </button>
        <button
          className={`tabBtn${activeTab === 'mine' ? ' tabBtn--active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          My Moves
        </button>
        <button
          className={`tabBtn${activeTab === 'post' ? ' tabBtn--active' : ''}`}
          onClick={() => setActiveTab('post')}
        >
          + Post a Move
        </button>
      </div>

      {activeTab === 'feed' && <MoveFeed reloadTrigger={reloadTrigger} />}
      {activeTab === 'mine' && <MyMoves reloadTrigger={reloadTrigger} />}
      {activeTab === 'post' && <CreateMoveForm onSuccess={handlePostSuccess} />}
    </div>
  );
};

window.onload = () => {
  createRoot(document.getElementById('app')).render(<App />);
};