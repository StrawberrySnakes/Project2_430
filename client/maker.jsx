const helper = require('./helper.js');
const React = require('react');
const { useState, useEffect, useRef } = React;
const { createRoot } = require('react-dom/client');

const COLORS = {
  red:    { label: 'Red',    hex: '#e74c3c' },
  blue:   { label: 'Blue',   hex: '#2980b9' },
  green:  { label: 'Green',  hex: '#27ae60' },
  yellow: { label: 'Yellow', hex: '#d4ac0d' },
  purple: { label: 'Purple', hex: '#8e44ad' },
  orange: { label: 'Orange', hex: '#e67e22' },
};

// Mood is computed purely from minutes since last pet...
//I was gonna use images but I do not have the energy to make them look good, so just text labels for now
const MOOD_TIERS = [
  { maxMinutes: 1,  key: 'excited', label: 'Excited', color: '#8e44ad' },
  { maxMinutes: 5,  key: 'happy',   label: 'Happy',   color: '#27ae60' },
  { maxMinutes: 20, key: 'sleepy',  label: 'Sleepy',  color: '#2980b9' },
  { maxMinutes: 60, key: 'grumpy',  label: 'Grumpy',  color: '#e67e22' },
  { maxMinutes: Infinity, key: 'hungry', label: 'Hungry', color: '#e74c3c' },
];

// Gets the timing for mood changes, and the appropriate label/color for the current mood
const getMoodFromLastPetted = (lastPetted) => {
  const minutes = (Date.now() - new Date(lastPetted).getTime()) / 60000;
  return MOOD_TIERS.find((tier) => minutes < tier.maxMinutes) || MOOD_TIERS[MOOD_TIERS.length - 1];
};

// Form for creating new Domos
const MakerForm = ({ triggerReload }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    helper.hideError();

    const name  = e.target.querySelector('#domoName').value;
    const age   = e.target.querySelector('#domoAge').value;
    const color = e.target.querySelector('#domoColor').value;

    if (!name || !age || !color) {
      helper.handleError('All fields are required.');
      return false;
    }

    helper.sendPost(e.target.action, { name, age, color }, triggerReload);
    return false;
  };

  return (
    <form
      id="domoForm"
      name="domoForm"
      onSubmit={handleSubmit}
      action="/maker"
      method="POST"
      className="domoForm"
    >
      <label htmlFor="domoName">Name: </label>
      <input id="domoName" type="text" name="name" placeholder="Domo Name" />

      <label htmlFor="domoAge">Age: </label>
      <input id="domoAge" type="number" min="0" name="age" />

      <label htmlFor="domoColor">Color: </label>
      <select id="domoColor" name="color" className="domoSelect">
        {Object.entries(COLORS).map(([key, val]) => (
          <option key={key} value={key}>{val.label}</option>
        ))}
      </select>

      <input className="makeDomoSubmit" type="submit" value="Make Domo" />
    </form>
  );
};

// Card for displaying a single Domo, with pet and delete buttons
const DomoCard = ({ domo, onDelete }) => {
  // lastPetted is kept in local state
  const [lastPetted, setLastPetted] = useState(domo.lastPetted);
  // re-render every 30 s
  const [tick, setTick] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const handlePet = () => {
    helper.sendPost('/petDomo', { id: domo._id }, (result) => {
      if (result && result.lastPetted) {
        setLastPetted(result.lastPetted);
      }
    });
  };

  const colorInfo = COLORS[domo.color] || { label: 'Unknown', hex: '#aaa' };
  const mood      = getMoodFromLastPetted(lastPetted);

  const minutesAgo = Math.floor(
    (Date.now() - new Date(lastPetted).getTime()) / 60000,
  );
  
  const timeHint = minutesAgo < 1
    ? 'just now'
    : minutesAgo === 1
    ? '1 min ago'
    : `${minutesAgo} mins ago`;

  const isNeglected = mood.key === 'hungry' || mood.key === 'grumpy';
  
  // Calculate energy percentage (100% when freshly pet, drops to 0% after 60 mins)
  const energyPercent = Math.max(0, 100 - (minutesAgo / 60) * 100);

  return (
    <div
      className={`domo${isNeglected ? ' domoNeglected' : ''}`}
      style={{ borderTopColor: colorInfo.hex }}
    >
      <img
        src="/assets/img/domoface.jpeg"
        alt="domo face"
        className="domoFace"
        style={{ border: `3px solid ${colorInfo.hex}` }}
      />

      <h3 className="domoName">{domo.name}</h3>
      <h3 className="domoAge">Age: {domo.age}</h3>

      <div className="domoColorRow">
        <span
          className="domoColorSwatch"
          style={{ backgroundColor: colorInfo.hex }}
        />
        <span className="domoColorLabel">{colorInfo.label}</span>
      </div>

      <div className="domoMoodRow">
        <span className="domoMoodBadge" style={{ backgroundColor: mood.color }}>
          {mood.label}
        </span>
        <span className="domoTimeHint">({timeHint})</span>
      </div>
      
      <div className="domoEnergyBarContainer">
        <div 
          className="domoEnergyBar" 
          style={{ 
            width: `${energyPercent}%`, 
            backgroundColor: mood.color 
          }} 
        />
      </div>

      <div className="domoActions">
        <button className="domoPet" onClick={handlePet}>Pet Domo</button>
        <button className="domoDelete" onClick={() => onDelete(domo._id)}>Delete</button>
      </div>
    </div>
  );
};


const DomoList = ({ domos: initialDomos, reloadDomos }) => {
  const [domos, setDomos] = useState(initialDomos);

  useEffect(() => {
    const loadDomos = async () => {
      const response = await fetch('/getDomos');
      const data = await response.json();
      setDomos(data.domos);
    };
    loadDomos();
  }, [reloadDomos]);

  const handleDelete = (id) => {
    helper.sendPost('/deleteDomo', { id }, () => {
      setDomos((prev) => prev.filter((d) => d._id !== id));
    });
  };

  if (domos.length === 0) {
    return (
      <div className="domoList">
        <h3 className="emptyDomo">No Domos Yet!</h3>
      </div>
    );
  }

  return (
    <div className="domoList">
      {domos.map((domo) => (
        <DomoCard key={domo._id} domo={domo} onDelete={handleDelete} />
      ))}
    </div>
  );
};

const App = () => {
  const [reloadDomos, setReloadDomos] = useState(false);

  return (
    <div>
      <div id="makeDomo">
        <MakerForm triggerReload={() => setReloadDomos((r) => !r)} />
      </div>
      <div id="domos">
        <DomoList domos={[]} reloadDomos={reloadDomos} />
      </div>
    </div>
  );
};

window.onload = () => {
  createRoot(document.getElementById('app')).render(<App />);
};