const ICONIFY_API = 'https://api.iconify.design';

export interface IconifySearchResponse {
  icons: string[];
  total: number;
  start?: number;
  limit?: number;
  collections?: Record<string, {
    name: string;
    total: number;
    author: {
      name: string;
      url: string;
    };
    license: {
      title: string;
      spdx: string;
      url: string;
    };
    samples: string[];
    height: number | number[];
    displayHeight?: number;
    category?: string;
    palette?: boolean;
  }>;
}

export interface IconifyIconInfo {
  prefix: string;
  icon: string;
  width?: number;
  height?: number;
  body: string;
  left?: number;
  top?: number;
  rotate?: number;
  hFlip?: boolean;
  vFlip?: boolean;
}

export const iconifyService = {
  async searchIcons(query: string, limit = 24): Promise<IconifySearchResponse> {
    const response = await fetch(
      `${ICONIFY_API}/search?query=${encodeURIComponent(query)}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error('Error searching icons');
    }
    return response.json();
  },

  async getIconSvg(prefix: string, name: string): Promise<string> {
    const response = await fetch(`${ICONIFY_API}/${prefix}/${name}.svg`);
    if (!response.ok) {
      throw new Error('Error fetching icon');
    }
    return response.text();
  },

  getIconUrl(prefix: string, name: string): string {
    return `${ICONIFY_API}/${prefix}/${name}.svg`;
  },

  parseIconName(iconName: string): { prefix: string; name: string } | null {
    const parts = iconName.split(':');
    if (parts.length !== 2) return null;
    return { prefix: parts[0], name: parts[1] };
  },
};
