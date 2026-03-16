import React, { useRef, useState, useCallback } from 'react';

export default function AvatarUploader({ src, onUpload, disabled = false }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(src);
  const [error, setError] = useState("");

  // update local preview if parent passes new src (e.g. after upload)
  React.useEffect(() => {
    setPreview(src);
  }, [src]);

  const handleFiles = useCallback(
    (file) => {
      if (error) setError("");
      if (!file || !file.type.startsWith('image/')) {
        setError('Please choose a valid image.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Max size is 5 MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      onUpload && onUpload(file);
    },
    [onUpload, error]
  );

  const onChange = (e) => handleFiles(e.target.files?.[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files?.[0]);
  };

  const clickHandler = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div>
      <div
        className={`relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2
           border-gray-200 hover:border-blue-400 transition-colors duration-150
           ${dragOver ? 'ring-4 ring-blue-300' : ''}
           ${disabled ? 'opacity-75 cursor-default' : 'cursor-pointer'}`}
        onClick={clickHandler}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={disabled ? undefined : onDrop}
        role={disabled ? undefined : 'button'}
        tabIndex={disabled ? undefined : 0}
      >
        {preview ? (
          <img
            src={preview}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-200 to-blue-500
                          flex items-center justify-center text-white text-2xl font-bold">
            ?
          </div>
        )}
        {!disabled && (
          <div
            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20
                     flex items-center justify-center opacity-0 hover:opacity-100
                     transition-opacity duration-150"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22
                     A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22
                     A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5
                     a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
        />
      </div>
      {error ? (
        <div className="error-box mt-2" role="alert" aria-live="polite">
          {error}
        </div>
      ) : null}
    </div>
  );
}
