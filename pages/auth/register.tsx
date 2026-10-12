import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../helpers/useAuth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Wind } from 'lucide-react';
import styles from './auth.module.css';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  companyName: z.string().min(1, 'Company name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
      });
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Wind className={styles.logoIcon} />
          <span className={styles.logoText}>CompressedAir.AI</span>
        </div>

        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Start monitoring your compressed air systems</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="firstName" className={styles.label}>
                First name
              </label>
              <Input
                id="firstName"
                placeholder="John"
                {...register('firstName')}
              />
              {errors.firstName && (
                <span className={styles.fieldError}>{errors.firstName.message}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="lastName" className={styles.label}>
                Last name
              </label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register('lastName')}
              />
              {errors.lastName && (
                <span className={styles.fieldError}>{errors.lastName.message}</span>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              {...register('email')}
            />
            {errors.email && (
              <span className={styles.fieldError}>{errors.email.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="companyName" className={styles.label}>
              Company name
            </label>
            <Input
              id="companyName"
              placeholder="Acme Manufacturing"
              {...register('companyName')}
            />
            {errors.companyName && (
              <span className={styles.fieldError}>{errors.companyName.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <span className={styles.fieldError}>{errors.password.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <span className={styles.fieldError}>{errors.confirmPassword.message}</span>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className={styles.submitButton}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/auth/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
