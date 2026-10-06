/** Fonte única de verdade da navegação. Usada pela sidebar, pelo header e pelo mobile. */
import * as Icons from '@/components/ui/icons'

export interface NavItem {
  href: string
  label: string
  icon: (props: { className?: string }) => React.ReactElement
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Icons.Dashboard },
  { href: '/vendas', label: 'Vendas', icon: Icons.Sales },
  { href: '/pix', label: 'PIX', icon: Icons.Pix },
  { href: '/financeiro', label: 'Financeiro', icon: Icons.Finance },
  { href: '/clientes', label: 'Clientes', icon: Icons.Customers },
  { href: '/contas-bancarias', label: 'Contas Bancárias', icon: Icons.Bank },
  { href: '/saques', label: 'Saques', icon: Icons.Wallet },
  { href: '/integracoes', label: 'Integrações', icon: Icons.Integrations },
  { href: '/configuracoes', label: 'Configurações', icon: Icons.Settings },
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
export function isActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}