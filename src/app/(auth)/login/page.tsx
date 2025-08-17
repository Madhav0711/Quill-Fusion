'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '../../../../public/ffLgo.png';
import Loader from '@/components/global/Loader';
import { actionLoginUser } from '@/lib/server-actions/auth-actions'; // We will use a server action

// 1. Define the schema locally and correctly
const FormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, 'Password is required.'),
});

type FormSchemaValues = z.infer<typeof FormSchema>;

const LoginPage = () => {
  const router = useRouter();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormSchemaValues>({
    resolver: zodResolver(FormSchema),
  });

  // 2. The onSubmit handler is clean and calls a server action
  const onSubmit: SubmitHandler<FormSchemaValues> = async (formData) => {
    const { error } = await actionLoginUser(formData);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    // The server action will handle the redirect
  };

  return (
    // 3. Use a plain <form> with .register() for each input
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full sm:justify-center sm:w-[400px] space-y-6 flex flex-col"
    >
      <Link href="/" className="w-full flex justify-left items-center">
        <Image src={Logo} alt="quill.fusion Logo" width={50} height={50} />
        <span className="font-semibold dark:text-white text-4xl ml-2">
          Quill.Fusion
        </span>
      </Link>
      <p className="text-foreground/65">
        The All-In-One Platform for Modern Collaboration
      </p>

      {/* Email Input */}
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

      {/* Password Input */}
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

      {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
      
      <button type="submit" className="w-full p-3 bg-primary rounded-md" disabled={isSubmitting}>
        {isSubmitting ? <Loader /> : 'Login'}
      </button>

      <span className="self-center text-sm">
        Don't have an account?{' '}
        <Link href="/signup" className="text-primary hover:underline">
          Sign Up
        </Link>
      </span>
    </form>
  );
};

export default LoginPage;