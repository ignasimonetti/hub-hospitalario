"use client";

import { 
  EditorRoot, 
  EditorContent, 
  JSONContent,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorBubble,
  NodeSelector,
  TextButtons,
  ColorSelector,
} from "novel";
import { useState } from "react";
import StarterKit from "@tiptap/starter-kit"; 
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CodeSquare,
  Minus,
} from "lucide-react";

// Definimos las extensiones fuera del componente para evitar recrearlas en cada render
const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
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
          className="relative min-h-[500px] w-full border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg p-4"
        >
          {/* Editor Command for Slash Commands */}
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">
              No results
            </EditorCommandEmpty>
            <EditorCommandList>
              {/* Basic text blocks */}
              <EditorCommandItem
                value="Heading 1"
                onCommand={(val) => {
                  const editor = val.editor;
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                }}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
              >
                <Heading1 className="h-4 w-4" />
                <span>Heading 1</span>
              </EditorCommandItem>
              <EditorCommandItem
                value="Heading 2"
                onCommand={(val) => {
                  const editor = val.editor;
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                }}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
              >
                <Heading2 className="h-4 w-4" />
                <span>Heading 2</span>
              </EditorCommandItem>
              <EditorCommandItem
                value="Heading 3"
                onCommand={(val) => {
                  const editor = val.editor;
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                }}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
              >
                <Heading3 className="h-4 w-4" />
                <span>Heading 3</span>
              </EditorCommandItem>
              <EditorCommandItem
                value="Bullet List"
                onCommand={(val) => {
                  const editor = val.editor;
                  editor.chain().focus().toggleBulletList().run();
                }}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
              >
                <List className="h-4 w-4" />
                <span>Bullet List</span>
              </EditorCommandItem>
              <EditorCommandItem
                value="Ordered List"
                onCommand={(val) => {
                  const editor = val.editor;
                  editor.chain().focus().toggleOrderedList().run();
                }}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
              >
                <ListOrdered className="h-4 w-4" />
                <span>Ordered List</span>
              </EditorCommandItem>
              <EditorCommandItem
                value="Blockquote"
                onCommand={(val) => {
                  const editor = val.editor;
                  editor.chain().focus().toggleBlockquote().run();
                }}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
              >
                <Quote className="h-4 w-4" />
                <span>Blockquote</span>
              </EditorCommandItem>
              <EditorCommandItem
                value="Code Block"
                onCommand={(val) => {
                  const editor = val.editor;
                  editor.chain().focus().toggleCodeBlock().run();
                }}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
              >
                <CodeSquare className="h-4 w-4" />
                <span>Code Block</span>
              </EditorCommandItem>
              <EditorCommandItem
                value="Horizontal Rule"
                onCommand={(val) => {
                  const editor = val.editor;
                  editor.chain().focus().setHorizontalRule().run();
                }}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
              >
                <Minus className="h-4 w-4" />
                <span>Horizontal Rule</span>
              </EditorCommandItem>
            </EditorCommandList>
          </EditorCommand>

          {/* Editor Bubble for Text Formatting */}
          <EditorBubble
            className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
            tippyOptions={{ zIndex: 1000 }}
          >
            <div className="flex">
              <NodeSelector open={false} onOpenChange={() => {}} />
              <TextButtons />
              <ColorSelector open={false} onOpenChange={() => {}} />
            </div>
          </EditorBubble>
        </EditorContent>
      </EditorRoot>
    </div>
  );
};