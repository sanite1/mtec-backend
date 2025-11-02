export interface Storefront {
  _id?: string;
  userId: string;
  theme?: string;

  banner?: { title?: string; image?: string };
  about?: { title?: string; content?: string };
  contact?: { email?: string; phone?: string; address?: string };
  location?: { address?: string };
  newsletter?: { headline?: string; subtext?: string; img?: string };
  returnPolicy?: { content?: string };

  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };

  customMessage?: { message?: string };
  productVariation?: { enabled: boolean };
  whatsapp?: { number?: string };

  createdAt?: Date;
  updatedAt?: Date;
}
