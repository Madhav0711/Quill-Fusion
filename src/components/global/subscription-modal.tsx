'use client'
import { useSubscriptionModal } from '@/lib/providers/subscription-modal-provider'
import React, { useState } from 'react';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { Button } from '../ui/button';
import { formatPrice, postData } from '@/lib/utils';
import Loader from './Loader';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Price, ProductWithPrice } from '@/lib/supabase/supabase.types';
import { toast } from 'sonner';
import {getStripe} from '@/lib/stripe/stripeClient';

interface SubscriptionModalProps {
    products: ProductWithPrice[];
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ products }) => {
    const { open, setOpen } = useSubscriptionModal();
    const { subscription, user } = useSupabaseUser();
    const [isLoading, setIsLoading] = useState(false);

    const onClickContinue = async (price: Price) => {
        try {
            setIsLoading(true);
            if (!user) {
                toast('You must be logged in');
                setIsLoading(false);
                return;
            }
            if (subscription) {
                toast('Already on a paid plan');
                setIsLoading(false);
                return;
            }
            const { sessionId } = await postData({
                url: '/api/create-checkout-session',
                data: { price },
            });

            console.log('Getting Checkout for stripe');
            const stripe = await getStripe();
            stripe?.redirectToCheckout({ sessionId });
        } catch (error) {
            toast('Oops! Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {subscription?.status === 'active' ? (
                <DialogContent className="text-center p-8">
                    <h2 className="text-xl font-semibold text-green-500">
                        🎉 You’re already on a Pro Plan!
                    </h2>
                </DialogContent>
            ) : (
                <DialogContent className="max-w-md rounded-2xl p-8 shadow-lg">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-2xl font-bold text-center">
                            Upgrade to Pro ✨
                        </DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground">
                            Unlock premium features and take your experience to the next level.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-6 space-y-4">
                        {products.length ? (
                            products.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex justify-between items-center rounded-lg border p-4 hover:shadow-md transition"
                                >
                                    {product.prices?.map((price) => (
                                        <React.Fragment key={price.id}>
                                            <div>
                                                <span className="text-2xl font-semibold text-foreground">
                                                    {formatPrice(price)}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    / {price.interval}
                                                </span>
                                            </div>
                                            <Button
                                                onClick={() => onClickContinue(price)}
                                                disabled={isLoading}
                                                className="px-6 py-2 text-base"
                                            >
                                                {isLoading ? <Loader /> : 'Upgrade'}
                                            </Button>
                                        </React.Fragment>
                                    ))}
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-sm text-muted-foreground">
                                No subscription plans available at the moment.
                            </p>
                        )}
                    </div>
                </DialogContent>
            )}
        </Dialog>
    )
}

export default SubscriptionModal;
