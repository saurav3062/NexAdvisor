import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import type { Category, CategoryAttribute } from '../../types/category';

const attributeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['text', 'number', 'boolean', 'select', 'multiselect']),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  description: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  description: z.string(),
  parentId: z.string().optional(),
  attributes: z.array(attributeSchema),
  settings: z.object({
    allowCustomAttributes: z.boolean(),
    requireVerification: z.boolean(),
    minimumExperience: z.number().optional(),
    requiredCertifications: z.array(z.string()).optional(),
  }),
});

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: z.infer<typeof categorySchema>) => void;
  isLoading?: boolean;
}

export function CategoryForm({ initialData, onSubmit, isLoading }: CategoryFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      parentId: initialData?.parentId || '',
      attributes: initialData?.attributes || [],
      settings: {
        allowCustomAttributes: initialData?.settings?.allowCustomAttributes || false,
        requireVerification: initialData?.settings?.requireVerification || false,
        minimumExperience: initialData?.settings?.minimumExperience || 0,
        requiredCertifications: initialData?.settings?.requiredCertifications || [],
      },
    },
  });

  const attributes = watch('attributes');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Slug</label>
          <input
            type="text"
            {...register('slug')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Category Attributes</h3>
        <p className="mt-1 text-sm text-gray-500">
          Define the attributes that experts in this category need to provide
        </p>

        <Controller
          name="attributes"
          control={control}
          render={({ field }) => (
            <Reorder.Group
              axis="y"
              values={field.value}
              onReorder={field.onChange}
              className="mt-4 space-y-4"
            >
              {field.value.map((attribute: CategoryAttribute, index: number) => (
                <Reorder.Item
                  key={attribute.id}
                  value={attribute}
                  className="flex items-center gap-4 rounded-lg border bg-white p-4 shadow-sm"
                >
                  <GripVertical className="h-5 w-5 cursor-move text-gray-400" />
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Attribute name"
                        value={attribute.name}
                        onChange={(e) => {
                          const newAttributes = [...field.value];
                          newAttributes[index].name = e.target.value;
                          field.onChange(newAttributes);
                        }}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />

                      <select
                        value={attribute.type}
                        onChange={(e) => {
                          const newAttributes = [...field.value];
                          newAttributes[index].type = e.target.value as CategoryAttribute['type'];
                          field.onChange(newAttributes);
                        }}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="select">Select</option>
                        <option value="multiselect">Multi-select</option>
                      </select>
                    </div>

                    {(attribute.type === 'select' || attribute.type === 'multiselect') && (
                      <div>
                        <input
                          type="text"
                          placeholder="Options (comma-separated)"
                          value={attribute.options?.join(', ') || ''}
                          onChange={(e) => {
                            const newAttributes = [...field.value];
                            newAttributes[index].options = e.target.value.split(',').map(o => o.trim());
                            field.onChange(newAttributes);
                          }}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={attribute.required}
                          onChange={(e) => {
                            const newAttributes = [...field.value];
                            newAttributes[index].required = e.target.checked;
                            field.onChange(newAttributes);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Required</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const newAttributes = field.value.filter((_, i) => i !== index);
                          field.onChange(newAttributes);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        />

        <button
          type="button"
          onClick={() => {
            const currentAttributes = watch('attributes');
            const newAttribute: CategoryAttribute = {
              id: Math.random().toString(36).substr(2, 9),
              name: '',
              type: 'text',
              required: false,
            };
            control.setValue('attributes', [...currentAttributes, newAttribute]);
          }}
          className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Attribute
        </button>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Category Settings</h3>
        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('settings.allowCustomAttributes')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Allow experts to add custom attributes</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('settings.requireVerification')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Require verification for experts</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Years of Experience
            </label>
            <input
              type="number"
              {...register('settings.minimumExperience')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Required Certifications
            </label>
            <Controller
              name="settings.requiredCertifications"
              control={control}
              render={({ field }) => (
                <div className="mt-2 space-y-2">
                  {field.value?.map((cert, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cert}
                        onChange={(e) => {
                          const newCerts = [...field.value];
                          newCerts[index] = e.target.value;
                          field.onChange(newCerts);
                        }}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newCerts = field.value.filter((_, i) => i !== index);
                          field.onChange(newCerts);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      field.onChange([...(field.value || []), '']);
                    }}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Certification
                  </button>
                </div>
              )}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <motion.button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Category</span>
          )}
        </motion.button>
      </div>
    </form>
  );
}