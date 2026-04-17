// client/app.jsx start

const React = require('react');
const { createRoot } = require('react-dom/client');

const App = () => (
  <div className="appPlaceholder">
    <h1>LRDC Archive</h1>
    <p>App is loading — components coming soon.</p>
  </div>
);

window.onload = () => {
  createRoot(document.getElementById('app')).render(<App />);
};