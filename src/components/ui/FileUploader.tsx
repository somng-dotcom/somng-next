'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { uploadCourseContent } from '@/lib/api/storage';

export interface FileUploaderProps {
    onUploadComplete: (url: string) => void;
    currentUrl?: string;
    accept?: string;
    label?: string;
    uploadFunction?: (file: File) => Promise<string>;
}

export function FileUploader({
    onUploadComplete,
    currentUrl,
    accept,
    label = "Upload File",
    uploadFunction = uploadCourseContent
}: FileUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            const url = await uploadFunction(file);
            onUploadComplete(url);
        } catch (err: any) {
            setError(err.message || 'Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
            <div className="flex items-center gap-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={accept}
                    onChange={handleFileChange}
                />

                <div className="flex-1 flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Choose File'}
                    </Button>

                    {currentUrl && !isUploading && (
                        <div className="text-sm text-success-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            File Uploaded
                        </div>
                    )}
                </div>
            </div>

            {currentUrl && (
                <p className="text-xs text-[var(--muted-foreground)] truncate max-w-md">
                    Current: {currentUrl}
                </p>
            )}

            {error && (
                <p className="text-sm text-error-500">{error}</p>
            )}
        </div>
    );
}
