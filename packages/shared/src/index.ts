// Shared types for StoryStack

export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  authorId: string;
  status: StoryStatus;
  rating: ContentRating;
  wordCount: number;
  chapterCount: number;
  viewCount: number;
  likeCount: number;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface Chapter {
  id: string;
  storyId: string;
  title: string;
  content: string;
  chapterNumber: number;
  wordCount: number;
  authorNotesBefore?: string;
  authorNotesAfter?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  canonicalName: string;
  type: TagType;
  synonyms?: string[];
}

export enum StoryStatus {
  DRAFT = 'draft',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  HIATUS = 'hiatus',
}

export enum ContentRating {
  GENERAL = 'general',
  TEEN = 'teen',
  MATURE = 'mature',
  EXPLICIT = 'explicit',
}

export enum TagType {
  GENRE = 'genre',
  THEME = 'theme',
  CHARACTER = 'character',
  RELATIONSHIP = 'relationship',
  WARNING = 'warning',
  ADDITIONAL = 'additional',
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  storyId?: string;
  chapterId?: string;
  parentId?: string; // For nested comments
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadingProgress {
  userId: string;
  storyId: string;
  chapterId: string;
  position: number; // Character offset or percentage
  lastReadAt: Date;
}
