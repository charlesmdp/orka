const logos={shopify:'/assets/shopify-bag.svg',wordpress:'/assets/wordpress-roundel.svg',wix:'/assets/platform-logos/wix.ico',carrd:'/assets/platform-logos/carrd.ico'};
export const platformLogo=id=>logos[id]||`/assets/platform-logos/${id}.png`;
