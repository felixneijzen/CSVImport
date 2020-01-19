import React, { useState } from "react";
import spinner from "./spinner.gif";
import axios from "axios";
import PouchDB from "pouchdb";

const URL_SERVER = "http://localhost:3001/import";
const URL_DATABS = "http://localhost:5984/";

export const Uploader = () => {
  const [file, setFile] = useState();
  const [columns, setColumns] = useState([]);
  const [results, setResults] = useState("No results yet");
  const [fileName, setFileName] = useState();
  const [dbName, setDbName] = useState();
  const [loading, setLoading] = useState(false);

  const onFileChange = e => {
    const fileObject = e.target.files[0];
    setFileName(fileObject.name);
    setFile(fileObject);

    const reader = new FileReader();
    reader.onload = () => {
      setColumns(reader.result.split("\n")[0].split(","));
    };

    reader.readAsText(fileObject);
  };

  const saveDBResults = info => {
    const dateTime = new Date();
    const currTime = dateTime.toLocaleString();
    const rows = info.doc_count;
    const dims = rows + " x " + columns.length;
    const infoStr =
      `Last upload: ${currTime}\n` +
      `File:${fileName}\n` +
      `Name:${info.db_name}\n` +
      `Dimensions: ${dims}\n\n` +
      "Upload successful.";

    setResults(infoStr);
  };

  const getDBResults = data => {
    setFileName("");
    setLoading(false);

    if (data.status === 200) {
      let db = new PouchDB(URL_DATABS + dbName);
      db.info().then(saveDBResults);
    } else {
      saveDBResults("No database information available");
    }
  };

  const handleError = err => console.error(err);

  const submitFile = async () => {
    const url = `${URL_SERVER}/${fileName}/${dbName}`;
    try {
      let formData = new FormData();
      formData.append(fileName, file);

      await new PouchDB(URL_DATABS + dbName).destroy();
      await new PouchDB(URL_DATABS + dbName).info();
      console.log(url);
      setLoading(true);

      axios
        .post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        })
        .then(getDBResults)
        .catch(handleError);
    } catch (err) {}
  };

  return (
    <div id="uploader">
      <form>
        <input type="file" onChange={onFileChange} />
        <br />
        <label htmlFor="dbname">DB name:</label>
        <br />
        <input
          name="dbname"
          type="text"
          value={dbName}
          onChange={e => {
            setDbName(e.target.value);
          }}
        />
        <br />
        <input type="button" value="Submit" onClick={submitFile} />
      </form>
      {loading ? (
        <img className="spinner" alt="wait..." src={spinner} />
      ) : (
        <pre id="results">{results}</pre>
      )}
    </div>
  );
};
