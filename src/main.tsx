import React from "react";
import ReactDOM from "react-dom/client";

import App from "./app/App";
import { GoalsLauncher } from "./app/components/GoalsLauncher";
import { GameSystems } from "./app/components/GameSystems";

import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <GoalsLauncher />
    <GameSystems />
  </React.StrictMode>
);
