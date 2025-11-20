import { Node, mergeAttributes } from '@tiptap/core'

export const Column = Node.create({
    name: 'column',

    content: 'block+',

    isolating: true,

    addAttributes() {
        return {
            position: {
                default: 'left',
                parseHTML: element => element.getAttribute('data-position'),
                renderHTML: attributes => ({ 'data-position': attributes.position }),
            },
        }
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { class: 'column' }), 0]
    },

    parseHTML() {
        return [
            {
                tag: 'div[class="column"]',
            },
        ]
    },
})

export const ColumnList = Node.create({
    name: 'columnList',

    group: 'block',

    content: 'column+',

    addAttributes() {
        return {
            cols: {
                default: 2,
                parseHTML: element => element.getAttribute('data-cols'),
                renderHTML: attributes => ({ 'data-cols': attributes.cols }),
            },
        }
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                class: `grid gap-4 grid-cols-${HTMLAttributes.cols || 2} w-full`
            }),
            0,
        ]
    },

    parseHTML() {
        return [
            {
                tag: 'div[class^="grid"]',
            },
        ]
    },

    addCommands() {
        return {
            setColumns: (cols: number) => ({ commands }: any) => {
                return commands.insertContent({
                    type: 'columnList',
                    attrs: { cols },
                    content: Array(cols).fill({ type: 'column', content: [{ type: 'paragraph' }] }),
                })
            },
        } as any
    },
})
