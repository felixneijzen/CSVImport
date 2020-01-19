import React, { useState, useEffect } from "react";
import Axios from "axios";

const URL_DATABS = "http://localhost:5984/";
const PROGRESS_SIZE = 30;
const BUSY_CHAR = "▤";
const IDLE_CHAR = "▢";

export const RevisionCheck = () => {
  const [dbs, setDbs] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [progress, setProgress] = useState(0);
  const [progressMax, setProgressMax] = useState(null);

  const getDbs = () => {
    Axios.get(URL_DATABS + "_all_dbs").then(res => {
      setDbs(res.data.filter(db => db[0] !== "_"));
    });
  };

  const getData = doc =>
    Object.keys(doc)
      .filter(key => key[0] !== "_")
      .reduce((obj, key) => {
        obj[key] = doc[key];
        return obj;
      }, {});

  const extractDiffs = (older, newer, id) => {
    const diffs = Object.keys(newer).filter(key => {
      const newerVal = newer[key];
      if (!newerVal || !newerVal.join) {
        return older[key] !== newerVal;
      } else {
        return older[key].join("") !== newerVal.join("");
      }
    });

    return diffs.map(field => ({
      id,
      field,
      from: older[field],
      to: newer[field]
    }));
  };

  const extractRevisions = async (db, res) => {
    const allIds = res.data.rows.map(row => row.id);
    setProgressMax(allIds.length);
    let revs = [],
      id,
      rev,
      index = 0;

    for (id of allIds) {
      const historyQuery = `${URL_DATABS}${db}/${id}?revs_info=true`;
      const history = await Axios.get(historyQuery);

      index++;
      setProgress(index);
      let curDoc = getData(history.data);

      if (history.data._revs_info.length < 2) {
        continue;
      }

      const available = history.data._revs_info
        .filter(rev => rev.status === "available")
        .map(rev => rev.rev);

      if (available < 2) {
        continue;
      }

      for (rev of available) {
        const revQuery = `${URL_DATABS}${db}/${id}?rev=${rev}`;
        const revDocFull = await Axios.get(revQuery);
        const revDoc = getData(revDocFull.data);
        const diffs = extractDiffs(revDoc, curDoc, revDocFull.data._id);

        if (diffs.length > 0) {
          revs = revs.concat(diffs);
        }

        curDoc = revDoc;
      }
    }

    setRevisions(revs);

    setProgress(0);
  };

  const getRevisions = e => {
    const db = e.target.value;
    Axios.get(URL_DATABS + db + "/_all_docs").then(res => {
      extractRevisions(db, res);
    });
  };

  const calcProgress = () => {
    const relProgress = progress / progressMax;

    const progressString =
      BUSY_CHAR.repeat(Math.round(PROGRESS_SIZE * relProgress)) +
      IDLE_CHAR.repeat(Math.round(PROGRESS_SIZE - PROGRESS_SIZE * relProgress));

    return progressString;
  };

  const dbMapper = db => <option>{db}</option>;
  const revMapper = rev => (
    <li>
      <pre>
        {`For ${rev.id}\n` +
          `change in ${rev.field}\n` +
          `${rev.from} => ${rev.to}\n`}
      </pre>
    </li>
  );

  useEffect(getDbs);

  return (
    <div id="reviewer">
      <select id="dbs" onChange={getRevisions}>
        <option disabled selected value="">
          -- Select a DB --
        </option>
        {dbs.map(dbMapper)}
      </select>
      <p>Revisions:</p>
      {progress > 0 ? (
        <pre className="progress">{calcProgress()}</pre>
      ) : (
        <ul>{revisions.map(revMapper)}</ul>
      )}
    </div>
  );
};
