import type { ComponentType } from 'react'

import { templateIds, type TemplateId } from '../lib/template-registry'
import { Azurill } from './azurill'
import { Bronzor } from './bronzor'
import { Chikorita } from './chikorita'
import { Ditto } from './ditto'
import { Gengar } from './gengar'
import { Glalie } from './glalie'
import { Kakuna } from './kakuna'
import { Leafish } from './leafish'
import { Nosepass } from './nosepass'
import { Onyx } from './onyx'
import { Pikachu } from './pikachu'
import { Rhyhorn } from './rhyhorn'
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
  return isTemplateId(value) ? value : 'onyx'
}

export function getTemplateComponent(template: string): TemplateComponent {
  const resolvedTemplate = resolveTemplateId(template)

  switch (resolvedTemplate) {
    case 'azurill':
      return Azurill
    case 'bronzor':
      return Bronzor
    case 'chikorita':
      return Chikorita
    case 'ditto':
      return Ditto
    case 'gengar':
      return Gengar
    case 'glalie':
      return Glalie
    case 'kakuna':
      return Kakuna
    case 'leafish':
      return Leafish
    case 'nosepass':
      return Nosepass
    case 'onyx':
      return Onyx
    case 'pikachu':
      return Pikachu
    case 'rhyhorn':
      return Rhyhorn
    case 'static':
      return Static
    default:
      return assertNever(resolvedTemplate)
  }
}
