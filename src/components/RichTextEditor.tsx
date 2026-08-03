"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md px-2 py-1 text-xs font-semibold transition",
        active
          ? "bg-brand text-sand"
          : "bg-white text-brand hover:bg-peach/40",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export function RichTextEditor({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[14rem] px-3 py-2 text-sm text-brand outline-none [&_h2]:mt-4 [&_h2]:font-[family-name:var(--font-syne)] [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:font-[family-name:var(--font-syne)] [&_h3]:text-lg [&_h3]:font-bold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand/55">
        {label}
      </span>
      <input type="hidden" name={name} value={value} />
      <div className="mt-1.5 overflow-hidden rounded-lg border border-peach/70 bg-white">
        <div className="flex flex-wrap gap-1 border-b border-peach/50 bg-sand/60 p-2">
          <ToolbarButton
            label="Bold"
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            label="Italic"
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            label="H2"
            active={editor?.isActive("heading", { level: 2 })}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          />
          <ToolbarButton
            label="H3"
            active={editor?.isActive("heading", { level: 3 })}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          />
          <ToolbarButton
            label="• List"
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            label="1. List"
            active={editor?.isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            label="Paragraph"
            active={editor?.isActive("paragraph")}
            onClick={() => editor?.chain().focus().setParagraph().run()}
          />
        </div>
        <EditorContent editor={editor} />
      </div>
      <p className="mt-1.5 text-xs text-brand/50">
        Use headings and bullet lists for structured pitch sections.
      </p>
    </div>
  );
}
