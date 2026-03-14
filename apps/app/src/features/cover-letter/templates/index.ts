import type { ComponentType } from 'react'

import { templateIds, type TemplateId } from '../lib/template-registry'
import { Classic } from './classic'
import { Executive } from './executive'
import { Modern } from './modern'
import { Static } from './static'
import type { TemplateProps } from './types'

type TemplateComponent = ComponentType<TemplateProps>

function isTemplateId(value: string): value is TemplateId {
  return templateIds.includes(value as TemplateId)
}

function assertNever(value: never): never {
  throw new Error(`Unhandled template id: ${String(value)}`)
}

export function resolveTemplateId(value: string): TemplateId {
  return isTemplateId(value) ? value : 'classic'
}

export function getTemplateComponent(template: string): TemplateComponent {
  if (template === 'static') {
    return Static
  }

  const resolvedTemplate = resolveTemplateId(template)

  switch (resolvedTemplate) {
    case 'classic':
      return Classic
    case 'modern':
      return Modern
    case 'executive':
      return Executive
    default:
      return assertNever(resolvedTemplate)
  }
}
