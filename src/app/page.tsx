import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/auth/signin');
  return null;
} 