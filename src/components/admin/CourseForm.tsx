'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface CourseFormData {
    title: string;
    slug: string;
    description: string;
    level: string;
    status: 'draft' | 'published' | 'archived';
    price: number;
    is_premium: boolean;
    thumbnail_url: string;
}

interface CourseFormProps {
    initialData?: Partial<CourseFormData>;
    onSubmit: (data: CourseFormData) => Promise<void>;
    isLoading?: boolean;
    isEdit?: boolean;
}

const levelOptions = [
    { value: 'JAMB', label: 'JAMB' },
    { value: 'WAEC', label: 'WAEC' },
    { value: 'SS1', label: 'SS1' },
    { value: 'SS2', label: 'SS2' },
    { value: 'SS3', label: 'SS3' },
];

const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
];

export function CourseForm({ initialData, onSubmit, isLoading, isEdit }: CourseFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<CourseFormData>({
        title: '',
        slug: '',
        description: '',
        level: 'JAMB',
        status: 'draft',
        price: 0,
        is_premium: false,
        thumbnail_url: '',
        ...initialData,
    });

    // Auto-generate slug from title if creating new
    useEffect(() => {
        if (!isEdit && formData.title && !initialData?.slug) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.title, isEdit, initialData?.slug]);

    const handleChange = (field: keyof CourseFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-[var(--foreground)]">Course Details</h3>

                            <Input
                                label="Course Title"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                required
                                placeholder="e.g. JAMB Mathematics 2024"
                            />

                            <Input
                                label="Slug"
                                value={formData.slug}
                                onChange={(e) => handleChange('slug', e.target.value)}
                                required
                                placeholder="jamb-mathematics-2024"
                                helperText="URL-friendly version of the title"
                            />

                            <Textarea
                                label="Description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Enter course description..."
                                rows={5}
                            />
                        </div>
                    </Card>

                    <Card>
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-[var(--foreground)]">Media</h3>
                            <Input
                                label="Thumbnail URL"
                                value={formData.thumbnail_url}
                                onChange={(e) => handleChange('thumbnail_url', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                            {formData.thumbnail_url && (
                                <div className="mt-2 aspect-video relative rounded-lg overflow-hidden bg-[var(--muted)] border border-[var(--border)]">
                                    <img
                                        src={formData.thumbnail_url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <Card>
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-[var(--foreground)]">Settings</h3>

                            <Select
                                label="Status"
                                options={statusOptions}
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            />

                            <Select
                                label="Level"
                                options={levelOptions}
                                value={formData.level}
                                onChange={(e) => handleChange('level', e.target.value)}
                            />

                            <div className="pt-4 border-t border-[var(--border)]">
                                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_premium}
                                        onChange={(e) => handleChange('is_premium', e.target.checked)}
                                        className="w-4 h-4 rounded border-[var(--border)] text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-[var(--foreground)] font-medium">Premium Course</span>
                                </label>

                                {formData.is_premium && (
                                    <Input
                                        label="Price (NGN)"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => handleChange('price', Number(e.target.value))}
                                        min={0}
                                        step={100}
                                    />
                                )}
                            </div>
                        </div>
                    </Card>

                    <div className="flex flex-col gap-3">
                        <Button type="submit" isLoading={isLoading} fullWidth size="lg">
                            {isEdit ? 'Save Changes' : 'Create Course'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            fullWidth
                            onClick={() => router.back()}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
