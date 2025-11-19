"use client";

import React from "react";
import { Editor } from "novel";
import "novel/dist/styles.css"; // Revertido a styles.css

export const NotionEditor = () => {
  return (
    <div className="relative min-h-[500px] w-full max-w-screen-lg border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg">
      <Editor
        className="relative min-h-[500px] w-full max-w-screen-lg"
        defaultValue={{
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Bienvenido al Canvas del Dashboard" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Aquí puedes empezar a escribir y organizar tu información como en Notion." }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Intenta escribir '/' para ver los comandos." }],
            },
          ],
        }}
        disableLocalStorage={true} // Podemos gestionar el almacenamiento nosotros mismos más tarde
      />
    </div>
  );
};