var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//temp user credentials
let users = {
  'bob@email.com': {password: 'password', id: 1},
  'alice@email.com': {password: 'foobar', id: 2}
};

//login route handler
router.post('/login', function(req,res,next){
  if ('username' in req.body && 'password' in req.body) {

    req.pool.getConnection(function(cerr, connection) {
      if (cerr) {
        res.sendStatus(500);
        return;
      }

      let query = "SELECT id, email, role FROM Users WHERE email = ? AND passwords = ?";

      connection.query(query, [req.body.username,req.body.password],function(qerr, rows, fields) {

        connection.release();

        if (qerr) {
          res.sendStatus(500);
          return;
        }

        console.log(JSON.stringify(rows));

        if (rows.length > 0){
          // There is a user
          //[req.session.user] = rows;
          //res.json(req.session.user);

          req.session.username = req.body.username;
          req.session.user_id = rows[0].id; //attach id from database to user session.
          req.session.role = rows[0].role;
          console.log("name: ", req.session.username);
          console.log("id: ",req.session.user_id);
          console.log("role: ", req.session.role);

          //res.end();

          res.json({ role: req.session.role}); //send role back as respone to AJAX

        } else {
          // No user
          res.sendStatus(401);
        }

      });

    });

  } else {
    res.sendStatus(401);
  }

});

router.post('/signup', function(req,res,next){

  if ('email' in req.body && 'password' in req.body) {

    req.pool.getConnection(function(cerr, connection) {
      if (cerr) {
        res.sendStatus(500);
        return;
      }

      let query = `INSERT INTO Users (
                    email,
                    passwords,
                    role,
                    first_name,
                    family_name
                ) VALUES (
                    ?,
                    ?,
                    'Read',
                    ?,
                    ?
                );`;
      connection.query(query, [req.body.email, req.body.password, req.body.firstName, req.body.lastName],function(qerr, rows, fields) {

        connection.release();

        if (qerr) {
          console.log(qerr);
          res.sendStatus(500);
          return;
        }
        res.end();
      });

    });

  } else {
    res.sendStatus(401);
  }

});

router.post('/logout', function(req,res,next){

  if ('username' in req.session){
    delete req.session.username;
    delete req.session.user_id;
    res.end();
  } else {
    res.sendStatus(403);
  }

});

module.exports = router;