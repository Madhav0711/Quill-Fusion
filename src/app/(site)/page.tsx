import React from 'react';
import Image from 'next/image';

import TitleSection from '@/components/landing-page/title-section';
import { Button } from '@/components/ui/button';
import { CLIENTS, PRICING_CARDS, PRICING_PLANS, USERS } from '@/lib/constants';
import CustomCard from '@/components/landing-page/custom-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CardContent, CardDescription, CardTitle } from '@/components/ui/card';

import { twMerge } from 'tailwind-merge';
import { randomUUID } from 'crypto';
import clsx from 'clsx';

import Banner from '../../../public/appBanner.png';
import Cal from '../../../public/cal.png';
import Diamond from '../../../public/icons/diamond.svg';
import CheckIcon from '../../../public/icons/check.svg';

const HomePage = () => {
  return (
    <>
      <section className="mt-20 flex animate-fade-in-up flex-col items-center justify-center gap-6 px-4 sm:px-6">
        <TitleSection
          pill="💎 Your Workspace, Upgraded"
          title="The All-In-One Platform for Modern Collaboration"
          subheading="Seamlessly integrate notes, tasks, and projects. All powered by a touch of AI."
        />

        <div
          className="
            group 
            relative  
            mt-8  
            rounded-xl  
            bg-gradient-to-r  
            from-sky-500  
            to-cyan-400  
            p-0.5  
            shadow-[0_0_40px_-10px_theme(colors.sky.500)] 
            transition-all  
            hover:scale-105  
            hover:shadow-[0_0_60px_-15px_theme(colors.cyan.400)]
          "
        >
          <Button
            variant="secondary"
            className="w-full rounded-[10px] bg-background p-5 text-xl font-semibold text-white/90 transition-all group-hover:text-white"
          >
            🚀 Get Quill Fusion
          </Button>
        </div>

        <div className="relative mt-12 w-full max-w-[850px]">
          <Image src={Banner} alt="Application Banner" />
          <div className="absolute inset-x-0 bottom-0 top-[50%] z-10 bg-gradient-to-t from-background to-transparent"></div>
        </div>
      </section>

      <section className="relative mt-24">
        <div
          className="
            relative  
            flex  
            overflow-hidden  
            before:absolute  
            before:left-0  
            before:top-0  
            before:z-10  
            before:h-full  
            before:w-20  
            before:bg-gradient-to-r  
            before:from-background  
            before:to-transparent  
            before:content-['']  
            after:absolute  
            after:right-0  
            after:top-0  
            after:z-10  
            after:h-full  
            after:w-20  
            after:bg-gradient-to-l  
            after:from-background  
            after:to-transparent  
            after:content-['']
          "
        >
          {[...Array(2)].map((_, index) => (
            <div key={index} className="flex flex-nowrap animate-slide">
              {CLIENTS.map((client) => (
                <div
                  key={`${client.alt}-${index}`}
                  className="relative mx-10 flex w-[200px] shrink-0 items-center"
                >
                  <Image
                    src={client.logo}
                    alt={client.alt}
                    width={150}
                    className="max-w-none object-contain"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="relative mt-28 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="absolute -top-10 -z-10 h-32 w-[30%] rounded-full bg-sky-500/30 blur-[120px]" />

        <TitleSection
          title="All Your Meetings, In One Place"
          subheading="Capture ideas, thoughts, and notes in a structured and organized manner."
          pill="Features"
        />

        <div
          className="
            relative  
            mt-10  
            max-w-[450px]  
            rounded-2xl  
            border-4  
            border-blue-500/10
            p-1 
            shadow-2xl 
            shadow-sky-500/20
          "
        >
          <Image src={Cal} alt="Calendar feature" className="rounded-xl" />
        </div>
      </section>

      <section id="testimonials" className="relative">
        <div
          className="w-full 
          blur-[120px] 
          rounded-full 
          h-32 
          absolute 
          bg-sky-500/50 
          -z-10 
          top-56
        "
        />
        <div
          className="mt-20 
          px-4 
          sm:px-6  
          flex 
          flex-col 
          overflow-x-hidden 
          overflow-visible
        "
        >
          <TitleSection
            title="Trusted by all"
            subheading="Join thousands of satisfied users who rely on our platform for their  
            personal and professional productivity needs."
            pill="Testimonials"
          />
          {[...Array(2)].map((arr, index) => (
            <div
              key={randomUUID()}
              className={twMerge(
                clsx('mt-10 flex flex-nowrap gap-6 self-start', {
                  'flex-row-reverse': index === 1,
                  'animate-[slide_150s_linear_infinite]': true,
                  'animate-[slide_150s_linear_infinite_reverse]': index === 1,
                  'ml-[100vw]': index === 1,
                }),
                'hover:paused'
              )}
            >
              {USERS.map((testimonial, userIndex) => (
                <CustomCard
                  key={testimonial.name}
                  className="w-[500px] 
                  shrink-0s 
                  rounded-xl 
                  dark:bg-gradient-to-t 
                  dark:from-border dark:to-background
                "
                  cardHeader={
                    <div
                      className="flex 
                      items-center 
                      gap-4
                    "
                    >
                      <Avatar>
                        <AvatarImage
                          src={`/avatars/${
                            ((userIndex * 5 + 3) % USERS.length) + 1
                          }.png`}
                        />
                        <AvatarFallback>AV</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-foreground">
                          {testimonial.name}
                        </CardTitle>
                        <CardDescription className="dark:text-sky-300">
                          {testimonial.name.toLocaleLowerCase()}
                        </CardDescription>
                      </div>
                    </div>
                  }
                  cardContent={
                    <p className="dark:text-sky-300">{testimonial.message}</p>
                  }
                ></CustomCard>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mt-20 px-4 sm:px-6">
        <TitleSection
          title="The Perfect Plan For You"
          subheading="Experience all the benefits of our platform. Select a plan that suits your needs and take your productivity to new heights."
          pill="Pricing"
        />
        <div
          className="flex  
        flex-col-reverse 
        sm:flex-row 
        gap-4 
        justify-center 
        sm:items-stretch 
        items-center 
        mt-10
        "
        >
          {PRICING_CARDS.map((card) => (
            <CustomCard
              key={card.planType}
              className={clsx(
                'w-[300px] rounded-2xl dark:bg-black/40 background-blur-3xl relative',
                {
                  'border-sky-500/70':
                    card.planType === PRICING_PLANS.proplan,
                }
              )}
              cardHeader={
                <CardTitle
                  className="text-2xl 
                  font-semibold
                "
                >
                  {card.planType === PRICING_PLANS.proplan && (
                    <>
                      <div
                        className="hidden dark:block w-full blur-[120px] rounded-full h-32 
                        absolute 
                        bg-sky-600/80 
                        -z-10 
                        top-0
                      "
                      />
                      <Image
                        src={Diamond}
                        alt="Pro Plan Icon"
                        className="absolute top-6 right-6"
                      />
                    </>
                  )}
                  {card.planType}
                </CardTitle>
              }
              cardContent={
                <CardContent className="p-0">
                  <span
                    className="font-normal  
                    text-2xl
                  "
                  >
                    ${card.price}
                  </span>
                  {+card.price > 0 ? (
                    <span className="dark:text-sky-300 ml-1">/mo</span>
                  ) : (
                    ''
                  )}
                  <p className="dark:text-sky-300">{card.description}</p>
                  <Button
                    variant="default"
                    className="whitespace-nowrap w-full mt-4"
                  >
                    {card.planType === PRICING_PLANS.proplan
                      ? 'Go Pro'
                      : 'Get Started'}
                  </Button>
                </CardContent>
              }
              cardFooter={
                <ul
                  className="font-normal 
                  flex 
                  mb-2 
                  flex-col 
                  gap-4
                "
                >
                  <small>{card.highlightFeature}</small>
                  {card.freatures.map((feature) => (
                    <li
                      key={feature}
                      className="flex 
                      items-center 
                      gap-2
                    "
                    >
                      <Image src={CheckIcon} alt="Check Icon" />
                      {feature}
                    </li>
                  ))}
                </ul>
              }
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;