import React, { useState, useEffect } from "react";
import Axios from "axios";

const URL_DATABS = "http://localhost:5984/";
const PROGRESS_SIZE = 30;
const BUSY_CHAR = "▤";
const IDLE_CHAR = "▢";

export const Deleter = () => {
  const [dbs, setDbs] = useState([]);
  const [selectedDb, setselectedDb] = useState([]);

  const getDbs = () => {
    Axios.get(URL_DATABS + "_all_dbs").then(res => {
      setDbs(res.data.filter(db => db[0] !== "_"));
    });
  };

  const getRevisions = e => {
    setselectedDb(e.target.value);
  };

  const deleteDatabase = () => {
    Axios.delete(URL_DATABS + selectedDb).then(getDbs);
  };

  const dbMapper = db => <option>{db}</option>;

  useEffect(getDbs);

  return (
    <div id="reviewer">
      <select id="dbs" onChange={getRevisions}>
        <option disabled selected value="">
          -- Select a DB --
        </option>
        {dbs.map(dbMapper)}
      </select>
      <br />
      <input type="button" value="Delete database" onClick={deleteDatabase} />
    </div>
  );
};
