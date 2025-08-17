import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { cn } from '@/lib/utils';

type CardProps = React.ComponentProps<typeof Card>;

type CustomCardProps = CardProps & {
  cardHeader?: React.ReactNode;
  cardContent?: React.ReactNode;
  cardFooter?: React.ReactNode;
};

const CustomCard: React.FC<CustomCardProps> = ({
  className,
  cardHeader,
  cardContent,
  cardFooter,
  ...props
}) => {
  return (
    <Card
      className={cn(
        `w-full max-w-sm rounded-2xl border border-border bg-background/60 
         p-4 shadow-xl transition-all duration-300 hover:scale-[1.015] 
         dark:shadow-slate-800/40 backdrop-blur-md`,
        className
      )}
      {...props}
    >
      {cardHeader && (
        <CardHeader className="pb-2 text-xl font-semibold text-foreground">
          {cardHeader}
        </CardHeader>
      )}

      {cardContent && (
        <CardContent className="space-y-3 text-muted-foreground">
          {cardContent}
        </CardContent>
      )}

      {cardFooter && (
        <CardFooter className="pt-4">{cardFooter}</CardFooter>
      )}
    </Card>
  );
};

export default CustomCard;
