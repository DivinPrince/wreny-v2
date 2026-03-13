import type { LucideIcon } from 'lucide-react'
import { Anvil, Boxes, Cable, Package, Shield, SunMedium } from 'lucide-react'

export type NavItem = {
  label: string
  href: string
}

export type Category = {
  title: string
  description: string
  icon: LucideIcon
}

export type Product = {
  badge: string
  label: string
  name: string
  price: string
  image?: string
}

export type HeaderAction = {
  label: string
  href: string
}

export const siteTheme = {
  brand: {
    mark: '1H',
    name: '1000 Hills Engineering',
    strapline:
      'Industrial equipment, MEP systems, surveillance, and renewable energy.',
    supportLabel: 'Support',
    supportPhone: '+250 788 500 080',
  },
  header: {
    searchPlaceholder: 'Search equipment, design services, or systems...',
    searchActionLabel: 'Search',
    catalogLabel: 'Catalog',
    actions: [
      { label: 'Cart', href: '/cart' },
      { label: 'Account', href: '/about' },
    ] satisfies HeaderAction[],
  },
  hero: {
    eyebrow: 'Building the future of Rwanda',
    title: 'Building with precision.',
    description:
      'Premier engineering solutions across construction tools, MEP design, IT infrastructure, and sustainable energy systems.',
    primaryCta: {
      label: 'View inventory',
      href: '#featured-products',
    },
    secondaryCta: {
      label: 'Consultancy services',
      href: '#operation-hubs',
    },
  },
  nav: [
    { label: 'Construction', href: '#operation-hubs' },
    { label: 'MEP Systems', href: '#operation-hubs' },
    { label: 'IT & CCTV', href: '#operation-hubs' },
    { label: 'Renewables', href: '#featured-products' },
  ] satisfies NavItem[],
  categories: [
    {
      title: 'Construction Tools',
      description: 'Heavy machinery, hand tools, and site equipment.',
      icon: Anvil,
    },
    {
      title: 'MEP Design & Supervision',
      description: 'Mechanical, HVAC, electrical, and plumbing systems.',
      icon: Boxes,
    },
    {
      title: 'IT & Surveillance',
      description: 'Security, networking, and smart monitoring.',
      icon: Shield,
    },
    {
      title: 'Energy & Sustainability',
      description: 'Solar systems, storage, and renewable upgrades.',
      icon: SunMedium,
    },
  ] satisfies Category[],
  products: [
    {
      badge: 'Construction Tools',
      label: 'DeWalt',
      name: 'Industrial Grade Rotary Hammer Drill',
      price: 'RWF 350,000',
    },
    {
      badge: 'MEP Design',
      label: '1000 Hills Pro',
      name: 'Commercial MEP Supervision Package',
      price: 'RWF 1,200,000',
    },
    {
      badge: 'IT & Surveillance',
      label: 'Hikvision',
      name: '4K AI-Powered IP Surveillance Camera',
      price: 'RWF 85,000',
    },
    {
      badge: 'Energy & Sustainability',
      label: 'BYD',
      name: '5KW Lithium Solar Storage Battery',
      price: 'RWF 2,100,000',
    },
  ] satisfies Product[],
  footer: {
    summary:
      'Engineering-led sourcing for projects that need reliability, technical depth, and long-term support.',
    links: [
      { label: 'Inventory', href: '#featured-products' },
      { label: 'Departments', href: '#operation-hubs' },
      { label: 'Support', href: 'tel:+250788500080' },
    ],
  },
}

export const productArtworkIcon = Package
export const utilityIcon = Cable
