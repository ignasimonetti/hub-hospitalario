"use client";

import { 
  EditorRoot, 
  EditorContent, 
  JSONContent 
} from "novel";
// 1. Importa las extensiones por defecto
import { defaultExtensions } from "novel/extensions"; 
import { useState } from "react";

export const NotionEditor = () => {
  const [content, setContent] = useState<JSONContent | undefined>(undefined);

  return (
    <div className="relative w-full max-w-screen-lg">
      <EditorRoot>
        <EditorContent
          // 2. Agrega esta propiedad obligatoria
          extensions={defaultExtensions} 
          
          initialContent={content}
          onUpdate={({ editor }) => {
            const json = editor.getJSON();
            setContent(json);
          }}
          editorProps={{
             attributes: {
               class: `prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full`,
             }
          }}
          className="relative min-h-[500px] w-full border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg p-4"
        >
          {/* Aquí podrías agregar los menús de comandos más adelante */}
        </EditorContent>
      </EditorRoot>
    </div>
  );
};