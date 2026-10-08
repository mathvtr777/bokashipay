/** Fonte única de verdade da navegação. Usada pela sidebar, pelo header e pelo mobile. */
import * as Icons from '@/components/ui/icons'

export interface NavItem {
  href: string
  label: string
  icon: (props: { className?: string }) => React.ReactElement
  /**
   * Pathname que marca este item como ativo. Se ausente, usa `href`.
   * Útil quando dois itens compartilham o mesmo `href` mas só um deve
   * aparecer ativo (ex.: aliases que apontam para a mesma rota).
   */
  activePath?: string
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Icons.Dashboard },
  // Adquirentes tem rota própria; é o item canônico que fica ativo nela.
  { href: '/adquirentes', label: 'Adquirentes', icon: Icons.Bank, activePath: '/adquirentes' },
  // Análises é o painel de métricas; fica ativo em /analises.
  { href: '/analises', label: 'Análises', icon: Icons.ChartBar, activePath: '/analises' },
  // Transações tem rota própria; é o item canônico que fica ativo nela.
  { href: '/transacoes', label: 'Transações', icon: Icons.Wallet, activePath: '/transacoes' },
  // Infrações tem rota própria; é o item canônico que fica ativo nela.
  { href: '/infracoes', label: 'Infrações', icon: Icons.ShieldAlert, activePath: '/infracoes' },
  { href: '/clientes', label: 'Clientes', icon: Icons.Customers },
  { href: '/financeiro', label: 'Financeiro', icon: Icons.Finance },
  { href: '/produtos', label: 'Produtos', icon: Icons.Sales },
  { href: '/contas-bancarias', label: 'Contas Bancárias', icon: Icons.Bank },
  { href: '/saques', label: 'Saques', icon: Icons.Wallet },
  { href: '/integracoes', label: 'Integrações', icon: Icons.Integrations },
  { href: '/configuracoes', label: 'Configurações', icon: Icons.Settings },
  // "Temas" mora em Automações (hardcoded na sidebar, com badge NOVO);
  // não duplicar aqui.
]

/** Área administrativa — aparece só para quem está em ADMIN_USER_EMAILS. */
export const ADMIN_ITEMS: NavItem[] = [
  { href: '/admin/saques', label: 'Aprovar saques', icon: Icons.Shield },
]

export const FOOTER_ITEMS: NavItem[] = [
  { href: '/ajuda', label: 'Ajuda', icon: Icons.Help },
  { href: '/perfil', label: 'Perfil', icon: Icons.User },
]

/** Um item é ativo quando a URL é ele ou uma subpágina. */
/**
 * Um item é ativo quando a URL é ele (ou uma subpágina) — ou, se o item
 * define `activePath`, quando o pathname é exatamente esse path. Isso permite
 * ter dois itens que apontam para a mesma rota mas só um aparece ativo.
 */
export function isActive(item: NavItem, pathname: string): boolean {
  const target = item.activePath ?? item.href
  return pathname === target || pathname.startsWith(`${target}/`)
}

// Mantém compat com o uso antigo que recebe (href, pathname) em outros
// lugares. Se perder performance, troquem as chamadas para a forma nova.
export function isActiveLegacy(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}