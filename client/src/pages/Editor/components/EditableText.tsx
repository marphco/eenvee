import React, { useEffect, useRef } from "react";

interface EditableTextProps {
  id?: string;
  className?: string;
  text?: string;
  isEditing: boolean;
  onSync: (html: string) => void;
  onBlur: (html: string) => void;
  onFocus?: () => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  style?: React.CSSProperties;
}

const EditableText: React.FC<EditableTextProps> = ({ 
  text = "", 
  isEditing, 
  onSync, 
  onBlur, 
  onFocus, 
  onDoubleClick, 
  onPointerDown, 
  style, 
  id, 
  className 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== text) {
      ref.current.innerHTML = text;
    }
  }, [text]);

  return (
    <div
      ref={ref}
      id={id}
      className={className}
      contentEditable={isEditing}
      suppressContentEditableWarning={true}
      onInput={(e) => onSync(e.currentTarget.innerHTML)}
      onBlur={(e) => onBlur(e.currentTarget.innerHTML)}
      onFocus={onFocus}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
      style={style}
    />
  );
};

export default EditableText;
