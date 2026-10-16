import React from "react";
import { createRoot } from "react-dom/client";
import { LessonApp } from "./LessonApp";
import { lesson } from "./lesson-data";
import "./styles.css";
import "./lesson-extras.css";

const illustrations = import.meta.glob("./assets/illustrations/*.png", { eager: true, query: "?url", import: "default" });
const imageFor = (name) => illustrations[`./assets/illustrations/${name}.png`];

createRoot(document.getElementById("root")).render(<LessonApp lesson={lesson} imageFor={imageFor} />);
