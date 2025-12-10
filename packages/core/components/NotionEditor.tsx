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
  handleCommandNavigation,
  Command,
  renderItems
} from "novel";
import { Extension } from "@tiptap/core";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";

interface NotionEditorProps {
  initialContent?: JSONContent;
  onDebouncedUpdate?: (editor: any) => void;
}

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
  Text,
  Columns,
  Layout,
  Trash2,
  Copy,
  Info
} from "lucide-react";

// Extensiones de Tiptap
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import Placeholder from '@tiptap/extension-placeholder';

// Custom Extensions
import { Column, ColumnList } from "./extensions/columns";

// 1. Configuración de Extensiones
const extensions: any[] = [
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
      HTMLAttributes: {
        class: "list-disc list-outside leading-3 -mt-2 ml-4", // Added ml-4 for visibility
      }
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
      HTMLAttributes: {
        class: "list-decimal list-outside leading-3 -mt-2 ml-4", // Added ml-4 for visibility
      }
    },
    heading: {
      HTMLAttributes: {
        class: "font-bold",
      },
      levels: [1, 2, 3],
    },
    blockquote: {
      HTMLAttributes: {
        class: "border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-sm my-4 not-italic", // Callout style
      }
    },
  }),
  // Placeholder
  Placeholder.configure({
    placeholder: ({ node }: { node: any }) => {
      if (node.type.name === "heading") {
        return `Título ${node.attrs.level}`;
      }
      return "Presiona '/' para comandos...";
    },
    includeChildren: true,
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
  // Columnas
  Column,
  ColumnList,
  // Drag Handle
  GlobalDragHandle.configure({
    dragHandleWidth: 24, // Increased width for better hit area
    scrollTreshold: 0, // Set to 0 to avoid scroll issues
  }),
  // Slash Command
  Command.configure({
    suggestion: {
      items: () => slashCommands,
      render: renderItems,
    }
  }),
  // Custom Keymap to force Enter to create new block
  Extension.create({
    name: 'customKeymap',
    addKeyboardShortcuts() {
      return {
        'Enter': () => {
          if (this.editor.isActive('taskList')) {
            return this.editor.commands.splitListItem('taskItem');
          }
          return this.editor.commands.splitBlock({ keepMarks: false });
        },
      }
    },
  }),
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
    title: "2 Columnas",
    description: "Dos columnas de ancho igual.",
    icon: <Columns size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setColumns(2).run();
    },
  },
  {
    title: "3 Columnas",
    description: "Tres columnas de ancho igual.",
    icon: <Layout size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setColumns(3).run();
    },
  },
  {
    title: "4 Columnas",
    description: "Cuatro columnas de ancho igual.",
    icon: <Layout size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setColumns(4).run();
    },
  },
  {
    title: "Alerta / Callout",
    description: "Resaltar información importante.",
    icon: <Info size={18} />,
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

export const NotionEditor = ({ initialContent, onDebouncedUpdate }: NotionEditorProps) => {
  const [content, setContent] = useState<JSONContent | undefined>(initialContent);
  const [editor, setEditor] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pos: number | null } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('drag-handle')) {
        e.preventDefault();
        if (!editor) return;

        // Estimate block position: drag handle is usually to the left of the block
        // We look for the block at the same Y coordinate but slightly to the right
        const coordinates = { left: e.clientX + 50, top: e.clientY };
        const pos = editor.view.posAtCoords(coordinates)?.pos;

        if (pos !== undefined) {
          setContextMenu({ x: e.clientX, y: e.clientY, pos });
        }
      } else {
        setContextMenu(null);
      }
    };

    const handleClick = () => setContextMenu(null);

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
    };
  }, [editor]);

  // Debounce update
  const [debouncedContent] = useDebounce(content, 1000);

  useEffect(() => {
    if (debouncedContent && onDebouncedUpdate && editor) {
      onDebouncedUpdate(editor);
    }
  }, [debouncedContent, onDebouncedUpdate, editor]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!editor) return;

    // If clicking on the wrapper but not inside the editor content
    // Focus the editor at the end
    if (e.target === e.currentTarget) {
      editor.chain().focus().run();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!editor) return;

    // If clicking inside the editor content area (ProseMirror), let Tiptap handle it
    if ((e.target as HTMLElement).closest('.ProseMirror')) {
      return;
    }

    // Get the coordinates of the click
    const { clientX, clientY } = e;

    // Attempt to find the position in the editor at those coordinates
    const pos = editor.view.posAtCoords({ left: clientX, top: clientY });

    if (pos && pos.pos !== null) {
      // If we found a position, insert a new paragraph after that block
      const node = editor.view.state.doc.nodeAt(pos.pos);
      const endPos = pos.pos + (node ? node.nodeSize : 0);
      editor.chain().focus().insertContentAt(endPos, { type: 'paragraph' }).run();
    } else {
      // If no position found (e.g. clicked way below), append to the end
      editor.chain().focus().insertContent({ type: 'paragraph' }).run();
    }
  };

  // CSS injection (kept as is)
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .drag-handle {
        position: fixed; /* Reverted to fixed as extension uses viewport coordinates */
        opacity: 1;
        /* transition: opacity 0.2s ease-in-out; Removed to prevent lag */
        border-radius: 0.25rem;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' style='fill: rgba(0, 0, 0, 0.5);'%3E%3Cpath d='M3,2 C2.44771525,2 2,1.55228475 2,1 C2,0.44771525 2.44771525,0 3,0 C3.55228475,0 4,0.44771525 4,1 C4,1.55228475 3.55228475,2 3,2 Z M3,6 C2.44771525,6 2,5.55228475 2,5 C2,4.44771525 2.44771525,4 3,4 C3.55228475,4 4,4.44771525 4,5 C4,5.55228475 3.55228475,6 3,6 Z M3,10 C2.44771525,10 2,9.55228475 2,9 C2,8.44771525 2.44771525,8 3,8 C3.55228475,8 4,8.44771525 4,9 C4,9.55228475 3.55228475,10 3,10 Z M7,2 C6.44771525,2 6,1.55228475 6,1 C6,0.44771525 6.44771525,0 7,0 C7.55228475,0 8,0.44771525 8,1 C8,1.55228475 7.55228475,2 7,2 Z M7,6 C6.44771525,6 6,5.55228475 6,5 C6,4.44771525 6.44771525,4 7,4 C7.55228475,4 8,4.44771525 8,5 C8,5.55228475 7.55228475,6 7,6 Z M7,10 C6.44771525,10 6,9.55228475 6,9 C6,8.44771525 6.44771525,8 7,8 C7.55228475,8 8,8.44771525 8,9 C8,9.55228475 7.55228475,10 7,10 Z'%3E%3C/path%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 12px;
        width: 24px;
        height: 24px;
        z-index: 50;
        cursor: grab;
      }
      .drag-handle:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      .dark .drag-handle {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' style='fill: rgba(255, 255, 255, 0.5);'%3E%3Cpath d='M3,2 C2.44771525,2 2,1.55228475 2,1 C2,0.44771525 2.44771525,0 3,0 C3.55228475,0 4,0.44771525 4,1 C4,1.55228475 3.55228475,2 3,2 Z M3,6 C2.44771525,6 2,5.55228475 2,5 C2,4.44771525 2.44771525,4 3,4 C3.55228475,4 4,4.44771525 4,5 C4,5.55228475 3.55228475,6 3,6 Z M3,10 C2.44771525,10 2,9.55228475 2,9 C2,8.44771525 2.44771525,8 3,8 C3.55228475,8 4,8.44771525 4,9 C4,9.55228475 3.55228475,10 3,10 Z M7,2 C6.44771525,2 6,1.55228475 6,1 C6,0.44771525 6.44771525,0 7,0 C7.55228475,0 8,0.44771525 8,1 C8,1.55228475 7.55228475,2 7,2 Z M7,6 C6.44771525,6 6,5.55228475 6,5 C6,4.44771525 6.44771525,4 7,4 C7.55228475,4 8,4.44771525 8,5 C8,5.55228475 7.55228475,6 7,6 Z M7,10 C6.44771525,10 6,9.55228475 6,9 C6,8.44771525 6.44771525,8 7,8 C7.55228475,8 8,8.44771525 8,9 C8,9.55228475 7.55228475,10 7,10 Z'%3E%3C/path%3E%3C/svg%3E");
      }
      .dark .drag-handle:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      /* Placeholder Styles */
      .ProseMirror p.is-editor-empty:first-child::before {
        color: #adb5bd;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
      }
      .ProseMirror p.is-empty::before {
        color: #adb5bd;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
      }

      /* Selected Node Styles */
      .ProseMirror-selectednode {
        outline: 2px solid #3b82f6;
        border-radius: 4px;
      }

      /* Task List Styles */
      ul[data-type="taskList"] {
        list-style: none;
        padding: 0;
      }
      ul[data-type="taskList"] li {
        display: flex;
        align-items: center; /* Changed from flex-start to center for alignment */
        margin-bottom: 0.25rem;
      }
      ul[data-type="taskList"] li > label {
        flex: 0 0 auto;
        margin-right: 0.5rem;
        user-select: none;
        margin-top: 0; /* Removed margin-top to align with center */
      }
      ul[data-type="taskList"] li > div {
        flex: 1 1 auto;
        margin-top: 0; /* Reset margin */
      }
      ul[data-type="taskList"] li[data-checked="true"] > div {
        text-decoration: line-through;
        color: #888;
      }

      /* Table Styles */
      .ProseMirror table {
        border-collapse: collapse;
        table-layout: fixed;
        width: 100%;
        margin: 0;
        overflow: hidden;
      }
      .ProseMirror td,
      .ProseMirror th {
        min-width: 1em;
        border: 2px solid #ced4da;
        padding: 3px 5px;
        vertical-align: top;
        box-sizing: border-box;
        position: relative;
      }
      .ProseMirror th {
        font-weight: bold;
        text-align: left;
        background-color: #f1f3f5;
      }
      .ProseMirror .selectedCell:after {
        z-index: 2;
        position: absolute;
        content: "";
        left: 0; right: 0; top: 0; bottom: 0;
        background: rgba(200, 200, 255, 0.4);
        pointer-events: none;
      }
      .ProseMirror .column-resize-handle {
        position: absolute;
        right: -2px;
        top: 0;
        bottom: -2px;
        width: 4px;
        background-color: #adf;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [editor]);

  return (
    <div
      ref={editorRef}
      className="relative w-full max-w-screen-lg cursor-text min-h-screen"
      onDoubleClick={handleDoubleClick}
      onClick={handleContainerClick}
    >
      <EditorRoot>
        <EditorContent
          extensions={extensions}
          initialContent={content}
          onUpdate={({ editor }) => {
            const json = editor.getJSON();
            setContent(json);
          }}
          onCreate={({ editor }) => setEditor(editor)}
          slotAfter={<div />}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            attributes: {
              // Estilos Tailwind Typography + Ajustes para Tablas y Tareas
              // Added specific heading classes to force sizes
              class: "prose prose-lg dark:prose-invert font-default focus:outline-none max-w-full prose-h1:text-4xl prose-h1:font-bold prose-h2:text-3xl prose-h2:font-semibold prose-h3:text-2xl prose-h3:font-medium prose-table:border prose-table:border-gray-200 dark:prose-table:border-gray-800 prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700 prose-td:p-2 prose-td:relative prose-th:border prose-th:border-gray-200 dark:prose-th:border-gray-700 prose-th:p-2 prose-th:bg-gray-50 dark:prose-th:bg-gray-900 prose-th:text-left [&_.drag-handle]:opacity-0 [&_.drag-handle]:hover:opacity-100",
            }
          }}
          className="relative min-h-[500px] w-full border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg p-4 sm:p-10"
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

            {/* Table Tools */}
            {editor && editor.isActive('table') && (
              <>
                <div className="w-[1px] bg-stone-200 dark:bg-stone-700 mx-1" />
                <button
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium text-stone-600 dark:text-stone-400"
                  title="Agregar Columna"
                >
                  +Col
                </button>
                <button
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium text-red-600 dark:text-red-400"
                  title="Eliminar Columna"
                >
                  -Col
                </button>
                <button
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium text-stone-600 dark:text-stone-400"
                  title="Agregar Fila"
                >
                  +Fila
                </button>
                <button
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium text-red-600 dark:text-red-400"
                  title="Eliminar Fila"
                >
                  -Fila
                </button>
              </>
            )}

            {/* Column Tools */}
            {editor && editor.isActive('column') && (
              <>
                <div className="w-[1px] bg-stone-200 dark:bg-stone-700 mx-1" />
                <button
                  onClick={() => editor.chain().focus().unsetColumns().run()}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium text-red-600 dark:text-red-400"
                  title="Eliminar Columnas"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}

          </EditorBubble>

        </EditorContent>
      </EditorRoot>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-48 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="flex w-full items-center space-x-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              if (editor && contextMenu.pos !== null) {
                const $pos = editor.view.state.doc.resolve(contextMenu.pos);
                let targetDepth = $pos.depth;
                for (let d = targetDepth; d > 0; d--) {
                  const node = $pos.node(d);
                  if (node.type.name === 'table' || node.type.name === 'listItem' || node.type.name === 'taskItem') {
                    targetDepth = d;
                    break;
                  }
                }
                const node = $pos.node(targetDepth);
                if (node) {
                  // Transform into 2 columns
                  const columnList = {
                    type: 'columnList',
                    attrs: { cols: 2 },
                    content: [
                      {
                        type: 'column',
                        content: [node.toJSON()]
                      },
                      {
                        type: 'column',
                        content: [{ type: 'paragraph' }]
                      }
                    ]
                  };
                  const from = $pos.before(targetDepth);
                  const to = $pos.after(targetDepth);
                  const tr = editor.state.tr.replaceWith(from, to, editor.schema.nodeFromJSON(columnList));
                  editor.view.dispatch(tr);
                }
                setContextMenu(null);
              }
            }}
          >
            <Columns size={16} />
            <span className="flex-1 text-left">Transformar en 2 Col.</span>
          </button>
          <button
            className="flex w-full items-center space-x-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              if (editor && contextMenu.pos !== null) {
                const $pos = editor.view.state.doc.resolve(contextMenu.pos);
                let targetDepth = $pos.depth;
                for (let d = targetDepth; d > 0; d--) {
                  const node = $pos.node(d);
                  if (node.type.name === 'table' || node.type.name === 'listItem' || node.type.name === 'taskItem') {
                    targetDepth = d;
                    break;
                  }
                }
                const node = $pos.node(targetDepth);
                if (node) {
                  // Duplicate: insert content of current node after it
                  editor.chain().insertContentAt($pos.after(targetDepth), node.toJSON()).run();
                }
                setContextMenu(null);
              }
            }}
          >
            <Copy size={16} />
            <span className="flex-1 text-left">Duplicar</span>
          </button>
          <button
            className="flex w-full items-center space-x-2 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={() => {
              if (editor && contextMenu.pos !== null) {
                const $pos = editor.view.state.doc.resolve(contextMenu.pos);
                let targetDepth = $pos.depth;
                for (let d = targetDepth; d > 0; d--) {
                  const node = $pos.node(d);
                  if (node.type.name === 'table' || node.type.name === 'listItem' || node.type.name === 'taskItem') {
                    targetDepth = d;
                    break;
                  }
                }
                if (targetDepth > 0) {
                  // Delete the node at the specific position (parent block)
                  const from = $pos.before(targetDepth);
                  const to = $pos.after(targetDepth);
                  editor.chain().deleteRange({ from, to }).run();
                }
                setContextMenu(null);
              }
            }}
          >
            <Trash2 size={16} />
            <span className="flex-1 text-left">Eliminar</span>
          </button>
        </div>
      )}

    </div>
  );
};