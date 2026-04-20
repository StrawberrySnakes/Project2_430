// Account.js controller - This is the controller for our Account documents
// Keep basic login functionality 
const models = require('../models');
const Account = models.Account;

const loginPage = (req, res) => {
  return res.render('login');
};

const accountPage = (req, res) => res.render('account');

 
const logout = (req, res) => {
    req.session.destroy();
    return res.redirect('/');
};

const login = (req, res) => {
    const username = `${req.body.username}`;
    const pass = `${req.body.pass}`;

    if (!username || !pass) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    return Account.authenticate(username, pass, (err, account) => {
        if (err || !account) {
            return res.status(401).json({ error: 'Wrong username or password' });
        }

        req.session.account = Account.toAPI(account);

        return res.json({ redirect: '/app' });
    });
};

const signup = async(req, res) => {
    const username = `${req.body.username}`;
    const pass = `${req.body.pass}`;
    const pass2 = `${req.body.pass2}`;

    if (!username || !pass || !pass2) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if(pass !== pass2) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
        const hash = await Account.generateHash(pass);
        const newAccount = new Account({ username, password: hash });
        await newAccount.save();
        req.session.account = Account.toAPI(newAccount);
        return res.json({ redirect: '/app' });
    } catch (err) {
        console.log(err);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Username already in use.' });
        }
        return res.status(500).json({ error: 'An error occurred.' });
    }
};

// Returns the user's account info, including username, premium status
const changePassword = async (req, res) => {
  const { currentPass, newPass, newPass2 } = req.body;

  if (!currentPass || !newPass || !newPass2) { return res.status(400).json({ error: 'All fields are required.' });}
  if (newPass !== newPass2) { return res.status(400).json({ error: 'New passwords do not match.' });}
  if (newPass.length < 6) { return res.status(400).json({ error: 'New password must be at least 6 characters.' });}

  try {
    const account = await Account.findById(req.session.account._id).exec();
    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const match = await account.constructor.generateHash(currentPass)
      .then(() => require('bcrypt').compare(currentPass, account.password));

    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hash = await Account.generateHash(newPass);
    await Account.findByIdAndUpdate(req.session.account._id, { password: hash });

    return res.json({ message: 'Password updated successfully.' });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'An error occurred.' });
  }
};

//Returns the user's account info
const getAccountInfo = async (req, res) => {
  try {
    const account = await Account.findById(req.session.account._id)
      .select('username isPremium createdDate').lean().exec();

    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    return res.json({ account });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'An error occurred.' });
  }
};

//Toggles the premium flag on the user's account. 
const togglePremium = async (req, res) => {

  try {
    const account = await Account.findById(req.session.account._id).exec();
    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    account.isPremium = !account.isPremium;
    await account.save();

    req.session.account = Account.toAPI(account);
    return res.json({ isPremium: account.isPremium });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'An error occurred.' });
  }
};

module.exports = {
  loginPage,
  accountPage,
  logout,
  login,
  signup,
  changePassword,
  getAccountInfo,
  togglePremium,
};