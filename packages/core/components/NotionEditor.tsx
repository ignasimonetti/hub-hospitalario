"use client";

import { 
  EditorRoot, 
  EditorContent, 
  EditorCommand, 
  EditorCommandItem,
  EditorBubble,
  EditorBubbleItem,
  JSONContent
} from "novel";
import { useState } from "react";

export const NotionEditor = () => {
  const [content, setContent] = useState<JSONContent | undefined>(undefined);

  return (
    <div className="relative w-full max-w-screen-lg">
      <EditorRoot>
        <EditorContent
          initialContent={content}
          onUpdate={({ editor }) => {
            const json = editor.getJSON();
            setContent(json);
          }}
          className="relative min-h-[500px] w-full border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg p-4"
        >
           {/* Aquí puedes agregar menús flotantes si los necesitas, 
               si no, puedes dejar EditorContent solo, pero la librería 
               recomienda tener al menos el Root y Content */}
        </EditorContent>
      </EditorRoot>
    </div>
  );
};