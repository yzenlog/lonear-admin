import { useId, useRef, useState } from "react";
import type { DragEvent } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import "./Upload.css";

export type UploadProps = {
  label?: string;
  hint?: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  buttonLabel?: string;
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function Upload({
  label,
  hint,
  files,
  onFilesChange,
  accept,
  multiple = false,
  disabled = false,
  buttonLabel = "选择文件",
}: UploadProps) {
  const generatedId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function normalizeFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const nextFiles = Array.from(fileList).slice(0, multiple ? fileList.length : 1);
    onFilesChange(nextFiles);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    if (disabled) {
      return;
    }

    normalizeFiles(event.dataTransfer.files);
  }

  return (
    <div className="ui-form-field">
      {label ? <span className="ui-form-label">{label}</span> : null}
      <div
        className={`ui-upload-dropzone ${dragging ? "is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className="ui-upload-main">
          <span className="ui-upload-icon" aria-hidden="true">
            <UploadCloud size={18} strokeWidth={2.1} />
          </span>
          <span className="ui-upload-copy">
            <strong>{files.length > 0 ? `${files.length} 个文件已选择` : "上传附件"}</strong>
            <span>{hint ?? "支持点击选择或拖拽文件到此处"}</span>
          </span>
          <span className="ui-upload-actions">
            <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()}>
              <UploadCloud size={13} strokeWidth={2.2} />
              {buttonLabel}
            </button>
            {files.length > 0 ? (
              <button type="button" disabled={disabled} onClick={() => onFilesChange([])} aria-label="清空文件">
                <X size={13} strokeWidth={2.2} />
                清空
              </button>
            ) : null}
          </span>
          <input
            className="ui-upload-input"
            id={generatedId}
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={(event) => normalizeFiles(event.target.files)}
          />
        </div>
        {files.length > 0 ? (
          <div className="ui-upload-files" aria-live="polite">
            {files.map((file) => (
              <div className="ui-upload-file" key={`${file.name}-${file.lastModified}`}>
                <FileText size={14} strokeWidth={2.1} />
                <span>{file.name}</span>
                <small>{formatFileSize(file.size)}</small>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Upload;
