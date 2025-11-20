import { Node, mergeAttributes } from '@tiptap/core';

export const ColumnList = Node.create({
    name: 'columnList',
    group: 'block',
    content: 'column+',
    isolating: true,
    defining: true,

    addAttributes() {
        return {
            cols: {
                default: 2,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="column-list"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column-list', class: 'flex gap-4 w-full' }), 0];
    },
});

export const Column = Node.create({
    name: 'column',
    content: 'block+',
    isolating: true,
    defining: true,

    addAttributes() {
        return {
            width: {
                default: 'auto',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="column"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column', class: 'flex-1 min-w-0' }), 0];
    },
});
