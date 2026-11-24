export const lightColors = {
  ink: '#3A0A16',
  heading: '#3A0A16',
  primary: '#7F0020',
  accentGold: '#C9A24B',
  navBar: '#2A0A14',
  softTint: '#F3E6E8',
  border: '#E8D8D2',
  graphite: '#1A1A1F',
  paper: '#F7F4EE',
  paperElevated: '#FCFBF8',
  paperCard: '#FFFFFF',
  line: '#E8D8D2',
  lineSubtle: '#EDE8DF',
  accent: '#7F0020',
  accentSoft: '#F3E6E8',
  textMuted: '#8A8794',
  textLight: '#B8B5C0',
  overlay: 'rgba(14, 14, 16, 0.45)',
  canvasGrid: 'rgba(227, 221, 209, 0.6)',
  danger: '#E05656',
  surfaceGhost: 'rgba(14, 14, 16, 0.04)',
  canvasPaper: '#F7F4EE',
};

export const darkColors = {
  ink: '#F5F5F7',
  heading: '#F5F5F7',
  primary: '#7F0020',
  accentGold: '#C9A24B',
  navBar: '#2A0A14',
  softTint: '#3A0A16',
  border: '#3A141F',
  graphite: '#D1CFD7',
  paper: '#141416',
  paperElevated: '#1D1D22',
  paperCard: '#22222A',
  line: '#32323D',
  lineSubtle: '#282832',
  accent: '#C9A24B',
  accentSoft: '#3A0A16',
  textMuted: '#9491A0',
  textLight: '#625F6D',
  overlay: 'rgba(0, 0, 0, 0.65)',
  canvasGrid: 'rgba(227, 221, 209, 0.6)',
  danger: '#F87171',
  surfaceGhost: 'rgba(255, 255, 255, 0.06)',
  // Canvas ALWAYS stays paper in both themes per hard rule!
  canvasPaper: '#F7F4EE',
};

export const colors = lightColors;

export type ColorTheme = typeof lightColors;
export type ColorKey = keyof typeof lightColors;
