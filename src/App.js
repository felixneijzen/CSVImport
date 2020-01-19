import React from "react";
import { Uploader } from "./Uploader";
import { RevisionCheck } from "./RevisionCheck";
import { Deleter } from "./Deleter";

export const App = () => {
  return (
    <div id="app">
      <Uploader />
      <RevisionCheck />
      <Deleter />
    </div>
  );
};
