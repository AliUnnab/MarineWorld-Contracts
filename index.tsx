
// Polyfill to solve the Turkish 'I'/'İ' capitalization issues globally across the system
String.prototype.toUpperCase = function (this: string) {
  return this.toLocaleUpperCase("en-US");
};

String.prototype.toLowerCase = function (this: string) {
  return this.toLocaleLowerCase("en-US");
};

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
