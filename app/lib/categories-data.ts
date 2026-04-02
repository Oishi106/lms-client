export interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  pill: 'pill-gold' | 'pill-teal' | 'pill-violet' | 'pill-rose';
}

export const CATEGORIES_STORAGE_KEY = 'skillforge_homepage_categories';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'web-development', label: 'Web Development', pill: 'pill-gold', icon: '🌐' },
  { id: 'data-analytics', label: 'Data & Analytics', pill: 'pill-teal', icon: '📈' },
  { id: 'ai-machine-learning', label: 'AI & Machine Learning', pill: 'pill-violet', icon: '🤖' },
  { id: 'ui-ux-design', label: 'UI/UX Design', pill: 'pill-rose', icon: '🎨' },
  { id: 'cloud-devops', label: 'Cloud & DevOps', pill: 'pill-teal', icon: '☁️' },
  { id: 'cyber-security', label: 'Cyber Security', pill: 'pill-rose', icon: '🛡️' },
  { id: 'mobile-development', label: 'Mobile Development', pill: 'pill-gold', icon: '📱' },
  { id: 'business', label: 'Business', pill: 'pill-violet', icon: '💼' },
];
