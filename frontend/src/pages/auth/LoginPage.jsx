import { useState } from 'react'
import { ArrowRight, BarChart3, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/brand/Logo'
import { login } from '../../api/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await login({ email: form.get('email'), password: form.get('password') })
      if (response?.accessToken) window.localStorage.setItem('ecosphere_access_token', response.accessToken)
      navigate(response?.defaultRoute || '/app/dashboard')
    } catch (requestError) {
      setError(requestError.message || 'Sign-in failed. Check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8faf7] lg:grid lg:grid-cols-[minmax(420px,0.92fr)_1.08fr]">
      <section className="flex min-h-screen items-center px-5 py-8 sm:px-10 lg:px-14 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <Logo />
          <div className="mt-14">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-forest-700">Welcome back</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-ink-950 sm:text-4xl">Sign in to your workspace</h1>
            <p className="mt-3 text-sm leading-6 text-ink-600">Use your organization email. Your verified role determines the experience you can access.</p>
          </div>

          <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ink-800">Organization email</label>
              <input id="email" name="email" type="email" required autoComplete="email" placeholder="name@organization.com" className="h-12 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-forest-600 focus:ring-4 focus:ring-forest-100" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-semibold text-ink-800">Password</label><button type="button" className="text-xs font-semibold text-forest-700 hover:text-forest-800">Forgot password?</button></div>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" placeholder="Enter your password" className="h-12 w-full rounded-xl border border-line bg-white px-4 pr-12 text-sm text-ink-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-forest-600 focus:ring-4 focus:ring-forest-100" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1.5 top-1.5 grid size-9 place-items-center rounded-lg text-ink-600 hover:bg-canvas" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">{error}</div>}
            <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest-800 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-950 disabled:cursor-wait disabled:opacity-70">
              {loading ? <><LoaderCircle size={17} className="animate-spin" />Signing in…</> : <>Sign in securely<ArrowRight size={17} /></>}
            </button>
          </form>

          <p className="mt-7 border-t border-line pt-6 text-center text-xs text-ink-600">Need access? Contact your organization administrator.</p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-forest-950 p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="subtle-grid absolute inset-0 opacity-20" />
        <div className="absolute -right-32 -top-24 size-[460px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex justify-end"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/75"><LockKeyhole size={13} />Role-based access</span></div>
        <div className="relative mx-auto max-w-xl">
          <div className="grid size-14 place-items-center rounded-2xl bg-emerald-300 text-forest-950"><BarChart3 size={25} /></div>
          <h2 className="mt-7 text-4xl font-semibold leading-[1.15] tracking-[-0.045em] text-white xl:text-5xl">Turn responsible actions into measurable progress.</h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/62">One operating layer for environmental performance, social impact, governance, and employee participation.</p>
          <div className="mt-9 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
            {['Verified ESG workflows', 'Organization-aware data', 'Employee participation', 'Auditable progress'].map((item) => <div key={item} className="flex items-center gap-2.5"><span className="grid size-5 place-items-center rounded-full bg-white/10"><Check size={12} /></span>{item}</div>)}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-white/45"><ShieldCheck size={15} />Security and permissions are enforced by the EcoSphere API.</div>
      </section>
    </main>
  )
}
