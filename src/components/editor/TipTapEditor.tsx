'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { useEffect, useState } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, Heading3, List, ListOrdered, Code, LinkIcon, Highlighter, ImageIcon } from 'lucide-react';
import '@/styles/editor.css';

interface TipTapEditorProps {
  value?: string;
  onChange?: (data: { json: any; html: string }) => void;
  placeholder?: string;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write something amazing...',
}) => {
  const [mounted, setMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Highlight,
      Image.configure({
        allowBase64: true,
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert focus:outline-none min-h-96 p-4',
      },
      handlePaste: (view, event) => {
        const files = event.clipboardData?.files;
        if (files && files[0]) {
          handleImageUpload(files[0], editor!);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.({
        json: ed.getJSON(),
        html: ed.getHTML(),
      });
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageUpload = (file: File, ed: Editor) => {
    const reader = new FileReader();
    reader.onload = () => {
      ed.chain().focus().setImage({ src: reader.result as string }).run();
    };
    reader.readAsDataURL(file);
  };

  if (!mounted) return null;

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleH1 = () => editor?.chain().focus().toggleHeading({ level: 1 }).run();
  const toggleH2 = () => editor?.chain().focus().toggleHeading({ level: 2 }).run();
  const toggleH3 = () => editor?.chain().focus().toggleHeading({ level: 3 }).run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const toggleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run();
  const toggleHighlight = () => editor?.chain().focus().toggleHighlight().run();

  const addLink = () => {
    const url = prompt('Enter URL');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageUpload(file, editor!);
      }
    };
    input.click();
  };

  return (
    <div className="border border-gray-300 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700">
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
        <button
          onClick={toggleBold}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${
            editor?.isActive('bold') ? 'bg-gray-300 dark:bg-slate-600' : ''
          }`}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={toggleItalic}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${
            editor?.isActive('italic') ? 'bg-gray-300 dark:bg-slate-600' : ''
          }`}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={toggleUnderline}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${
            editor?.isActive('underline') ? 'bg-gray-300 dark:bg-slate-600' : ''
          }`}
          title="Underline"
        >
          <Underline size={18} />
        </button>

        <div className="w-px bg-gray-300 dark:bg-slate-700" />

        <button
          onClick={toggleH1}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-sm font-bold ${
            editor?.isActive('heading', { level: 1 }) ? 'bg-gray-300 dark:bg-slate-600' : ''
          }`}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={toggleH2}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-sm font-bold ${
            editor?.isActive('heading', { level: 2 }) ? 'bg-gray-300 dark:bg-slate-600' : ''
          }`}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </button>
        <button
          onClick={toggleH3}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-sm font-bold ${
            editor?.isActive('heading', { level: 3 }) ? 'bg-gray-300 dark:bg-slate-600' : ''
          }`}
          title="Heading 3"
        >
          <Heading3 size={18} />
        </button>

        <div className="w-px bg-gray-300 dark:bg-slate-700" />

        <button
          onClick={toggleBulletList}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${
            editor?.isActive('bulletList') ? 'bg-gray-300 dark:bg-slate-600' : ''
          }`}
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          onClick={toggleOrderedList}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${
            editor?.isActive('orderedList') ? 'bg-gray-300 dark:bg-slate-600' : ''
          }`}
          title="Ordered List"
        >
          <ListOrdered size={18} />
        </button>

        <div className="w-px bg-gray-300 dark:bg-slate-700" />

        <button
          onClick={toggleCodeBlock}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${
            editor?.isActive('codeBlock') ? 'bg-gray-300 dark:bg-slate-600' : ''
          }`}
          title="Code Block"
        >
          <Code size={18} />
        </button>

        <div className="w-px bg-gray-300 dark:bg-slate-700" />

        <button
          onClick={addLink}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
          title="Link"
        >
          <LinkIcon size={18} />
        </button>

        <button
          onClick={toggleHighlight}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${
            editor?.isActive('highlight') ? 'bg-gray-300 dark:bg-slate-600' : ''
          }`}
          title="Highlight"
        >
          <Highlighter size={18} />
        </button>

        <button
          onClick={addImage}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
          title="Image"
        >
          <ImageIcon size={18} />
        </button>
      </div>

      <EditorContent editor={editor} className="w-full" />
    </div>
  );
};

export default TipTapEditor;
