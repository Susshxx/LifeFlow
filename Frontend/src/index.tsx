// import './index.css';
// import React from "react";
// import { render } from "react-dom";
// import 'leaflet/dist/leaflet.css';
// import { App } from "./App";
// render(<App />, document.getElementById("root"));

// import './index.css';
// import React from "react";
// import { render } from "react-dom";
// import 'leaflet/dist/leaflet.css';
// import { App } from "./App";
// render(<App />, document.getElementById("root"));

import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import { App } from './App';
 
const container = document.getElementById('root')!;
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
 