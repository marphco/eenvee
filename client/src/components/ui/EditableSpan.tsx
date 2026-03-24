import React, { useState, useRef, useEffect } from "react";
import "./EditableSpan.css";

interface EditableSpanProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  className?: string;
}

export default function EditableSpan({ 
  value, 
  onChange, 
  placeholder, 
  style, 
  multiline, 
  className 
}: EditableSpanProps) {
  const [editing, setEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value || "");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync tempVal with value if not editing
  if (!editing && tempVal !== value) {
    setTempVal(value || "");
  }

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      // Put cursor at the end
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
         const len = tempVal.length;
         inputRef.current.setSelectionRange(len, len);
      }
    }
  }, [editing, tempVal.length]);

  const handleBlur = () => {
    setEditing(false);
    if (tempVal !== value) {
      onChange(tempVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === "Enter") {
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setTempVal(value || ""); // Revert
      inputRef.current?.blur();
    }
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={tempVal}
          onChange={(e) => setTempVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`editable-input multiline ${className || ""}`}
          style={{ ...style, resize: "none" }}
          rows={Math.max(1, tempVal.split("\n").length)}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={tempVal}
        onChange={(e) => setTempVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`editable-input ${className || ""}`}
        style={style}
      />
    );
  }

  return (
    <span
      className={`editable-text ${className || ""} ${!value ? "empty" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      style={style}
      title="Clicca per modificare"
    >
      {value || placeholder || "Tocca per scrivere..."}
    </span>
  );
}
