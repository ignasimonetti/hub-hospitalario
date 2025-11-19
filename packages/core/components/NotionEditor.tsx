"use client";

import { 
  EditorRoot, 
  EditorContent, 
  JSONContent 
} from "novel";
import { useState } from "react";
// Importamos la extensión oficial de Tiptap
import StarterKit from "@tiptap/starter-kit"; 

// Definimos las extensiones fuera del componente para evitar recrearlas en cada render
const extensions = [
  StarterKit.configure({
    // Aquí puedes configurar opciones si lo necesitas
  }),
];

export const NotionEditor = () => {
  const [content, setContent] = useState<JSONContent | undefined>(undefined);

  return (
    <div className="relative w-full max-w-screen-lg">
      <EditorRoot>
        <EditorContent
          // Pasamos las extensiones aquí
          extensions={extensions} 
          
          initialContent={content}
          onUpdate={({ editor }) => {
            const json = editor.getJSON();
            setContent(json);
          }}
          editorProps={{
             attributes: {
               // Estas clases le dan estilo al texto (h1, h2, p, etc.)
               class: `prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full`,
             }
          }}
          className="relative min-h-[500px] w-full border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg p-4"
        >
        </EditorContent>
      </EditorRoot>
    </div>
  );
};