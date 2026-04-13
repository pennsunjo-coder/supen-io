export const CONTENT_TO_ICON: Record<string, string> = {
  productivity: 'clock', planning: 'clipboard', goals: 'target',
  growth: 'chart', strategy: 'target', focus: 'brain',
  learning: 'book', course: 'book', skill: 'gear', education: 'book',
  ai: 'brain', tech: 'phone', automation: 'gear', code: 'gear',
  marketing: 'chart', social: 'pin', content: 'clipboard', business: 'chart',
  tip: 'lightbulb', pro_tip: 'lightbulb', warning: 'cross', success: 'check',
  default: 'target',
};

export function getIconForSection(sectionTitle: string, category: string): string {
  const title = sectionTitle.toLowerCase();
  for (const [keyword, icon] of Object.entries(CONTENT_TO_ICON)) {
    if (title.includes(keyword)) return icon;
  }
  return CONTENT_TO_ICON[category] || CONTENT_TO_ICON.default;
}
