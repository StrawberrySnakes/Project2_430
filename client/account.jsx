// client/account.jsx
const helper = require('./helper.js');
const React = require('react');
const { useState, useEffect } = React;
const { createRoot } = require('react-dom/client');

const AccountInfo = ({ account }) => (
  <div className="accountInfo">
    <h3 className="accountInfo__name">{account.username}</h3>
    <p className="accountInfo__date">
      Member since {new Date(account.createdDate).toLocaleDateString('en-US', {
        month: 'long', year: 'numeric',
      })}
    </p>
    {account.isPremium && (
      <span className="premiumBadge">Premium Member</span>
    )}
  </div>
);

// Proof-of-concept profit model: toggle premium on/off.
const PremiumPanel = ({ isPremium, onToggle }) => (
  <div className={`premiumPanel${isPremium ? ' premiumPanel--active' : ''}`}>
    <h2 className="sectionTitle">
      {isPremium ? 'Premium Active' : 'Upgrade to Premium'}
    </h2>

    {isPremium ? (
      <ul className="premiumPerks">
        <li>Unlimited move posts</li>
        <li>Premium badge on your profile</li>
        <li>Priority listing in the community feed</li>
        <li>Ad-free experience</li>
      </ul>
    ) : (
      <ul className="premiumPerks premiumPerks--locked">
        <li>Unlimited move posts</li>
        <li>Premium badge on your profile</li>
        <li>Priority listing in the community feed</li>
        <li>Ad-free experience</li>
      </ul>
    )}

    <button
      className={`premiumBtn${isPremium ? ' premiumBtn--cancel' : ''}`}
      onClick={onToggle}
    >
      {isPremium ? 'Cancel Premium' : 'Upgrade — $4.99/month'}
    </button>

    {!isPremium && (
      <p className="premiumNote">
        * A proof-of-concept. No payment information is collected.
      </p>
    )}
  </div>
);

// Users can update their password after verifying their current one.
const ChangePasswordForm = () => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
    e.preventDefault();
    helper.hideError();
    setMessage('');

    const currentPass = e.target.querySelector('#currentPass').value;
    const newPass     = e.target.querySelector('#newPass').value;
    const newPass2    = e.target.querySelector('#newPass2').value;

    if (!currentPass || !newPass || !newPass2) {
        helper.handleError('All fields are required.');
        return false;
    }

    if (newPass !== newPass2) {
        helper.handleError('New passwords do not match.');
        return false;
    }

    // Importing helper 
    helper.sendPost('/changePassword', { currentPass, newPass, newPass2 }, (result) => {
        if (!result.error) {
            setMessage('Password updated successfully.');
            e.target.reset();
        }
    });

    return false;
    };

    //Stole most of this from the login/signup forms... We verify the current password, then update to the new one if it checks out
    return (
    <div className="formSection">
        <h2 className="sectionTitle">Change Password</h2>
        <form className="moveForm" onSubmit={handleSubmit}>

        <div className="formGroup">
            <label htmlFor="currentPass">Current Password</label>
            <input id="currentPass" type="password" name="currentPass" placeholder="Enter current password" />
        </div>

        <div className="formGroup">
            <label htmlFor="newPass">New Password</label>
            <input id="newPass" type="password" name="newPass" placeholder="Enter new password" />
        </div>

        <div className="formGroup">
            <label htmlFor="newPass2">Confirm New Password</label>
            <input id="newPass2" type="password" name="newPass2" placeholder="Retype new password" />
        </div>

        {message && <p className="successMessage">{message}</p>}

        <button className="submitBtn" type="submit">Update Password</button>
        </form>
    </div>
    );
};

//Fetches account info and renders all account panels.
const AccountPage = () => {
  const [account, setAccount] = useState(null);

  const loadAccount = async () => {
    const response = await fetch('/getAccountInfo');
    const data = await response.json();
    if (data.account) setAccount(data.account);
  };

  useEffect(() => { loadAccount(); }, []);

  const handlePremiumToggle = () => {
    helper.sendPost('/togglePremium', {}, (result) => {
      if (result.isPremium !== undefined) {
        setAccount((prev) => ({ ...prev, isPremium: result.isPremium }));
      }
    });
  };

  if (!account) return <p className="feedEmpty">Loading account...</p>;

  return (
    <div className="appContainer">
      <AccountInfo account={account} />
      <div className="accountPanels">
        <PremiumPanel isPremium={account.isPremium} onToggle={handlePremiumToggle} />
        <ChangePasswordForm />
      </div>
    </div>
  );
};

window.onload = () => {
  createRoot(document.getElementById('accountApp')).render(<AccountPage />);
};