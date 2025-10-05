import React, { useState } from 'react';
import Button from '../components/Button';
import { generateListingDescription } from '../services/geminiService';
import { ArrowLeft, UploadCloud, Wand2, Package, Calendar, Ticket, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { BentoSize, ListingType } from '../types';

const CATEGORIES = ['Art', 'Decor', 'Fashion', 'Furniture', 'Music', 'Services', 'Classes', 'Dining'];

const listingTypeOptions = {
    ITEM: { label: 'Item for Sale', icon: Package },
    SERVICE: { label: 'Service for Booking', icon: Calendar },
    // FIX: Changed 'EXPERIENCE' to 'EVENT' to align with PostType.
    EVENT: { label: 'Event', icon: Ticket },
    PLACE: { label: 'Place/Venue', icon: MapPin },
};

const CreateListingPage: React.FC = () => {
  const [listingType, setListingType] = useState<ListingType | null>(null);

  // Common state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [category, setCategory] = useState<string>('');
  const [tags, setTags] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Type-specific state
  const [price, setPrice] = useState('');
  // FIX: Aligned price unit state with the PriceInfo type definition (using underscores).
  const [priceUnit, setPriceUnit] = useState<'per_item' | 'per_hour' | 'per_ticket' | 'fixed'>('per_item');
  const [bentoSize, setBentoSize] = useState<BentoSize>('1x1');
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [duration, setDuration] = useState('');

  const navigate = useNavigate();

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    }
  };

  const handleGenerateDescription = async () => {
    if (!title) {
        alert("Please enter a title first.");
        return;
    }
    setIsGenerating(true);
    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
    const generatedDesc = await generateListingDescription(title, tagArray);
    setDescription(generatedDesc);
    setIsGenerating(false);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`New ${listingType?.toLowerCase()} listing created successfully! (Mock)`);
    navigate('/');
  };
  
  const handleSelectType = (type: ListingType) => {
    setListingType(type);
    // Set default price units for convenience
    // FIX: Aligned price units with the PriceInfo type definition.
    if (type === 'SERVICE') setPriceUnit('per_hour');
    else if (type === 'EVENT') setPriceUnit('per_ticket');
    else if (type === 'PLACE') setPriceUnit('fixed');
    else setPriceUnit('per_item');
  }

  // Render the initial type selection screen
  if (!listingType) {
    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex items-center mb-6">
                <Link to="/" className="p-2 rounded-full hover:bg-gray-100 mr-2"><ArrowLeft size={24}/></Link>
                <h1 className="text-2xl font-bold">What would you like to list?</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(listingTypeOptions) as ListingType[]).map(type => {
                    const { label, icon: Icon } = listingTypeOptions[type];
                    return (
                        <button
                            key={type}
                            onClick={() => handleSelectType(type)}
                            className="text-left p-6 bg-white rounded-xl shadow-sm hover:shadow-md hover:border-pan-red border-2 border-transparent transition-all flex items-center gap-4"
                        >
                            <Icon size={32} className="text-pan-red"/>
                            <div>
                                <h2 className="font-bold text-lg text-gray-800">{label}</h2>
                                <p className="text-sm text-gray-500">List {label.split(' ')[0].toLowerCase()}s on the marketplace.</p>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
  }

  // Render the form once a type is selected
  return (
    <div className="container mx-auto px-4 py-6">
       <div className="flex items-center mb-6">
         <button onClick={() => setListingType(null)} className="p-2 rounded-full hover:bg-gray-100 mr-2">
            <ArrowLeft size={24}/>
         </button>
         <h1 className="text-2xl font-bold">List a new {listingTypeOptions[listingType].label.split(' ')[0]}</h1>
       </div>

      <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              {mediaPreview ? (
                <div className="relative group w-full h-48 rounded-xl overflow-hidden bg-gray-200 flex justify-center items-center">
                  {mediaType === 'video' ? (
                    <video 
                      src={mediaPreview} 
                      className="w-full h-full object-contain bg-black" 
                      controls // This provides functional play/pause controls.
                      playsInline 
                    />
                  ) : (
                    <img 
                      src={mediaPreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                  )}
                  {/* The overlay is now just a visual element that doesn't intercept clicks, ensuring video controls are always accessible. */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                   {/* The clickable "Change" button is centered and doesn't block underlying controls */}
                  <label htmlFor="media-upload" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                      <div className="flex flex-col items-center">
                          <UploadCloud size={40} />
                          <span className="mt-2 font-semibold">Change Media</span>
                      </div>
                  </label>
                </div>
              ) : (
                <label htmlFor="media-upload" className="cursor-pointer block w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col justify-center items-center text-gray-500 hover:border-pan-red hover:text-pan-red transition-colors">
                  <UploadCloud size={40} />
                  <span className="mt-2 font-semibold">Upload Image or Video</span>
                </label>
              )}
              <input id="media-upload" type="file" className="hidden" onChange={handleMediaChange} accept="image/*,video/*" required />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pan-red" required />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                        <button key={cat} type="button" onClick={() => setCategory(cat)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${category === cat ? 'bg-pan-red text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-1">
                     <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                     <button type="button" onClick={handleGenerateDescription} disabled={isGenerating || !title} className="flex items-center gap-1 text-sm text-pan-red font-semibold hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Wand2 size={16} /> {isGenerating ? 'Generating...' : 'Generate with AI'}
                     </button>
                </div>
              <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pan-red" required />
            </div>
            
            {/* FIX: Changed 'EXPERIENCE' to 'EVENT' */}
            {listingType === 'EVENT' && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                        <input type="text" id="datetime" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Sat, Aug 17 @ 2pm" />
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 123 Art Studio" />
                    </div>
                </div>
            )}
            
            {listingType === 'SERVICE' && (
                 <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Service Duration</label>
                    <input type="text" id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 1 hour" />
                 </div>
            )}
            
            {listingType === 'PLACE' && (
                 <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Address / Location</label>
                    <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 456 Vine Street" />
                 </div>
            )}

            {listingType !== 'PLACE' && (
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                        {/* FIX: Aligned price unit display with the PriceInfo type definition. */}
                        Price ($) - {priceUnit.replace('per_', '')}
                    </label>
                    <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0.00" required />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="furniture, vintage" />
                </div>
            </div>
            
            {listingType === 'ITEM' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Size</label>
                    <p className="text-xs text-gray-500 mb-2">Choose how your listing appears on the homepage grid.</p>
                    <div className="grid grid-cols-4 gap-3">
                      {(['1x1', '2x1', '1x2', '2x2'] as BentoSize[]).map((size) => (
                        <button key={size} type="button" onClick={() => setBentoSize(size)} className={`flex items-center justify-center font-mono text-sm rounded-lg border-2 p-4 transition-colors ${bentoSize === size ? 'border-pan-red bg-pan-red/10 text-pan-red font-bold' : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'}`}>
                          {size}
                        </button>
                      ))}
                    </div>
                </div>
            )}
            
            <div className="pt-4">
                <Button type="submit">Post Listing</Button>
            </div>
      </form>
    </div>
  );
};

export default CreateListingPage;
