import { useEffect, useRef, useState } from "react";
import MarkdownIt from "markdown-it";
import MdEditor from "react-markdown-editor-lite";
import "react-markdown-editor-lite/lib/index.css";
import { Card } from "./ui/card";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

const mdParser = new MarkdownIt();

export default function MarkdownEditor({ value, onChange, placeholder, height = 600 }: MarkdownEditorProps) {
  const [editorValue, setEditorValue] = useState(value);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleEditorChange = ({ text }: { text: string }) => {
    setEditorValue(text);

    // Debounce auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onChange(text);
    }, 1000);
  };

  return (
    <Card className="overflow-hidden">
      <MdEditor
        value={editorValue}
        style={{ height: `${height}px` }}
        renderHTML={(text) => mdParser.render(text)}
        onChange={handleEditorChange}
        placeholder={placeholder || "请输入内容..."}
        config={{
          view: {
            menu: true,
            md: true,
            html: true,
          },
          canView: {
            menu: true,
            md: true,
            html: true,
            fullScreen: true,
            hideMenu: true,
          },
        }}
      />
    </Card>
  );
}
