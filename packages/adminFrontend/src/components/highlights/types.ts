export type Branch = {
  _id: string;
  branchId: string;
  name: string;
};

export type Slider = {
  _id: string;
  sliderId: string;
  title: string;
  imageUrl: { url: string };
  externalUrl: string;
  branchIds: string[];
  order: number;
  status: string;
};

export type SliderForm = {
  title: string;
  imageUrl: string | File | null;
  externalUrl: string;
  branchIds: string[];
  order: number;
  status: string;
  preview?: string;
};

export type Highlight = {
  _id: string;
  highlightId: string;
  title: string;
  description: string;
  image: { url: string | null | File | string } | null | File | string;
  link: string;
  startDate: string;
  endDate: string;
  branchIds: string[];
  priority: number;
  status: string;
  preview?: string;
};

export type HighlightForm = {
  title: string;
  description: string;
  image: string | File;
  link: string;
  startDate: string;
  endDate: string;
  branchIds: string[];
  priority: number;
  status: string;
  preview?: string;
};