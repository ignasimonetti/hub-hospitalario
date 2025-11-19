"use client";

import { 
  EditorRoot, 
  EditorContent, 
  EditorBubble, 
  EditorBubbleItem, 
  JSONContent 
} from "novel";
import { useState } from "react";
import StarterKit from "@tiptap/starter-kit"; 

const extensions = [
  StarterKit,
];

export const NotionEditor = () => {
  const [content, setContent] = useState<JSONContent | undefined>(undefined);

  return (
    <div className="relative w-full max-w-screen-lg">
      <EditorRoot>
        <EditorContent
          extensions={extensions}
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
          className="relative min-h-[500px] w-full border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg p-10"
        >
            {/* Menú flotante que aparece al seleccionar texto */}
            <EditorBubble className="flex w-fit max-w-[90vw] overflow-hidden rounded border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900">
              
              <EditorBubbleItem
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
                onSelect={(editor) => editor.chain().focus().toggleBold().run()}
              >
                Bold
              </EditorBubbleItem>

              <EditorBubbleItem
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
                onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
              >
                Italic
              </EditorBubbleItem>

              <EditorBubbleItem
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
                onSelect={(editor) => editor.chain().focus().toggleStrike().run()}
              >
                Strike
              </EditorBubbleItem>

            </EditorBubble>
        </EditorContent>
      </EditorRoot>
    </div>
  );
};