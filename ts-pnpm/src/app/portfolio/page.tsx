'use client';

import * as React from 'react';
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider';
import { getApprovedPhotoSets } from '@/lib/portfolio';
import { PhotoSet, Photo } from '@prisma/client';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PhotoSetWithRelations = PhotoSet & {
  photos: Photo[];
};

const PortfolioPage = () => {
  const [photoSets, setPhotoSets] = React.useState<PhotoSetWithRelations[]>([]);
  const [filteredPhotoSets, setFilteredPhotoSets] = React.useState<
    PhotoSetWithRelations[]
  >([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  React.useEffect(() => {
    const fetchPhotoSets = async () => {
      const data = (await getApprovedPhotoSets()) as PhotoSetWithRelations[];
      setPhotoSets(data);
      setFilteredPhotoSets(data);

      const uniqueCategories = Array.from(
        new Set(data.map((ps: PhotoSetWithRelations) => ps.serviceCategory))
      );
      setCategories(uniqueCategories);
    };

    fetchPhotoSets();
  }, []);

  React.useEffect(() => {
    let result = photoSets;

    if (searchTerm) {
      result = result.filter(
        (ps: PhotoSetWithRelations) =>
          ps.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ps.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((ps: PhotoSetWithRelations) => ps.serviceCategory === selectedCategory);
    }

    setFilteredPhotoSets(result);
  }, [searchTerm, selectedCategory, photoSets]);

  const getPhotoUrl = (photos: Photo[], type: 'BEFORE' | 'AFTER') => {
    return photos.find((p) => p.type === type)?.url || '/images/placeholder.png';
  };

  return (
    <main className='container mx-auto px-4 py-8'>
      <div className='text-center mb-12'>
        <h1 className='text-4xl md:text-5xl font-bold font-serif mb-4'>
          Our Work
        </h1>
        <p className='text-lg md:text-xl text-gray-600 max-w-2xl mx-auto'>
          Browse through our portfolio of recently completed projects. Use the
          filters to find examples of specific services.
        </p>
      </div>

      <div className='flex flex-col md:flex-row gap-4 mb-8'>
        <Input
          placeholder='Search by title or description...'
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className='max-w-sm'
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className='w-full md:w-[180px]'>
            <SelectValue placeholder='Filter by category' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Categories</SelectItem>
            {categories.map((category: string) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {filteredPhotoSets.map((ps: PhotoSetWithRelations) => (
          <div
            key={ps.id}
            className='bg-white rounded-lg shadow-lg overflow-hidden'
          >
            <ReactCompareSlider
              itemOne={
                <ReactCompareSliderImage
                  src={getPhotoUrl(ps.photos, 'BEFORE')}
                  alt='Before image'
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src={getPhotoUrl(ps.photos, 'AFTER')}
                  alt='After image'
                />
              }
              className='h-64 w-full'
            />
            <div className='p-6'>
              <p className='text-sm font-semibold text-accent-gold uppercase tracking-wider'>
                {ps.serviceCategory}
              </p>
              <h3 className='text-2xl font-bold font-serif mt-2 mb-3'>
                {ps.title}
              </h3>
              <p className='text-gray-600 line-clamp-3'>{ps.description}</p>
            </div>
          </div>
        ))}
      </div>
      {filteredPhotoSets.length === 0 && (
        <div className='text-center py-16'>
          <p className='text-xl text-gray-500'>
            No projects found matching your criteria.
          </p>
        </div>
      )}
    </main>
  );
};

export default PortfolioPage; 