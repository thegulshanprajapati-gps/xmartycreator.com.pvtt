'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Code, Link as LinkIcon, Image as ImageIcon, Highlighter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './tiptap-editor.css';

interface TipTapEditorProps {
  initialContent?: object;
  onChange: (json: object, html: string) => void;
}

export function TipTapEditor({ initialContent = {}, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Highlight.configure({ multicolor: true }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        <Button
          size="sm"
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive('underline') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="border-l mx-1" />

        <Button
          size="sm"
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="border-l mx-1" />

        <Button
          size="sm"
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive('codeBlock') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="border-l mx-1" />

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const url = window.prompt('URL:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const url = window.prompt('Image URL:');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive('highlight') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} className="prose max-w-none p-4 min-h-96" />
    </div>
  );
}
