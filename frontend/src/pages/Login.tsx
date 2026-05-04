import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useLoginMutation } from '../hooks'
import { useAuthStore } from '../stores/authStore'

const LoginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof LoginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.login)
  const loginMutation = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const session = await loginMutation.mutateAsync(values)
    setAuth(session)
    navigate('/crm', { replace: true })
  })

  return (
    <div className="flex min-h-screen items-center justify-center p-6 app-grid">
      <div className="w-full max-w-md rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel backdrop-blur">
        <div className="mb-7 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">Virtualizze</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Entrar na plataforma</h1>
          <p className="text-sm text-ink/65">Use suas credenciais para acessar o ambiente da sua organização.</p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none ring-0 transition focus:border-pine"
              {...register('email')}
            />
            {errors.email ? <p className="text-xs text-coral">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none ring-0 transition focus:border-pine"
              {...register('password')}
            />
            {errors.password ? <p className="text-xs text-coral">{errors.password.message}</p> : null}
          </div>

          {loginMutation.isError ? (
            <p className="rounded-lg border border-coral/25 bg-coral/10 px-3 py-2 text-xs text-coral">
              Não foi possível autenticar. Verifique as credenciais e tente novamente.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}