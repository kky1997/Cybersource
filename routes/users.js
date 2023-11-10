var express = require('express');
// File upload
const multer = require('multer');
const { rethrow } = require('jade/lib/runtime');
var router = express.Router();
var path = require('path');

// For file analysis
const { OpenAI } = require("openai");

const openai = new OpenAI({
    apiKey: "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"
});

const WordExtractor = require("word-extractor");
const extractor = new WordExtractor();

const { PDFLoader } = require("langchain/document_loaders/fs/pdf");

//Assure only pdf and docx are uploaded
const checkFileType = function (file, cb) {
  //Allowed file extensions
  const fileTypes = /pdf|docx|doc|afb/;

  //check extension names
  const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());

  const mimeType = fileTypes.test(file.mimetype);

  if (mimeType && extName) {
    return cb(null, true);
  } else {
    cb("Error: File not a PDF or DOCX document");
  }
};


//setting storage engine
const storageEngine = multer.diskStorage ({
  destination: "/workspaces/attackflow_14pg/public/uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}--${file.originalname}`);
  }
});

//initializing multer
const upload = multer({
  storage: storageEngine,
  limits: { filesize: 5000000 },
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.use('/', function(req, res, next) {
  if (!(req.session.user_id)){
      res.sendStatus(403);
  } else {
      next();
  }
});



router.post("/upload/document", upload.single("incidentAttachment"), (req, res, next) => {
  if (req.file) {
    // Save the file path or filename in the SQL database
    let imagePath = req.file.path.replace('/workspaces/attackflow_14pg/public', '');

    req.pool.getConnection(function(cerr, connection) {
      if (cerr) {
        res.sendStatus(500);
        return;
      }

      // Update the last entry in the database
      let query = 'UPDATE Incidents SET attachment_path = ? ORDER BY id DESC LIMIT 1';

      connection.query(query, [imagePath], function(qerr, result) {
        connection.release();

        if (qerr) {
          res.sendStatus(500);
          return;
        }

        res.sendStatus(200);
      });
    });
  } else {
    res.status(400).send("Please upload a valid file");
  }
});

router.post("/upload/attackflow", upload.single("attackflowFile"), (req, res, next) => {
  if (req.file) {
    // Save the file path or filename in the SQL database
    let filePath = req.file.path.replace('/workspaces/attackflow_14pg/public', '');

    req.pool.getConnection(function(cerr, connection) {
      if (cerr) {
        res.sendStatus(500);
        return;
      }

      // Update the last entry in the database
      let query = 'UPDATE Incidents SET attackFlow_path = ? ORDER BY id DESC LIMIT 1';

      connection.query(query, [filePath], function(qerr, result) {
        connection.release();

        if (qerr) {
          res.sendStatus(500);
          return;
        }

        res.sendStatus(200);
      });
    });
  } else {
    res.status(400).send("Please upload a valid file");
  }
});


router.get('/incidents', function(req,res,next) {
    req.pool.getConnection(function(cerr, connection) {
        if (cerr) {
          res.sendStatus(500);
          return;
        }

        let query = "";

        if(req.query.searchTerm) {
            query = `SELECT Incidents.id, Incidents.version_number AS version, Incidents.date_reported AS dateReported, Incidents.brief_description AS briefDescription, Incidents.current_status, Users.first_name, Users.family_name FROM Incidents
            LEFT JOIN Users ON Incidents.reported_by = Users.id
            WHERE Incidents.current_status = ? AND Incidents.brief_description LIKE '%${req.query.searchTerm}%' AND Incidents.latest_version = 1`;
        } else {
            query = `SELECT Incidents.id, Incidents.version_number AS version, Incidents.date_reported AS dateReported, Incidents.brief_description AS briefDescription, Incidents.current_status, Users.first_name, Users.family_name FROM Incidents
            LEFT JOIN Users ON Incidents.reported_by = Users.id
            WHERE Incidents.current_status = ? AND Incidents.latest_version = 1;`;
        }

        connection.query(query, [Number(req.query.status)], function(qerr, rows, fields) {
            connection.release();

            if (qerr) {
              res.sendStatus(500);
              return;
            }
            res.send(JSON.stringify(rows));
        });
    });
});

router.get('/incident/:id', function(req,res,next) {
    req.pool.getConnection(function(cerr, connection) {
        if (cerr) {
          res.sendStatus(500);
          return;
        }

        const query = `SELECT Incidents.id, Incidents.version_number AS version, Incidents.date_reported AS dateReported, Incidents.brief_description AS briefDescription, Incidents.current_status, Incidents.attachment_path, Incidents.attackers, Incidents.authors, Incidents.targets, Incidents.dateAttack, Incidents.summary, Incidents.attackflow_json, Users.first_name, Users.family_name FROM Incidents
        LEFT JOIN Users ON Incidents.reported_by = Users.id
        WHERE Incidents.id = ? AND Incidents.version_number = ?;`;

        connection.query(query, [req.params.id, req.query.version], function(qerr, rows, fields) {
            connection.release();

            if (qerr) {
              res.sendStatus(500);
              return;
            }
            res.send(rows);
        });
    });
});

router.get('/incidents/approval/number', function(req,res,next) {
    req.pool.getConnection(function(cerr, connection) {
        if (cerr) {
          res.sendStatus(500);
          return;
        }

        const query = `SELECT Count(*) AS total FROM Incidents WHERE Incidents.current_status = 1 AND Incidents.latest_version = 1;`;

        connection.query(query, function(qerr, rows, fields) {
            connection.release();

            if (qerr) {
              res.sendStatus(500);
              return;
            }
            res.send(rows[0]);
        });
    });
});

router.post('/incidents', function(req,res,next){
    req.pool.getConnection(function(cerr, connection) {
        if (cerr) {
          res.sendStatus(500);
          return;
        }

        let query = "";
        let parameters = [];
        if (Number(req.body.id) == -1) {
            query = `INSERT INTO Incidents (version_number, latest_version, date_reported, brief_description, reported_by, current_status) VALUES (1, 1, ?, ?, ?, 1);`;

            parameters = [req.body.dateReported, req.body.briefDescription, req.session.user_id];
        } else {
            query = `BEGIN;
            UPDATE Incidents SET latest_version = 2 WHERE id = ? AND latest_version = 1;
            INSERT INTO Incidents (id, version_number, latest_version, date_reported, brief_description, reported_by, current_status, attachment_path) VALUES (?, ?, 1, ?, ?, ?, 1, ?);
            COMMIT;`;

            parameters = [req.body.id, req.body.id, req.body.version + 1, req.body.dateReported, req.body.briefDescription, req.session.user_id, req.body.attachmentPath];
        }

        connection.query(query, parameters, function(qerr, rows, fields) {
          connection.release();

          if (qerr) {
            res.sendStatus(500);
            console.log(qerr);
            return;
          }
          res.send(`${rows.insertId}`);
      });
    });
});

router.get('/incidents/annotation/:id', function(req,res,next){
  req.pool.getConnection(function (cerr, connection) {
    if (cerr) {
      res.sendStatus(500);
      return;
    }

    const query = `SELECT Incidents.attachment_path FROM Incidents
    WHERE Incidents.id = ? AND Incidents.version_number = ?;`;
    const parameters = [req.params.id, req.query.version];

    connection.query(query, parameters, async function(qerr, rows, fields) {
      connection.release();

      if (qerr) {
        res.sendStatus(500);
        console.log(qerr);
        return;
      }

      let attachmentPath = rows[0].attachment_path;
      let documentText = "";

      if (attachmentPath.endsWith(".docx") || attachmentPath.endsWith(".doc")) {
        const extracted = await extractor.extract(`/workspaces/attackflow_14pg/public${attachmentPath}`);
        documentText = extracted.getBody();
      } else if (attachmentPath.endsWith(".pdf")) {
        const loader = await new PDFLoader(`/workspaces/attackflow_14pg/public${attachmentPath}`, {
          splitPages: false,
        });
        let pdfText = await loader.load();
        documentText = pdfText[0].pageContent.replace(/(\r\n|\n|\r)/gm, "");
      } else {
        res.sendStatus(500);
      }

      const chatCompletion = await openai.chat.completions.create({
        messages: [
            { role: "user", content: "I am building an attackflow for a cybersecurity incident and I need your help. I need you to create JSON with the following information which you will extract from a document I will send to you. ONLY SEND THE JSON DO NOT SEND ANYTHING ELSE." },
            { role: "user", content: "The first key is 'dateAttack' and you will give it the value of the date of attack from the document. The date should be in the format dd/mm/yyyy." },
            { role: "user", content: "The second key is 'targets' and you will give it the value of the target of the attack from the document. If you cannot find the target please respond with unknown." },
            { role: "user", content: "The third key is 'attackers' and you will give it the value of the attacker of the attack from the document. If you cannot find the attacker please respond with unknown." },
            { role: "user", content: "The fourth key is 'authors' and you will give it the value of the author of the the document. If you cannot find the author please respond with unknown." },
            { role: "user", content: "The fifth key is 'summary' and you will give it the value of a summary of the document. If you cannot find summary please respond with unknown." },
            { role: "user", content: "I will now send you the document as text and you will respond with the JSON as mentioned above"},
            { role: "user", content: documentText},
        ],
        model: "gpt-3.5-turbo",
      });

      res.send(chatCompletion.choices[0].message.content);
    });
  });
});

router.get('/incidents/diagram/:id', function(req,res,next){
  req.pool.getConnection(function (cerr, connection) {
    if (cerr) {
      res.sendStatus(500);
      return;
    }

    const query = `SELECT Incidents.attachment_path FROM Incidents
    WHERE Incidents.id = ? AND Incidents.version_number = ?;`;
    const parameters = [req.params.id, req.query.version];

    connection.query(query, parameters, async function(qerr, rows, fields) {
      connection.release();

      if (qerr) {
        res.sendStatus(500);
        console.log(qerr);
        return;
      }

      let attachmentPath = rows[0].attachment_path;
      let documentText = "";

      if (attachmentPath.endsWith(".docx") || attachmentPath.endsWith(".doc")) {
        const extracted = await extractor.extract(`/workspaces/attackflow_14pg/public${attachmentPath}`);
        documentText = extracted.getBody();
      } else if (attachmentPath.endsWith(".pdf")) {
        const loader = await new PDFLoader(`/workspaces/attackflow_14pg/public${attachmentPath}`, {
          splitPages: false,
        });
        let pdfText = await loader.load();
        documentText = pdfText[0].pageContent.replace(/(\r\n|\n|\r)/gm, "");
      } else {
        res.sendStatus(500);
      }

      const chatCompletion = await openai.chat.completions.create({
        messages: [
            { role: "user", content: `I am building an attackflow for a cybersecurity incident and I need your help. You should know what the attackflow project is from MITRE. The diagram tool I am using is by mindfusion and as such I need you to create a JSON string which comprises of a key called 'nodes' that is an array  of objects and a key called 'links' that is an array of objects. And example of this is as follows: {"nodes":[{"id":0,"name":"start"}, {"id":1,"name":"activity 1"}, {"id":2,"name":"task 1"}, {"id":3,"name":"task 2"}, {"id":4,"name":"activity 2"}, {"id":5,"name":"task 3"}, "id":6,"name":"task 4"}, {"id":7,"name":"activity 3"}, {"id":8,"name":"task 5"}, {"id":9,"name":"task 6"}, {"id":10,"name":"end"}],"links":[{"origin":0,"target":1},{"origin":1,"target":2},{"origin":1,"target":3},{"origin":2,"target":4},{"origin":3,"target":4},{"origin":4,"target":5},{"origin":4,"target":6},{"origin":5,"target":10},{"origin":6,"target":10},{"origin":0,"target":7},{"origin":7,"target":8},{"origin":8,"target":9},{"origin":2,"target":8},{"origin":9,"target":10}]}; The node objects should be comprised of an 'id' key with the object at the start of the attackflow having the lowest number and a key called Name which is the name of the step in the attackflow. The links object should have two keys 'origin' which is the node from the node array my attackflow arrow starts in and 'target' which is where my arrow is pointing to.` },
            { role: "user", content: `Each Node should be an attackobject (Something that happened i.e. a step in the process of the cybersecurity attack) in the attackflow project from MITRE and each link (There can be more than one) should point to the next attack object in the sequence of events. For example if my incident was about someone sending a phishing email which has steps 1. send email 2. User clicks on malicious link 3. User's details are stolen the response from you would be {"nodes":[{"id":0,"name":"Attacker sends email"}, {"id":1,"name":"Recipient opens and clicks on malicious link"}, {"id":2,"name":"Recipients details are stolen"}],"links":[{"origin":0,"target":1},{"origin":1,"target":2}]. A node should not be solely showing the date of the attack or attacker name. It should be an action taken eg. the attacker did this`},
            { role: "user", content: "I will now send you the document as text and you will respond with the JSON string as mentioned above which comprises of the nodes and links arrays only"},
            { role: "user", content: documentText}
        ],
        model: "gpt-3.5-turbo",
      });

      res.send(chatCompletion.choices[0].message.content);
    });
  });
});

router.post('/incidents/annotation', function(req,res,next){
  req.pool.getConnection(function(cerr, connection) {
      if (cerr) {
        res.sendStatus(500);
        return;
      }

      const query = `UPDATE Incidents SET dateAttack = ?, authors = ?, attackers = ?, targets = ?, summary = ? WHERE id = ? AND version_number = ?;`;
      const parameters = [req.body.dateAttack, req.body.authors, req.body.attackers, req.body.targets, req.body.summary, req.body.id, req.body.version];
      connection.query(query, parameters, function(qerr, rows, fields) {
        connection.release();

        if (qerr) {
          res.sendStatus(500);
          console.log(qerr);
          return;
        }
        res.send();
    });
  });
});

router.post('/incidents/attackflow', function(req,res,next){
  req.pool.getConnection(function(cerr, connection) {
      if (cerr) {
        res.sendStatus(500);
        return;
      }

      const query = `UPDATE Incidents SET attackflow_json = ? WHERE id = ? AND version_number = ?;`;
      const parameters = [JSON.stringify(req.body.attackflow_json), req.body.id, req.body.version];
      connection.query(query, parameters, function(qerr, rows, fields) {
        connection.release();

        if (qerr) {
          res.sendStatus(500);
          console.log(qerr);
          return;
        }
        res.send();
    });
  });
});

router.post('/approveIncident', function(req, res, next) {
  const incidentId = req.body.incidentId;

  req.pool.getConnection(function(err, connection) {
    if (err) {
      res.sendStatus(500);
      return;
    }

    let query = "UPDATE Incidents SET current_status = 'Approved' WHERE id = ?"; //update Incident status to Approved

    connection.query(query, [incidentId], function(error, results, fields) {
      connection.release();

      if (error) {
        res.sendStatus(500);
        return;
      }

      res.sendStatus(200);  // success
    });
  });
});

router.post('/rejectIncident', function(req, res, next) {
  const incidentId = req.body.incidentId;

  req.pool.getConnection(function(err, connection) {
    if (err) {
      res.sendStatus(500);
      return;
    }

    let query = "DELETE FROM Incidents WHERE id = ?"; //delete rejected Incident from table

    connection.query(query, [incidentId], function(error, results, fields) {
      connection.release();

      if (error) {
        res.sendStatus(500);
        return;
      }

      res.sendStatus(200);  // success
    });
  });
});

router.get('/getDocument', function(req, res, next) {
  req.pool.getConnection(function (cerr, connection) {
    if (cerr) {
      res.sendStatus(500);
      return;
    }

    let query = 'SELECT attachment_path FROM Incidents ORDER BY id DESC LIMIT 1';

    connection.query(query, function(qerr, rows, fields) {
      connection.release();

      if (qerr) {
        res.sendStatus(500);
        return;
      }

      let documentPath = rows;

      res.json([documentPath]);
    });
  });
});

module.exports = router;
