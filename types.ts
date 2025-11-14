
export interface Verse {
  verse: number;
  text: string;
}

export interface Chapter {
  book: string;
  chapter: number;
  verses: Verse[];
}

export interface Book {
  name: string;
  chapters: number;
}
