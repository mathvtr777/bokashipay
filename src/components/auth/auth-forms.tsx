'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Checkbox } from '@/components/ui/input'
import { LogoLockup } from '@/components/ui/logo'
import { Eye, EyeOff, Lock, Mail, User } from '@/components/ui/icons'
import { createClient } from '@/lib/supabase/client'

/** Layout partilhado pelas telas de autenticação. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Coluna do formulário */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[46%] lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="inline-block">
            <LogoLockup size={34} />
          </Link>

          <h1 className="mt-10 text-2xl font-semibold tracking-tight text-white text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-white/50 text-white/50">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 text-center text-sm text-white/50 text-white/50">{footer}</div>}
        </div>
      </div>

      {/* Painel decorativo — só em desktop. */}
      <div className="relative hidden overflow-hidden bg-ink-950 lg:block lg:w-[54%]">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(1000px 600px at 70% 15%, #5b21b6 0%, transparent 60%), radial-gradient(800px 500px at 20% 85%, #2e1065 0%, transparent 55%)',
          }}
        />
        {/* Grade sutil — detalhe tech, sem poluir. */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.9) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        <div className="relative flex h-full flex-col justify-center px-16">
          <p className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
            PIX, vendas e saques em um só lugar.
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-brand-200/90">
            Painel completo para acompanhar cada centavo do seu negócio — do QR Code gerado ao
            saque em cripto concluído.
          </p>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-8">
            {[
              ['PIX', 'Cobrança na hora'],
              ['Tempo real', 'Sem recarregar'],
              ['Cripto', 'TRC20 · ERC20 · BEP20'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-lg font-semibold tracking-tight text-white">{value}</dt>
                <dd className="mt-1 text-sm text-brand-200/70">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

/** Campo de senha com mostrar/ocultar. Reusado em login, cadastro e redefinição. */
export function PasswordInput({
  label,
  error,
  hint,
  autoComplete,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }) {
  const [visible, setVisible] = React.useState(false)

  return (
    <Input
      type={visible ? 'text' : 'password'}
      label={label}
      error={error}
      hint={hint}
      autoComplete={autoComplete}
      icon={<Lock />}
      {...props}
      suffix={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="rounded p-1 text-white/50 transition-colors hover:text-white/70 hover:text-white/90"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  )
}

// -----------------------------------------------------------------------------
// Login
// -----------------------------------------------------------------------------

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirectTo') ?? '/dashboard'

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [remember, setRemember] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Preencha e-mail e senha.')
      return
    }

    setLoading(true)

    // O login passa pelo servidor porque só lá o cookie de sessão pode ser
    // gravado como persistente ("lembrar acesso") ou como cookie de sessão.
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember }),
    })

    if (!response.ok) {
      // Mensagem genérica de propósito: não revela se o e-mail existe.
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <AuthLayout
      title="Entrar na sua conta"
      subtitle="Acesse o painel do seu negócio."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link
            href="/register"
            className="font-medium text-brand-600 transition-colors hover:text-brand-700 text-brand-400"
          >
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          type="email"
          label="E-mail"
          placeholder="voce@empresa.com.br"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail />}
          error={error && !email ? 'Informe seu e-mail.' : undefined}
        />

        <PasswordInput
          label="Senha"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error && email ? error : undefined}
        />

        <div className="flex items-center justify-between pt-1">
          <Checkbox
            label="Lembrar acesso"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 text-brand-400"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Entrar
        </Button>
      </form>
    </AuthLayout>
  )
}

// -----------------------------------------------------------------------------
// Cadastro
// -----------------------------------------------------------------------------

