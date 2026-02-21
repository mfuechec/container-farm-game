import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ContainerFarm from "../container-farm.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ContainerFarm />
  </StrictMode>
);
