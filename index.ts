export type PostCategory = 'Blog' | 'Article' | 'Novel Episode';
export type ContentLanguage = 'en' | 'ur' | 'both';
export type PostStatus = 'draft' | 'published';

export interface Post {
  id: string;
  titleEn: string;
  titleUr: string;
  slug: string;
  excerptEn: string;
  excerptUr: string;
  contentEn: string;
  contentUr: string;
  category: PostCategory;
  seriesId: string | null;
  episodeNumber: number | null;
  language: ContentLanguage;
  coverImageUrl: string;
  status: PostStatus;
  readingTimeMinutes: number;
  authorId: string;
  authorName: string;
  createdAt: any;
  updatedAt: any;
}

export interface Series {
  id: string;
  nameEn: string;
  nameUr: string;
  descriptionEn: string;
  descriptionUr: string;
  coverImageUrl: string;
  language: ContentLanguage;
  createdAt: any;
  episodeCount?: number;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin';
  createdAt?: any;
}
