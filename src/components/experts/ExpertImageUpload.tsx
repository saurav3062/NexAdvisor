import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ExpertImageUploadProps {
  onUpload: (file: File) => void;
  currentImage?: string;
}

export function ExpertImageUpload({ onUpload, currentImage }: ExpertImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5242880, // 5MB
    multiple: false
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
        `}
      >
        <input {...getInputProps()} />
        
        {currentImage ? (
          <div className="relative">
            <img
              src={currentImage}
              alt="Current profile"
              className="w-32 h-32 mx-auto rounded-full object-cover"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
              onClick={(e) => {
                e.stopPropagation();
                // Handle image removal
              }}
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center">
              {isDragActive ? (
                <Upload className="h-12 w-12 text-blue-500" />
              ) : (
                <ImageIcon className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {isDragActive ? (
                "Drop the image here"
              ) : (
                "Drag and drop an image here, or click to select"
              )}
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG or GIF (max. 5MB)
            </p>
          </div>
        )}
      </div>

      {currentImage && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            // Trigger file input click
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
              fileInput.click();
            }
          }}
        >
          Change Image
        </motion.button>
      )}
    </div>
  );
}