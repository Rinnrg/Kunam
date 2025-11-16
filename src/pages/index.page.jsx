/* eslint-disable react/jsx-props-no-spreading */
import Home from '@src/pages/components/home/Index';
import About from '@src/pages/components/about/Index';
import Quote from '@src/pages/components/quote/Index';
import Projects from '@src/pages/components/projects/Index';
import Clients from '@src/pages/components/clients/Index';
import CustomHead from '@src/components/dom/CustomHead';

const seo = {
  title: 'Kunam',
  description:
    'Self-taught front-end developer from Greece, crafting sleek and efficient web, desktop, and mobile apps. Combining creativity and technical skill to deliver innovative user-centric solutions.',
  keywords: [
    'Kunam',
    'Frontend',
    'Engineer',
    'Portfolio',
    'Web Development',
    'React Developer',
    'Developer',
    'Web Applications',
    'Responsive Design',
    'Progressive Web Apps',
    'Freelance Developer',
    'Modern Web Development',
    'cross-platform development',
    'Greek',
    'JavaScript',
    'Typescript',
    'Next.js',
    'React',
    'React Native',
    'Electron js',
    'HTML',
    'CSS',
  ],
};

function Page() {
  return (
    <>
      <CustomHead {...seo} />
      <Home />
      <About />
      <Clients />
      <Quote />
      <Projects />
    </>
  );
}

export default Page;
