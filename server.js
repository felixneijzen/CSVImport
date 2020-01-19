const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const streamifier = require("streamifier");
const fs = require("fs");
const app = express();
var couchimport = require("couchimport");
const port = process.env.PORT || 3001;
const urlDB = "http://localhost:5984";
var cors = require("cors");

app.use(cors());

const errHandler = err => {
  if (err) return res.status(500).send(err);
};

app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    createParentPath: true
  })
);

app.use(express.static(path.join(__dirname, "build")));
app.post("/import/:file/:db", function(req, res) {
  const dbName = req.params.db;
  const fileName = req.params.file;
  const file = req.files[fileName];
  const opts = { delimiter: ",", url: urlDB, database: dbName };

  file.mv(file.name, err => {
    errHandler(err);

    couchimport.importFile(file.name, opts, function(err, data) {
      fs.unlink(file.name, errHandler);
      res.json(null);
    });
  });
});

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
