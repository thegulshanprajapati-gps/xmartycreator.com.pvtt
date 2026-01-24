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
  Check,
  AlertCircle,
} from 'lucide-react';
import './tiptap-editor.css';

const lowlight = createLowlight(common);

interface TipTapDebugProps {
  initialContent?: any;
  onChange: (content: any, html: string) => void;
  editable?: boolean;
}

export function TipTapDebug({ initialContent, onChange, editable = true }: TipTapDebugProps) {
  const [mounted, setMounted] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    componentMounted: false,
    editorCreated: false,
    updateCount: 0,
    lastUpdate: new Date().toLocaleTimeString(),
    browserEnv: false,
  });

  // 🌍 Check browser environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🌍 Browser environment detected');
      console.log('✅ Window object available:', !!window);
      console.log('✅ Document object available:', !!document);
      setDebugInfo(prev => ({ ...prev, browserEnv: true }));
    }
  }, []);

  // ✅ Component mount detection
  useEffect(() => {
    console.log('🎉 [TipTapDebug Component] Mounted successfully');
    console.log('📍 Mounting timestamp:', new Date().toISOString());
    console.log('📍 Props received:', {
      hasInitialContent: !!initialContent,
      isEditable: editable,
      onChangeCallback: !!onChange,
    });
    
    setMounted(true);
    setDebugInfo(prev => ({ ...prev, componentMounted: true }));

    return () => {
      console.log('🛑 [TipTapDebug Component] Unmounting');
    };
  }, []);

  // ✅ Editor creation
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
    onUpdate: ({ editor: updatingEditor }) => {
      const json = updatingEditor.getJSON();
      const html = updatingEditor.getHTML();
      
      console.log('✍️ [TipTap Update] Content changed');
      console.log('📝 JSON Content:', json);
      console.log('📄 HTML Content:', html);
      console.log('📊 Content stats:', {
        wordCount: updatingEditor.storage.characterCount?.words() || 0,
        charCount: updatingEditor.storage.characterCount?.characters() || 0,
      });
      
      setDebugInfo(prev => ({
        ...prev,
        updateCount: prev.updateCount + 1,
        lastUpdate: new Date().toLocaleTimeString(),
      }));
      
      onChange(json, html);
    },
    immediatelyRender: false,
    onCreate: ({ editor: createdEditor }) => {
      console.log('✅ [TipTap Editor Instance] Created successfully');
      console.log('📌 Editor instance:', createdEditor);
      console.log('🛠️ Editor configuration:', {
        isEditable: createdEditor.isEditable,
        isEmpty: createdEditor.isEmpty,
        isFocused: createdEditor.isFocused,
        canUndo: createdEditor.can().undo(),
        canRedo: createdEditor.can().redo(),
      });
      console.log('🧮 Available extensions:', createdEditor.extensionManager.names);
      
      setDebugInfo(prev => ({ ...prev, editorCreated: true }));
    },
    onFocus: ({ editor: focusEditor }) => {
      console.log('👁️ [TipTap Focus] Editor focused');
      console.log('📌 Selection:', focusEditor.state.selection);
    },
    onBlur: ({ editor: blurEditor }) => {
      console.log('👁️ [TipTap Blur] Editor lost focus');
      console.log('📝 Final content:', blurEditor.getHTML());
    },
  });

  // ✅ Editor instance check
  useEffect(() => {
    if (editor) {
      console.log('✅ [TipTap Editor] Instance is available and ready');
      console.log('📊 Editor stats:', {
        totalWords: editor.storage.characterCount?.words() || 0,
        totalChars: editor.storage.characterCount?.characters() || 0,
      });
    }
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) {
      console.error('❌ [Link] Editor instance not available');
      return;
    }
    const url = prompt('Enter URL:');
    if (url) {
      console.log('🔗 [Link] Adding link:', url);
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) {
      console.error('❌ [Image] Editor instance not available');
      return;
    }
    const url = prompt('Enter image URL:');
    if (url) {
      console.log('🖼️ [Image] Adding image:', url);
      editor.chain().focus().setImage({ src: url, alt: 'Blog image' }).run();
    }
  }, [editor]);

  const setHeading = useCallback(
    (level: 1 | 2 | 3) => {
      if (!editor) {
        console.error('❌ [Heading] Editor instance not available');
        return;
      }
      console.log(`📌 [Heading] Setting H${level}`);
      editor.chain().focus().toggleHeading({ level }).run();
    },
    [editor]
  );

  if (!mounted) {
    console.log('⏳ [TipTapDebug] Still mounting, showing loading state');
    return (
      <div className="w-full">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            TipTap Debug Editor Initializing...
          </p>
        </div>
      </div>
    );
  }

  if (!editor) {
    console.error('❌ [TipTapDebug] Editor instance is null or undefined');
    return (
      <div className="w-full">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            ❌ ERROR: TipTap editor failed to initialize
          </p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-2">
            Check browser console for details. Editor instance is null.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Debug Status Banner */}
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <h2 className="font-semibold text-green-800 dark:text-green-200">
            ✅ TipTap Debug Editor Loaded
          </h2>
        </div>
        
        {/* Debug Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="bg-white dark:bg-green-900/30 p-2 rounded border border-green-200 dark:border-green-700">
            <p className="font-mono text-green-600 dark:text-green-400">Component: {debugInfo.componentMounted ? '✅' : '❌'}</p>
          </div>
          <div className="bg-white dark:bg-green-900/30 p-2 rounded border border-green-200 dark:border-green-700">
            <p className="font-mono text-green-600 dark:text-green-400">Editor: {debugInfo.editorCreated ? '✅' : '❌'}</p>
          </div>
          <div className="bg-white dark:bg-green-900/30 p-2 rounded border border-green-200 dark:border-green-700">
            <p className="font-mono text-green-600 dark:text-green-400">Updates: {debugInfo.updateCount}</p>
          </div>
          <div className="bg-white dark:bg-green-900/30 p-2 rounded border border-green-200 dark:border-green-700">
            <p className="font-mono text-green-600 dark:text-green-400">Last: {debugInfo.lastUpdate}</p>
          </div>
        </div>

        <p className="text-xs text-green-700 dark:text-green-300 mt-3 font-mono">
          🐛 Check browser console (F12) for detailed logs
        </p>
      </div>

      {/* Editor */}
      <div className="w-full border border-input rounded-lg overflow-hidden bg-background">
        {/* Toolbar */}
        {editable && (
          <div className="border-b border-input bg-muted/50 p-3 flex flex-wrap gap-2">
            <div className="flex gap-1 border-l border-input pl-2 ml-2">
              <DebugToolbarButton
                onClick={() => {
                  console.log('🔘 [Toolbar] Bold clicked');
                  editor.chain().focus().toggleBold().run();
                }}
                isActive={editor.isActive('bold')}
                icon={Bold}
                title="Bold (Ctrl+B)"
              />
              <DebugToolbarButton
                onClick={() => {
                  console.log('🔘 [Toolbar] Italic clicked');
                  editor.chain().focus().toggleItalic().run();
                }}
                isActive={editor.isActive('italic')}
                icon={Italic}
                title="Italic (Ctrl+I)"
              />
              <DebugToolbarButton
                onClick={() => {
                  console.log('🔘 [Toolbar] Underline clicked');
                  editor.chain().focus().toggleUnderline().run();
                }}
                isActive={editor.isActive('underline')}
                icon={UnderlineIcon}
                title="Underline (Ctrl+U)"
              />
              <DebugToolbarButton
                onClick={() => {
                  console.log('🔘 [Toolbar] Highlight clicked');
                  editor.chain().focus().toggleHighlight().run();
                }}
                isActive={editor.isActive('highlight')}
                icon={Highlighter}
                title="Highlight"
              />
            </div>

            <div className="flex gap-1 border-l border-input pl-2 ml-2">
              <DebugToolbarButton
                onClick={addLink}
                isActive={editor.isActive('link')}
                icon={LinkIcon}
                title="Link"
              />
              <DebugToolbarButton
                onClick={addImage}
                icon={ImageIcon}
                title="Image"
              />
            </div>

            <div className="flex gap-1 border-l border-input pl-2 ml-2">
              <DebugToolbarButton
                onClick={() => {
                  console.log('🔘 [Toolbar] Bullet list clicked');
                  editor.chain().focus().toggleBulletList().run();
                }}
                isActive={editor.isActive('bulletList')}
                icon={List}
                title="Bullet List"
              />
              <DebugToolbarButton
                onClick={() => {
                  console.log('🔘 [Toolbar] Ordered list clicked');
                  editor.chain().focus().toggleOrderedList().run();
                }}
                isActive={editor.isActive('orderedList')}
                icon={ListOrdered}
                title="Ordered List"
              />
              <DebugToolbarButton
                onClick={() => {
                  console.log('🔘 [Toolbar] Code block clicked');
                  editor.chain().focus().toggleCodeBlock().run();
                }}
                isActive={editor.isActive('codeBlock')}
                icon={Code2}
                title="Code Block"
              />
              <DebugToolbarButton
                onClick={() => {
                  console.log('🔘 [Toolbar] Blockquote clicked');
                  editor.chain().focus().toggleBlockquote().run();
                }}
                isActive={editor.isActive('blockquote')}
                icon={Quote}
                title="Blockquote"
              />
            </div>

            <div className="flex gap-1 border-l border-input pl-2 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  console.log('🔘 [Toolbar] Clear formatting clicked');
                  editor.chain().focus().clearNodes().run();
                }}
                title="Clear Formatting"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Editor Content Area */}
        <div className="editor-wrapper p-6 prose prose-sm dark:prose-invert max-w-none">
          <EditorContent editor={editor} />
        </div>

        {/* Footer with Info */}
        <div className="border-t border-input bg-muted/30 p-2 text-xs text-muted-foreground flex justify-between">
          <span>
            ✍️ Updates: {debugInfo.updateCount} | Last: {debugInfo.lastUpdate}
          </span>
          <span>
            💾 Saving to state automatically
          </span>
        </div>
      </div>

      {/* Console Log Instructions */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-3">
        <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mb-2">
          📋 Console Expectations:
        </p>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
          <li>✓ 🌍 Browser environment detected</li>
          <li>✓ 🎉 [TipTapDebug Component] Mounted successfully</li>
          <li>✓ ✅ [TipTap Editor Instance] Created successfully</li>
          <li>✓ When you type: ✍️ [TipTap Update] Content changed</li>
          <li>✓ When you click toolbar: 🔘 [Toolbar] [Action] clicked</li>
        </ul>
      </div>
    </div>
  );
}

interface DebugToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}

function DebugToolbarButton({ onClick, isActive, icon: Icon, title }: DebugToolbarButtonProps) {
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
