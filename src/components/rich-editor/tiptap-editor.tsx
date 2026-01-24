'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Code2,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  RotateCcw,
} from 'lucide-react';
import './tiptap-editor.css';

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  initialContent?: any;
  onChange: (content: any, html: string) => void;
  editable?: boolean;
}

export function TipTapEditor({ initialContent, onChange, editable = true }: TipTapEditorProps) {
  const [mounted, setMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer hover:text-blue-700',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: initialContent || '<p>Start writing your blog post...</p>',
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const html = editor.getHTML();
      onChange(json, html);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: 'Blog image' }).run();
    }
  }, [editor]);

  const setHeading = useCallback(
    (level: 1 | 2 | 3) => {
      if (!editor) return;
      editor.chain().focus().toggleHeading({ level }).run();
    },
    [editor]
  );

  if (!mounted) {
    return <div className="w-full h-64 bg-muted rounded-lg animate-pulse" />;
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full border border-input rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      {editable && (
        <div className="border-b border-input bg-muted/50 p-3 flex flex-wrap gap-2">
          <Select value="heading" onValueChange={() => {}}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Paragraph</SelectItem>
              <SelectItem value="h1" onClick={() => setHeading(1)}>
                Heading 1
              </SelectItem>
              <SelectItem value="h2" onClick={() => setHeading(2)}>
                Heading 2
              </SelectItem>
              <SelectItem value="h3" onClick={() => setHeading(3)}>
                Heading 3
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-1 border-l border-input pl-2 ml-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              icon={Bold}
              title="Bold"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              icon={Italic}
              title="Italic"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              icon={UnderlineIcon}
              title="Underline"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              icon={Highlighter}
              title="Highlight"
            />
          </div>

          <div className="flex gap-1 border-l border-input pl-2 ml-2">
            <ToolbarButton
              onClick={addLink}
              isActive={editor.isActive('link')}
              icon={LinkIcon}
              title="Link"
            />
            <ToolbarButton
              onClick={addImage}
              icon={ImageIcon}
              title="Image"
            />
          </div>

          <div className="flex gap-1 border-l border-input pl-2 ml-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              icon={List}
              title="Bullet List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              icon={ListOrdered}
              title="Ordered List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
              icon={Code2}
              title="Code Block"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              icon={Quote}
              title="Blockquote"
            />
          </div>

          <div className="flex gap-1 border-l border-input pl-2 ml-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().clearNodes().run()}
              title="Clear"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="editor-wrapper p-6 prose prose-sm dark:prose-invert max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}

function ToolbarButton({ onClick, isActive, icon: Icon, title }: ToolbarButtonProps) {
  return (
    <Button
      size="sm"
      variant={isActive ? 'default' : 'ghost'}
      onClick={onClick}
      title={title}
      className="h-8 w-8 p-0"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
