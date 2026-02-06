'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export function BlogRichEditor({ value, onChange }: Props) {
  const editorRef = useRef<any>(null);
  const [CKEditorComponent, setCKEditorComponent] = useState<any>(null);
  const [ClassicEditor, setClassicEditor] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      import('@ckeditor/ckeditor5-react'),
      import('@ckeditor/ckeditor5-build-classic'),
    ])
      .then(([ckeditor, classicEditor]) => {
        if (!mounted) return;
        setCKEditorComponent(() => ckeditor.CKEditor);
        setClassicEditor(() => classicEditor.default || classicEditor);
      })
      .catch((error) => {
        console.error('Failed to load editor:', error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleInsertImage = () => {
    const url = window.prompt('Image URL');
    if (!url) return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.model.change((writer: any) => {
      const imageElement = writer.createElement('imageBlock', { src: url });
      editor.model.insertContent(imageElement, editor.model.document.selection);
    });
  };

  if (!CKEditorComponent || !ClassicEditor) {
    return <div className="h-64 rounded-lg border border-border bg-muted animate-pulse" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={handleInsertImage}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Insert Image URL
        </Button>
        <span className="text-xs text-muted-foreground">
          Full-featured editor with HTML output.
        </span>
      </div>

      <div className="rounded-lg border border-border bg-background">
        <CKEditorComponent
          editor={ClassicEditor}
          data={value || '<p></p>'}
          onReady={(editor: any) => {
            editorRef.current = editor;
          }}
          onChange={(_: any, editor: any) => {
            const data = editor.getData();
            onChange(data);
          }}
          config={{
            placeholder: 'Write your article content here...',
            toolbar: {
              items: [
                'heading',
                '|',
                'bold',
                'italic',
                'link',
                'bulletedList',
                'numberedList',
                '|',
                'blockQuote',
                'insertTable',
                'mediaEmbed',
                '|',
                'undo',
                'redo',
              ],
            },
          }}
        />
      </div>
    </div>
  );
}
