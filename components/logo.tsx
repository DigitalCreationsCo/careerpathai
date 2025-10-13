import logoSm from '@/app/favicon-32x32.png'
import logoLg from '@/app/android-chrome-192x192.png'

export const Logo = ({size = "md"}) => {
    switch(size) {
      case "sm":
        return <img src={logoSm.src} height={24} width={24} className='pt-1' />;
      case "md":
        return <img src={logoSm.src} className='pt-1' />;
      case "lg":
        return <img src={logoLg.src} height={60} width={60} className='pt-1' />;
    };
};