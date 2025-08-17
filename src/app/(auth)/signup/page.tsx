'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '../../../../public/ffLgo.png';
import Loader from '@/components/global/Loader';

const SignUpFormSchema = z
  .object({
    email: z.string().email({ message: 'Invalid Email' }),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

type SignUpFormValues = z.infer<typeof SignUpFormSchema>;

const Signup = () => {
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpFormSchema),
  });

  const onSubmit: SubmitHandler<SignUpFormValues> = async (formData) => {
    setSubmitError(''); // Clear previous errors

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    if (response.ok) {
      window.location.href = '/login?message=Account created. Please log in.';
    } else {
      const errorData = await response.json();
      setSubmitError(errorData.error || 'An unexpected error occurred.');
    }
  };



  if (isSubmitted) {
    return (
      <div className="w-full sm:w-[400px] text-center p-6 space-y-4">
        <h2 className="text-2xl font-semibold">✅ Check your email</h2>
        <p className="text-foreground/80">
          We've sent a confirmation link to your email address. Please click the link in the email to complete your registration.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full sm:justify-center sm:w-[400px] space-y-6 flex flex-col"
    >
      <Link href="/" className="w-full flex justify-left items-center">
        <Image src={Logo} alt="quill.fusion logo" width={50} height={50} />
        <span className="font-semibold dark:text-white text-4xl ml-2">
          Quill.Fusion
        </span>
      </Link>

      <div className="space-y-1">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="Email"
          className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Password"
          className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button type="submit" className="w-full p-3 bg-primary rounded-md" disabled={isSubmitting}>
        {isSubmitting ? <Loader /> : 'Create Account'}
      </button>

      {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
    </form>
  );
};

export default Signup;