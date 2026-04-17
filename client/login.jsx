//login.jsx client
// Keep the login functionality and the signup functionality.
//  Will change the style and layout of the page but will keep the basic structure of the login and signup forms. 
// Will also keep the error handling for the forms. Will also keep the helper functions for sending post requests and handling errors.
const helper = require('./helper.js');
const React = require('react');
const { createRoot } = require('react-dom/client');

const handleLogin = (e) => {
  e.preventDefault();
  helper.hideError();

  const username = e.target.querySelector('#user').value;
  const pass = e.target.querySelector('#pass').value;

  if (!username || !pass) {
    helper.handleError('Username and password are required.');
    return false;
  }

  helper.sendPost(e.target.action, { username, pass });
  return false;
};

const handleSignup = (e) => {
  e.preventDefault();
  helper.hideError();

  const username = e.target.querySelector('#user').value;
  const pass = e.target.querySelector('#pass').value;
  const pass2 = e.target.querySelector('#pass2').value;

  if (!username || !pass || !pass2) {
    helper.handleError('All fields are required.');
    return false;
  }

  if (pass !== pass2) {
    helper.handleError('Passwords do not match.');
    return false;
  }

  helper.sendPost(e.target.action, { username, pass, pass2 });
  return false;
};

const LoginWindow = () => (
  <form
    id="loginForm"
    name="loginForm"
    onSubmit={handleLogin}
    action="/login"
    method="POST"
    className="authForm"
  >
    <label htmlFor="user">Username</label>
    <input id="user" type="text" name="username" placeholder="Enter your username" />

    <label htmlFor="pass">Password</label>
    <input id="pass" type="password" name="pass" placeholder="Enter your password" />

    <input className="authSubmit" type="submit" value="Sign In" />
  </form>
);

const SignupWindow = () => (
  <form
    id="signupForm"
    name="signupForm"
    onSubmit={handleSignup}
    action="/signup"
    method="POST"
    className="authForm"
  >
    <label htmlFor="user">Username</label>
    <input id="user" type="text" name="username" placeholder="Choose a username" />

    <label htmlFor="pass">Password</label>
    <input id="pass" type="password" name="pass" placeholder="Choose a password" />

    <label htmlFor="pass2">Confirm Password</label>
    <input id="pass2" type="password" name="pass2" placeholder="Retype your password" />

    <input className="authSubmit" type="submit" value="Create Account" />
  </form>
);

const init = () => {
  const loginButton = document.getElementById('loginButton');
  const signupButton = document.getElementById('signupButton');

  const root = createRoot(document.getElementById('content'));

  loginButton.addEventListener('click', (e) => {
    e.preventDefault();
    root.render(<LoginWindow />);
  });

  signupButton.addEventListener('click', (e) => {
    e.preventDefault();
    root.render(<SignupWindow />);
  });

  root.render(<LoginWindow />);
};

window.onload = init;