export function RegisterForm() {
  const router = useRouter()

  const [form, setForm] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [accepted, setAccepted] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formError, setFormError] = React.useState<string | null>(null)

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const validate = () => {
    const next: Record<string, string> = {}

    if (form.fullName.trim().length < 3) next.fullName = 'Informe seu nome completo.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Informe um e-mail válido.'
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) next.phone = 'Telefone incompleto.'
    if (form.password.length < 8) next.password = 'Use ao menos 8 caracteres.'
    if (form.password !== form.confirmPassword) next.confirmPassword = 'As senhas não conferem.'
    if (!accepted) next.accepted = 'É necessário aceitar os termos.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    if (!validate()) return

    setLoading(true)

    // Server-side: passa pelo rate-limit + cria usuário via admin API.
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
      }),
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      const msg = body.error ?? 'Não foi possível criar a conta.'
      if (res.status === 429) {
        setFormError(msg)
      } else if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('já existe')) {
        setFormError('Já existe uma conta com este e-mail.')
      } else {
        setFormError(msg)
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthLayout
      title="Criar sua conta"
      subtitle="Leva menos de um minuto."
      footer={
        <>
          Já tem conta?{' '}
          <Link
            href="/login"
            className="font-medium text-brand-600 transition-colors hover:text-brand-700 text-brand-400"
          >
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Nome"
          placeholder="Seu nome completo"
          autoComplete="name"
          value={form.fullName}
          onChange={update('fullName')}
          icon={<User />}
          error={errors.fullName}
        />

        <Input
          type="email"
          label="E-mail"
          placeholder="voce@empresa.com.br"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          icon={<Mail />}
          error={errors.email}
        />

        <Input
          type="tel"
          label="Telefone"
          placeholder="(11) 99999-9999"
          autoComplete="tel"
          value={form.phone}
          onChange={update('phone')}
          error={errors.phone}
          hint="Opcional."
        />

        <PasswordInput
          label="Senha"
          placeholder="Mínimo de 8 caracteres"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
        />

        <PasswordInput
          label="Confirmar senha"
          placeholder="Repita a senha"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          error={errors.confirmPassword}
        />

        <div>
          <Checkbox
            label={
              <span>
                Aceito os{' '}
                <span className="text-brand-600 text-brand-400">termos de uso</span> e a{' '}
                <span className="text-brand-600 text-brand-400">política de privacidade</span>
              </span>
            }
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          {errors.accepted && (
            <p className="mt-1.5 text-xs text-red-600 text-red-400">{errors.accepted}</p>
          )}
        </div>

        {formError && (
          <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 bg-red-500/10 text-red-400">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  )
}

// -----------------------------------------------------------------------------
// Recuperação de senha
// -----------------------------------------------------------------------------

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Enviaremos um link de redefinição para o seu e-mail."
      footer={
        <Link
          href="/login"
          className="font-medium text-brand-600 transition-colors hover:text-brand-700 text-brand-400"
        >
          Voltar para o login
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-emerald-200 bg-white/[0.05] p-5 border-emerald-500/25 bg-white/[0.08]/10">
          <h2 className="text-sm font-semibold text-emerald-800 text-emerald-300">
            Verifique seu e-mail
          </h2>
          <p className="mt-1.5 text-sm text-white text-white/90">
            Se houver uma conta com <strong>{email}</strong>, você receberá o link em instantes.
            Confira também a pasta de spam.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input
            type="email"
            label="E-mail"
            placeholder="voce@empresa.com.br"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail />}
            error={error ?? undefined}
          />
          <Button type="submit" size="lg" loading={loading} className="w-full">
            Enviar link de redefinição
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}

// -----------------------------------------------------------------------------
// Redefinir senha
// -----------------------------------------------------------------------------

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Use ao menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 1800)
  }

  return (
    <AuthLayout
      title="Definir nova senha"
      subtitle="Escolha uma senha que você não use em outro serviço."
      footer={
        <Link
          href="/login"
          className="font-medium text-brand-600 transition-colors hover:text-brand-700 text-brand-400"
        >
          Voltar para o login
        </Link>
      }
    >
      {done ? (
        <div className="rounded-2xl border border-emerald-200 bg-white/[0.05] p-5 border-emerald-500/25 bg-white/[0.08]/10">
          <h2 className="text-sm font-semibold text-emerald-800 text-emerald-300">
            Senha atualizada
          </h2>
          <p className="mt-1.5 text-sm text-white text-white/90">
            Levando você para o painel…
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <PasswordInput
            label="Nova senha"
            placeholder="Mínimo de 8 caracteres"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordInput
            label="Confirmar nova senha"
            placeholder="Repita a nova senha"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={error ?? undefined}
          />
          <Button type="submit" size="lg" loading={loading} className="w-full">
            Salvar nova senha
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}