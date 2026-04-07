export interface ImageModelInfo {
  id: string;
  displayName: string;
  badge?: string;
  badgeVariant?: 'success' | 'info' | 'warning' | 'default';
  estimatedSeconds: number;
}

export interface VideoModelInfo {
  id: string;
  displayName: string;
  badge?: string;
  badgeVariant?: 'success' | 'info' | 'warning' | 'default';
  estimatedSeconds: number;
}
