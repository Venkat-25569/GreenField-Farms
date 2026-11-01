import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import {
  fetchCategories,
  uploadProductImage,
  adminSaveProductImage,
  adminDeleteProductImage,
  uploadProductVideo,
  adminSaveProductVideo,
  adminDeleteProductVideo,
} from '@/services/api';
import { generateSlug, generateVideoThumbnail } from '@/lib/utils';
import { X, Upload, Loader2, Trash2, Star, Film, Play, Video, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { Product, ProductImage, ProductVideo } from '@/types';

interface ProductFormProps {
  product?: Product | null;
  onSave: (data: any) => Promise<Product>;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const isEditing = !!product;
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState(product?.category_id || '');
  const [description, setDescription] = useState(product?.description || '');
  const [productType, setProductType] = useState<'livestock' | 'dairy' | 'farming_goods'>(product?.product_type || 'dairy');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity?.toString() || '0');
  const [unit, setUnit] = useState(product?.unit || '');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);

  // Livestock fields
  const ld = product?.livestock_details;
  const [breed, setBreed] = useState(ld?.breed || '');
  const [age, setAge] = useState(ld?.age || '');
  const [gender, setGender] = useState<'male' | 'female' | ''>(ld?.gender || '');
  const [weight, setWeight] = useState(ld?.weight || '');
  const [location, setLocation] = useState(ld?.location || '');
  const [healthInfo, setHealthInfo] = useState(ld?.health_information || '');
  const [vaccinationInfo, setVaccinationInfo] = useState(ld?.vaccination_information || '');
  const [milkYield, setMilkYield] = useState(ld?.milk_yield || '');
  const [lactationInfo, setLactationInfo] = useState(ld?.lactation_information || '');
  const [listingType, setListingType] = useState<'direct' | 'enquiry'>(ld?.listing_type || 'direct');

  // Image state
  const [existingImages, setExistingImages] = useState<ProductImage[]>(
    [...(product?.product_images || [])].sort((a, b) => a.display_order - b.display_order)
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [primaryExistingId, setPrimaryExistingId] = useState<string | null>(
    existingImages.length > 0 ? existingImages[0].id : null
  );
  const [primaryNewIndex, setPrimaryNewIndex] = useState<number | null>(
    existingImages.length === 0 ? 0 : null
  );

  // Video state
  const [existingVideos, setExistingVideos] = useState<ProductVideo[]>(
    [...(product?.product_videos || [])].sort((a, b) => a.display_order - b.display_order)
  );
  const [removedVideos, setRemovedVideos] = useState<{ id: string; url: string }[]>([]);
  const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);
  const [newVideoPreviews, setNewVideoPreviews] = useState<{
    url: string;
    thumbnail: string | null;
    name: string;
    size: number;
  }[]>([]);
  const [previewModalVideo, setPreviewModalVideo] = useState<{ url: string; title: string } | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // ---- Image handlers ----

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validFiles = files.filter((f) => {
      if (!allowedTypes.includes(f.type)) {
        toast.error(`${f.name}: unsupported format. Use JPG, PNG, or WEBP.`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const startIdx = newImageFiles.length;
    setNewImageFiles((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // If no primary selected yet, default to the first new image
    if (existingImages.length === 0 && primaryNewIndex === null && newImageFiles.length === 0) {
      setPrimaryNewIndex(0);
      setPrimaryExistingId(null);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (primaryNewIndex === index) {
      // Reset primary to first existing, or first remaining new, or null
      if (existingImages.length > 0) {
        setPrimaryExistingId(existingImages[0].id);
        setPrimaryNewIndex(null);
      } else {
        setPrimaryNewIndex(newImageFiles.length > 1 ? 0 : null);
      }
    } else if (primaryNewIndex !== null && primaryNewIndex > index) {
      setPrimaryNewIndex(primaryNewIndex - 1);
    }
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setRemovedImageIds((prev) => [...prev, imageId]);
    if (primaryExistingId === imageId) {
      const remaining = existingImages.filter((img) => img.id !== imageId);
      if (remaining.length > 0) {
        setPrimaryExistingId(remaining[0].id);
      } else if (newImageFiles.length > 0) {
        setPrimaryExistingId(null);
        setPrimaryNewIndex(0);
      } else {
        setPrimaryExistingId(null);
        setPrimaryNewIndex(null);
      }
    }
  };

  const setExistingAsPrimary = (imageId: string) => {
    setPrimaryExistingId(imageId);
    setPrimaryNewIndex(null);
  };

  const setNewAsPrimary = (index: number) => {
    setPrimaryNewIndex(index);
    setPrimaryExistingId(null);
  };

  // ---- Video handlers ----

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedExtensions = /\.(mp4|webm|mov)$/i;
    const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    const validFiles = files.filter((f) => {
      const isAllowed = allowedMimeTypes.includes(f.type) || allowedExtensions.test(f.name);
      if (!isAllowed) {
        toast.error(`${f.name}: Unsupported video format. Please upload MP4, WEBM, or MOV.`);
        return false;
      }
      const maxSizeBytes = 100 * 1024 * 1024; // 100 MB
      if (f.size > maxSizeBytes) {
        toast.error(`${f.name} exceeds 100MB limit (${(f.size / (1024 * 1024)).toFixed(1)}MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setNewVideoFiles((prev) => [...prev, ...validFiles]);

    // Process thumbnails asynchronously
    for (const file of validFiles) {
      const previewUrl = URL.createObjectURL(file);
      let thumb: string | null = null;
      try {
        thumb = await generateVideoThumbnail(file);
      } catch {
        thumb = null;
      }
      setNewVideoPreviews((prev) => [
        ...prev,
        {
          url: previewUrl,
          thumbnail: thumb,
          name: file.name,
          size: file.size,
        },
      ]);
    }

    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeNewVideo = (index: number) => {
    const preview = newVideoPreviews[index];
    if (preview?.url) {
      try {
        URL.revokeObjectURL(preview.url);
      } catch {}
    }
    setNewVideoFiles((prev) => prev.filter((_, i) => i !== index));
    setNewVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingVideo = (video: ProductVideo) => {
    setExistingVideos((prev) => prev.filter((v) => v.id !== video.id));
    setRemovedVideos((prev) => [...prev, { id: video.id, url: video.video_url }]);
  };

  // ---- Form submission ----

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) { toast.error('Product name is required'); return; }
    if (!categoryId) { toast.error('Please select a category'); return; }
    if (!price || parseFloat(price) < 0) { toast.error('Valid price is required'); return; }
    if (parseInt(stockQuantity) < 0) { toast.error('Stock quantity cannot be negative'); return; }

    setSaving(true);
    try {
      const slug = isEditing ? product!.slug : generateSlug(name);

      const parsedStock = parseInt(stockQuantity) || 0;
      const isLivestock = productType === 'livestock';
      const isSold = isLivestock && parsedStock <= 0;
      const isOut = !isLivestock && parsedStock <= 0;
      const availStatus = isSold ? 'sold' : isOut ? 'out_of_stock' : 'available';

      const productData: any = {
        name: name.trim(),
        slug,
        category_id: categoryId,
        description: description.trim() || null,
        product_type: productType,
        price: parseFloat(price),
        stock_quantity: parsedStock,
        unit: unit.trim() || null,
        is_active: isActive,
        is_featured: isFeatured,
        is_available: parsedStock > 0 && !isSold,
        availability_status: availStatus,
        sold_at: isSold ? (product?.sold_at || new Date().toISOString()) : null,
      };

      // Add livestock details if applicable
      if (productType === 'livestock') {
        productData.livestock_details = {
          breed: breed || null,
          age: age || null,
          gender: gender || null,
          weight: weight || null,
          location: location || null,
          health_information: healthInfo || null,
          vaccination_information: vaccinationInfo || null,
          milk_yield: milkYield || null,
          lactation_information: lactationInfo || null,
          listing_type: listingType,
        };
      }

      // 1. Save the product (create or update) — get the ID back
      setUploadProgress('Saving product...');
      const savedProduct = await onSave(productData);
      const productId = savedProduct.id;

      // 2. Delete removed existing images from the database
      if (removedImageIds.length > 0) {
        setUploadProgress('Removing deleted images...');
        for (const imgId of removedImageIds) {
          try {
            await adminDeleteProductImage(imgId);
          } catch (err) {
            console.error('Failed to delete image:', imgId, err);
          }
        }
      }

      // 3. Upload new image files to Supabase storage + save records
      if (newImageFiles.length > 0) {
        for (let i = 0; i < newImageFiles.length; i++) {
          const file = newImageFiles[i];
          setUploadProgress(`Uploading image ${i + 1} of ${newImageFiles.length}...`);

          const imageUrl = await uploadProductImage(file, productId);

          // Determine display_order:
          // Primary image gets display_order 0
          // Others get incremental orders
          let displayOrder: number;
          if (primaryNewIndex === i && primaryExistingId === null) {
            displayOrder = 0; // This is the selected primary
          } else {
            displayOrder = existingImages.length + i + 1;
          }

          await adminSaveProductImage(
            productId,
            imageUrl,
            file.name.replace(/\.[^/.]+$/, ''), // alt_text = filename without extension
            displayOrder
          );
        }
      }

      // 4. Delete removed videos
      if (removedVideos.length > 0) {
        setUploadProgress('Removing deleted videos...');
        for (const v of removedVideos) {
          try {
            await adminDeleteProductVideo(v.id, v.url);
          } catch (err) {
            console.error('Failed to delete video:', v.id, err);
          }
        }
      }

      // 5. Upload new product videos
      if (newVideoFiles.length > 0) {
        for (let i = 0; i < newVideoFiles.length; i++) {
          const file = newVideoFiles[i];
          const preview = newVideoPreviews[i];
          setUploadProgress(
            `Uploading video ${i + 1} of ${newVideoFiles.length} (${(file.size / (1024 * 1024)).toFixed(1)}MB)...`
          );

          const { videoUrl, fileName } = await uploadProductVideo(file, productId);
          const displayOrder = existingVideos.length + i;
          const title = file.name.replace(/\.[^/.]+$/, '');

          await adminSaveProductVideo(
            productId,
            videoUrl,
            title,
            fileName,
            displayOrder,
            preview?.thumbnail || null
          );
        }
      }

      // Invalidate all product queries so the UI refreshes
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });

      setUploadProgress('');
      toast.success(isEditing ? 'Product updated!' : 'Product created!');
      onCancel(); // Close the form
    } catch (error: any) {
      if (error?.message?.includes('products_slug_key')) {
        toast.error('A product with this name already exists. Auto-resolving unique URL...');
      } else {
        toast.error(error.message || 'Failed to save product');
      }
      setUploadProgress('');
    } finally {
      setSaving(false);
    }
  };

  const totalImageCount = existingImages.length + newImageFiles.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-earth-100">
          <h2 className="text-xl font-bold text-forest-900" style={{ fontFamily: 'var(--font-heading)' }}>
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-earth-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-earth-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-forest-700 uppercase tracking-wider">Basic Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Product Name *"
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Kadaknath Rooster"
              />
              <Select
                label="Category *"
                id="product-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                options={[
                  { value: '', label: 'Select category...' },
                  ...(categories?.map((c) => ({ value: c.id, label: c.name })) || []),
                ]}
              />
            </div>

            <Textarea
              label="Description"
              id="product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product..."
            />

            <div className="grid sm:grid-cols-3 gap-4">
              <Select
                label="Product Type *"
                id="product-type"
                value={productType}
                onChange={(e) => setProductType(e.target.value as any)}
                options={[
                  { value: 'livestock', label: '🐄 Livestock' },
                  { value: 'dairy', label: '🥛 Dairy' },
                  { value: 'farming_goods', label: '🌾 Farming Goods' },
                ]}
              />
              <Input
                label="Price (₹) *"
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
              <Input
                label="Stock Quantity *"
                id="product-stock"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Unit"
                id="product-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., per bird, per litre, per kg"
              />
              <div className="flex items-end gap-6 pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-earth-300 text-forest-600 focus:ring-forest-500"
                  />
                  <span className="text-sm font-medium text-forest-800">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-earth-300 text-forest-600 focus:ring-forest-500"
                  />
                  <span className="text-sm font-medium text-forest-800">Featured</span>
                </label>
              </div>
            </div>
          </div>

          {/* Livestock Details */}
          {productType === 'livestock' && (
            <div className="space-y-4 pt-4 border-t border-earth-100">
              <h3 className="text-sm font-semibold text-forest-700 uppercase tracking-wider">Livestock Details</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label="Breed" id="livestock-breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g., Kadaknath" />
                <Input label="Age" id="livestock-age" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 8 months" />
                <Select
                  label="Gender"
                  id="livestock-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  options={[
                    { value: '', label: 'Select...' },
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ]}
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label="Weight" id="livestock-weight" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g., 2.5 kg" />
                <Input label="Location" id="livestock-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Madhya Pradesh" />
                <Select
                  label="Listing Type"
                  id="livestock-listing"
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value as any)}
                  options={[
                    { value: 'direct', label: 'Direct Purchase' },
                    { value: 'enquiry', label: 'Enquiry Only' },
                  ]}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Health Information" id="livestock-health" value={healthInfo} onChange={(e) => setHealthInfo(e.target.value)} placeholder="e.g., Healthy, vaccinated" />
                <Input label="Vaccination Info" id="livestock-vaccination" value={vaccinationInfo} onChange={(e) => setVaccinationInfo(e.target.value)} placeholder="e.g., Complete" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Milk Yield" id="livestock-milk" value={milkYield} onChange={(e) => setMilkYield(e.target.value)} placeholder="e.g., 12-15 litres/day" />
                <Input label="Lactation Info" id="livestock-lactation" value={lactationInfo} onChange={(e) => setLactationInfo(e.target.value)} placeholder="e.g., 3rd lactation" />
              </div>
            </div>
          )}

          {/* Product Images */}
          <div className="space-y-4 pt-4 border-t border-earth-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-forest-700 uppercase tracking-wider">
                Product Images ({totalImageCount})
              </h3>
              {totalImageCount > 0 && (
                <p className="text-xs text-earth-400">
                  ⭐ Click the star to set cover/primary image
                </p>
              )}
            </div>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {existingImages.map((img) => {
                  const isPrimary = primaryExistingId === img.id;
                  return (
                    <div
                      key={img.id}
                      className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                        isPrimary ? 'border-forest-600 ring-2 ring-forest-200' : 'border-earth-200'
                      }`}
                    >
                      <img
                        src={img.image_url}
                        alt={img.alt_text || ''}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {isPrimary && (
                        <div className="absolute top-1 left-1 bg-forest-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-white" /> Cover
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => setExistingAsPrimary(img.id)}
                            className="p-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                            title="Set as cover image"
                          >
                            <Star className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* New image previews */}
            {newImagePreviews.length > 0 && (
              <div>
                <p className="text-xs text-forest-600 font-medium mb-2">New images to upload:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {newImagePreviews.map((preview, i) => {
                    const isPrimary = primaryNewIndex === i && primaryExistingId === null;
                    return (
                      <div
                        key={i}
                        className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                          isPrimary
                            ? 'border-forest-600 ring-2 ring-forest-200'
                            : 'border-dashed border-forest-300'
                        }`}
                      >
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        {isPrimary ? (
                          <div className="absolute top-1 left-1 bg-forest-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-white" /> Cover
                          </div>
                        ) : (
                          <div className="absolute top-1 left-1 bg-forest-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            NEW
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => setNewAsPrimary(i)}
                              className="p-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                              title="Set as cover image"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeNewImage(i)}
                            className="p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            title="Remove image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-earth-300 rounded-xl hover:border-forest-400 hover:bg-forest-50 transition-colors text-sm text-earth-600 w-full justify-center"
              >
                <Upload className="w-4 h-4" />
                Choose Images (JPG, PNG, WEBP — max 5MB each)
              </button>
            </div>
          </div>

          {/* Product Videos */}
          <div className="space-y-4 pt-4 border-t border-earth-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-forest-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-forest-600" />
                  Product Videos ({existingVideos.length + newVideoFiles.length})
                </h3>
                <p className="text-xs text-earth-500 mt-0.5">
                  Upload demonstration or live animal videos (MP4, WEBM, MOV up to 100MB each)
                </p>
              </div>
              <span className="text-[11px] bg-forest-50 text-forest-700 px-2.5 py-0.5 rounded-full font-medium border border-forest-200">
                Max 100MB
              </span>
            </div>

            {/* Existing videos */}
            {existingVideos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-forest-700 font-semibold">Saved Videos ({existingVideos.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {existingVideos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-earth-200 bg-earth-50/50 hover:bg-white hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-16 h-12 rounded-lg bg-forest-950 flex items-center justify-center overflow-hidden flex-shrink-0 border border-earth-200">
                          {video.thumbnail_url ? (
                            <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Film className="w-6 h-6 text-earth-300" />
                          )}
                          <button
                            type="button"
                            onClick={() => setPreviewModalVideo({ url: video.video_url, title: video.title || 'Product Video' })}
                            className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors text-white"
                            title="Play Video"
                          >
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-forest-900 truncate">
                            {video.title || video.file_name || 'Product Video'}
                          </p>
                          <p className="text-[10px] text-earth-400 truncate">
                            {video.file_name || 'Active video on product page'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModalVideo({ url: video.video_url, title: video.title || 'Product Video' })}
                          className="p-1.5 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors"
                          title="Preview video"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExistingVideo(video)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New video previews */}
            {newVideoPreviews.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-forest-700 font-semibold">New Videos to Upload ({newVideoPreviews.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {newVideoPreviews.map((vid, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl border border-dashed border-forest-300 bg-forest-50/40"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-16 h-12 rounded-lg bg-forest-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {vid.thumbnail ? (
                            <img src={vid.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Film className="w-6 h-6 text-earth-300" />
                          )}
                          <button
                            type="button"
                            onClick={() => setPreviewModalVideo({ url: vid.url, title: vid.name })}
                            className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors text-white"
                            title="Play Video"
                          >
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold bg-forest-600 text-white px-1.5 py-0.2 rounded">NEW</span>
                            <p className="text-xs font-semibold text-forest-900 truncate">{vid.name}</p>
                          </div>
                          <p className="text-[10px] text-earth-500">
                            {(vid.size / (1024 * 1024)).toFixed(1)} MB • Ready to upload
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModalVideo({ url: vid.url, title: vid.name })}
                          className="p-1.5 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors"
                          title="Preview video"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeNewVideo(i)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video File Input */}
            <div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                multiple
                onChange={handleVideoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-forest-300 rounded-xl hover:border-forest-500 hover:bg-forest-50/70 transition-colors text-sm text-forest-700 font-medium w-full justify-center bg-forest-50/20"
              >
                <Video className="w-4 h-4 text-forest-600" />
                Choose Videos (MP4, WEBM, MOV — max 100MB each)
              </button>
            </div>
          </div>

          {/* Upload progress */}
          {uploadProgress && (
            <div className="bg-forest-50 border border-forest-200 rounded-xl p-3 text-sm text-forest-700 flex items-center gap-2 animate-fade-in">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              {uploadProgress}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-earth-100">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                isEditing ? 'Update Product' : 'Create Product'
              )}
            </Button>
          </div>
        </form>

        {/* Admin Video Preview Modal */}
        {previewModalVideo && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-fade-in">
            <div className="bg-forest-950 text-white rounded-2xl overflow-hidden max-w-2xl w-full border border-forest-800 shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-forest-800 bg-forest-900/80">
                <div className="flex items-center gap-2 truncate">
                  <Film className="w-4 h-4 text-harvest-400" />
                  <span className="font-semibold text-sm truncate">{previewModalVideo.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModalVideo(null)}
                  className="p-1.5 hover:bg-forest-800 rounded-lg text-forest-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 bg-black flex items-center justify-center">
                <video
                  src={previewModalVideo.url}
                  controls
                  autoPlay
                  className="max-h-[65vh] w-full rounded-xl"
                />
              </div>
              <div className="p-3 bg-forest-900/60 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewModalVideo(null)}
                  className="border-forest-700 text-white hover:bg-forest-800"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
