// router.js - this is where we define our routes for our application

const controllers = require('./controllers');
const mid = require('./middleware');
const { upload, processUpload } = require('./middleware/upload');


const router = (app) => {
  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);

  app.get('/account', mid.requiresLogin, controllers.Account.accountPage);
  app.get('/getAccountInfo', mid.requiresLogin, controllers.Account.getAccountInfo);
  app.post('/changePassword', mid.requiresLogin, controllers.Account.changePassword);
  app.post('/togglePremium', mid.requiresLogin, controllers.Account.togglePremium);


  app.get('/app', mid.requiresLogin, controllers.DanceMove.appPage);

  // Dance move routes
  app.post('/createMove',  mid.requiresLogin, upload.single('media'), processUpload, controllers.DanceMove.createMove);
  app.get('/getMoves', mid.requiresLogin, controllers.DanceMove.getMoves);
  app.get('/getPublicMoves', mid.requiresLogin, controllers.DanceMove.getPublicMoves);
  app.post('/deleteMove', mid.requiresLogin, controllers.DanceMove.deleteMove);

  // Event routes
  app.get('/events', mid.requiresLogin, controllers.Events.eventPage);
  
  app.post('/createEvent', mid.requiresLogin, upload.single('media'), processUpload, controllers.Events.createEvent);
  app.get('/getEvents', mid.requiresLogin, controllers.Events.getEvents);
  app.get('/getPublicEvents', mid.requiresLogin, controllers.Events.getPublicEvents);
  app.post('/deleteEvent', mid.requiresLogin, controllers.Events.deleteEvent);

  app.get('/api/venues', mid.requiresLogin, controllers.Events.getNearbyVenues);


  app.use((req, res) => res.status(404).render('404'));
};

module.exports = router;