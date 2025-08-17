import React from 'react';

interface TitleSectionProps {
  title: string;
  subheading?: string;
  pill: string;
}

const TitleSection: React.FC<TitleSectionProps> = ({
  title,
  subheading,
  pill, 
}) => {
  return (
    <section
      className="flex flex-col gap-4 justify-center items-start md:items-center"
    >
      <article
        className="rounded-full p-[1px] text-sm font-medium dark:bg-gradient-to-r dark:from-brand-primaryBlue dark:to-brand-primaryPurple
                   transform hover:scale-105 transition-transform duration-300" 
      >
        <div className="rounded-full px-3 py-1 dark:bg-slate-950">
          {pill}
        </div>
      </article>

      {subheading ? (
        <>
          <h2
            className="text-left text-3xl sm:text-5xl sm:max-w-[750px] md:text-center font-semibold"
          >
            {title}
          </h2>
          <p
            className="text-slate-500 dark:text-slate-400 sm:max-w-[450px] md:text-center" 
          >
            {subheading}
          </p>
        </>
      ) : (
        <h1
          className="text-left text-4xl sm:text-6xl sm:max-w-[850px] md:text-center font-semibold
                     dark:bg-gradient-to-r dark:from-slate-200 dark:to-gray-400 dark:text-transparent dark:bg-clip-text" 
        >
          {title}
        </h1>
      )}
    </section>
  );
};

export default TitleSection;