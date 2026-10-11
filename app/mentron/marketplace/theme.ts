// ─────────────────────────────────────────────────────────────────────────────
// MARKETPLACE THEME (Web Port of Flutter MarketplaceTheme)
// Matches mentron_flutter/lib/core/theme/marketplace_theme.dart
// ─────────────────────────────────────────────────────────────────────────────

export const MarketplaceTheme = {
  ink: '#2C2A45',
  body: '#8D8AA0',
  coral: '#FF7A4D',
  coralSoft: '#FFE3D6',
  purple: '#7B6EF6',
  purpleMid: '#9C7FF2',
  purpleSoft: '#EDEAFF',
  surface: '#FFFFFF',
  background: '#F6F4FC',

  // 135deg linear-gradient: purple -> mid-purple -> coral
  heroGradient: 'linear-gradient(135deg, #7B6EF6 0%, #9C7FF2 50%, #FF7A4D 100%)',
  purpleGradient: 'linear-gradient(135deg, #7B6EF6 0%, #9C7FF2 100%)',
  coralGradient: 'linear-gradient(135deg, #FF7A4D 0%, #FFAA80 100%)',
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'textbook':
      return 'TEXTBOOK'
    case 'electronics':
      return 'ELECTRONICS'
    case 'project_components':
      return 'PROJECT PARTS'
    case 'stationery':
      return 'STATIONERY'
    default:
      return 'OTHER'
  }
}

export function getConditionBadgeStyles(condition: string): { bg: string; text: string; label: string } {
  switch (condition?.toLowerCase()) {
    case 'new':
      return {
        bg: 'bg-[#EDEAFF]',
        text: 'text-[#7B6EF6]',
        label: 'NEW',
      }
    case 'like_new':
      return {
        bg: 'bg-[#DCFCE7]',
        text: 'text-[#16A34A]',
        label: 'LIKE NEW',
      }
    default:
      return {
        bg: 'bg-[#FFE3D6]',
        text: 'text-[#FF7A4D]',
        label: 'USED',
      }
  }
}
