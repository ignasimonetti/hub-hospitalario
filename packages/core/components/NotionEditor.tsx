'use client';

import { 
  EditorRoot, 
  EditorContent, 
  EditorBubble, 
  EditorBubbleItem,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  JSONContent,
  handleCommandNavigation // Importar directamente desde 'novel'
} from "novel";
import { useState } from "react";

// Iconos (Lucide React)
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare, 
  TextQuote, 
  Table as TableIcon,
  Minus,
  Text
} from "lucide-react";

// Extensiones de Tiptap
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

// 1. Configuración de Extensiones
const extensions = [
  StarterKit.configure({
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
  }),
  // Tareas (Checklists)
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  // Tablas (HTML table)
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
];

// 2. Definición de Comandos (Menú "/")
const slashCommands = [
  {
    title: "Texto",
    description: "Escribe texto plano.",
    icon: <Text size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Título 1",
    description: "Encabezado principal.",
    icon: <Heading1 size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Título 2",
    description: "Encabezado de sección.",
    icon: <Heading2 size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Título 3",
    description: "Subtítulo.",
    icon: <Heading3 size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Lista de tareas",
    description: "Checklist para pendientes.",
    icon: <CheckSquare size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Lista con viñetas",
    description: "Lista simple.",
    icon: <List size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Lista numerada",
    description: "Lista ordenada.",
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Tabla",
    description: "Insertar tabla simple (3x3).",
    icon: <TableIcon size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    title: "Alerta / Cita",
    description: "Resaltar información importante.",
    icon: <TextQuote size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Divisor",
    description: "Línea horizontal separadora.",
    icon: <Minus size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
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
          slotAfter={<div />}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            attributes: {
               // Estilos Tailwind Typography + Ajustes para Tablas y Tareas
               class: `prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full 
               prose-table:border prose-table:border-gray-200 dark:prose-table:border-gray-800 
               prose-td:border prose-td:p-2 prose-th:border prose-th:p-2 prose-th:bg-gray-50 dark:prose-th:bg-gray-900`,
            }
          }}
          className="relative min-h-[500px] w-full border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg p-10"
        >
          
          {/* Menú de Comandos "/" */}
          <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-gray-200 bg-white px-1 py-2 shadow-md transition-all dark:border-gray-800 dark:bg-gray-900">
            <EditorCommandEmpty className="px-2 text-gray-500">Sin resultados</EditorCommandEmpty>
            <EditorCommandList>
              {slashCommands.map((item) => (
                <EditorCommandItem
                  key={item.title}
                  onCommand={(val) => item.command(val)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          {/* Menú Flotante (Selección de texto) */}
          <EditorBubble className="flex w-fit max-w-[90vw] overflow-hidden rounded border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900">
            <EditorBubbleItem
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium"
              onSelect={(editor) => editor.chain().focus().toggleBold().run()}
            >
              Bold
            </EditorBubbleItem>
            <EditorBubbleItem
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium"
              onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
            >
              Italic
            </EditorBubbleItem>
            <EditorBubbleItem
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium"
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