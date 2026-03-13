import type {
  Award,
  Certification,
  CustomSection,
  CustomSectionGroup,
  Education,
  Experience,
  Interest,
  Language,
  Profile,
  Project,
  Publication,
  Reference,
  SectionKey,
  SectionWithItem,
  Skill,
  URL,
  Volunteer,
} from '@repo/core/schemas'
import { Fragment, type ReactNode } from 'react'
import { cn, hexToRgb, isEmptyString, isUrl, sanitize } from '../lib/template-utils'
import { BrandIcon } from '../rendering/BrandIcon'
import { Picture } from '../rendering/Picture'
import { useResumeStore } from '../rendering/store'
import type { TemplateProps } from './types'

const assertNever = (value: never): never => {
  throw new Error(`Unhandled section: ${String(value)}`)
}

const getCustomSectionId = (section: SectionKey) =>
  section.startsWith('custom.') ? section.slice('custom.'.length) : null

type RatingProps = {
  level: number
}

type LinkProps = {
  url: URL
  icon?: ReactNode
  iconOnRight?: boolean
  label?: string
  className?: string
}

type LinkedEntityProps = {
  name: string
  url: URL
  separateLinks: boolean
  className?: string
}

type SectionProps<T> = {
  section: SectionWithItem<T> | CustomSectionGroup
  children?: (item: T) => ReactNode
  className?: string
  urlKey?: keyof T
  levelKey?: keyof T
  summaryKey?: keyof T
  keywordsKey?: keyof T
}

function getItemValue(item: Record<string, unknown>, key: string | undefined) {
  if (!key) return undefined
  return item[key]
}

function Header() {
  const basics = useResumeStore((state) => state.resume.basics)

  return (
    <div className="p-custom space-y-4 bg-primary text-background">
      <Picture className="border-background" />

      <div>
        <h2 className="text-2xl font-bold">{basics.name}</h2>
        <p>{basics.headline}</p>
      </div>

      <div className="flex flex-col items-start gap-y-2 text-sm">
        {basics.location && (
          <div className="flex items-center gap-x-1.5">
            <i className="ph ph-bold ph-map-pin" />
            <div>{basics.location}</div>
          </div>
        )}
        {basics.phone && (
          <div className="flex items-center gap-x-1.5">
            <i className="ph ph-bold ph-phone" />
            <a href={`tel:${basics.phone}`} target="_blank" rel="noreferrer">
              {basics.phone}
            </a>
          </div>
        )}
        {basics.email && (
          <div className="flex items-center gap-x-1.5">
            <i className="ph ph-bold ph-at" />
            <a href={`mailto:${basics.email}`} target="_blank" rel="noreferrer">
              {basics.email}
            </a>
          </div>
        )}
        {isUrl(basics.url.href) && <Link url={basics.url} />}
        {basics.customFields.map((item) => (
          <Fragment key={item.id}>
            <div className="flex items-center gap-x-1.5">
              <i className={cn(`ph ph-bold ph-${item.icon}`)} />
              {isUrl(item.value) ? (
                <a href={item.value} target="_blank" rel="noreferrer noopener nofollow">
                  {item.name || item.value}
                </a>
              ) : (
                <span>{[item.name, item.value].filter(Boolean).join(': ')}</span>
              )}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function Summary() {
  const section = useResumeStore((state) => state.resume.sections.summary)
  const primaryColor = useResumeStore((state) => state.resume.metadata.theme.primary)

  if (!section.visible || isEmptyString(section.content)) return null

  return (
    <div className="p-custom space-y-4" style={{ backgroundColor: hexToRgb(primaryColor, 0.2) }}>
      <section id={section.id}>
        <div
          dangerouslySetInnerHTML={{ __html: sanitize(section.content) }}
          style={{ columns: section.columns }}
          className="wysiwyg"
        />
      </section>
    </div>
  )
}

function Rating({ level }: Readonly<RatingProps>) {
  return (
    <div className="flex items-center gap-x-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className={cn('h-2.5 w-5 border border-primary', level > index && 'bg-primary')} />
      ))}
    </div>
  )
}

function Link({ url, icon, iconOnRight, label, className }: Readonly<LinkProps>) {
  if (!isUrl(url.href)) return null

  return (
    <div className="flex items-center gap-x-1.5">
      {!iconOnRight && (
        icon ?? <i className="ph ph-bold ph-link text-primary group-[.sidebar]:text-background" />
      )}
      <a
        href={url.href}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className={cn('inline-block', className)}
      >
        {label ?? (url.label || url.href)}
      </a>
      {iconOnRight && (
        icon ?? <i className="ph ph-bold ph-link text-primary group-[.sidebar]:text-background" />
      )}
    </div>
  )
}

function LinkedEntity({ name, url, separateLinks, className }: Readonly<LinkedEntityProps>) {
  return !separateLinks && isUrl(url.href) ? (
    <Link
      url={url}
      label={name}
      icon={<i className="ph ph-bold ph-globe text-primary group-[.sidebar]:text-primary" />}
      iconOnRight={true}
      className={className}
    />
  ) : (
    <div className={className}>{name}</div>
  )
}

function Section<T>({
  section,
  children,
  className,
  urlKey,
  levelKey,
  summaryKey,
  keywordsKey,
}: Readonly<SectionProps<T>>) {
  if (!section.visible || section.items.length === 0) return null

  return (
    <section id={section.id} className="grid">
      <h4 className="mb-2 border-b border-primary text-base font-bold">{section.name}</h4>

      <div className="grid gap-x-6 gap-y-3" style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}>
        {section.items
          .filter((item) => item.visible)
          .map((item) => {
            const itemRecord = item as Record<string, unknown>
            const urlValue = getItemValue(itemRecord, urlKey as string | undefined)
            const levelValue = getItemValue(itemRecord, levelKey as string | undefined)
            const summaryValue = getItemValue(itemRecord, summaryKey as string | undefined)
            const keywordsValue = getItemValue(itemRecord, keywordsKey as string | undefined)

            const url = urlValue as URL | undefined
            const level = typeof levelValue === 'number' ? levelValue : undefined
            const summary = typeof summaryValue === 'string' ? summaryValue : undefined
            const keywords = Array.isArray(keywordsValue) ? keywordsValue : undefined

            return (
              <div key={item.id} className={cn('space-y-2', className)}>
                <div>
                  {children?.(item as T)}
                  {url !== undefined && section.separateLinks && <Link url={url} />}
                </div>

                {summary !== undefined && !isEmptyString(summary) && (
                  <div dangerouslySetInnerHTML={{ __html: sanitize(summary) }} className="wysiwyg" />
                )}

                {level !== undefined && level > 0 && <Rating level={level} />}

                {keywords !== undefined && keywords.length > 0 && <p className="text-sm">{keywords.join(', ')}</p>}
              </div>
            )
          })}
      </div>
    </section>
  )
}

function Profiles() {
  const section = useResumeStore((state) => state.resume.sections.profiles)

  return (
    <Section<Profile> section={section}>
      {(item) => (
        <div>
          {isUrl(item.url.href) ? (
            <Link url={item.url} label={item.username} icon={<BrandIcon slug={item.icon} />} />
          ) : (
            <p>{item.username}</p>
          )}
          {!item.icon && <p className="text-sm">{item.network}</p>}
        </div>
      )}
    </Section>
  )
}

function Experience() {
  const section = useResumeStore((state) => state.resume.sections.experience)

  return (
    <Section<Experience> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left">
            <LinkedEntity
              name={item.company}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div>{item.position}</div>
          </div>

          <div className="shrink-0 text-right group-[.sidebar]:text-left">
            <div className="font-bold">{item.date}</div>
            <div>{item.location}</div>
          </div>
        </div>
      )}
    </Section>
  )
}

function Education() {
  const section = useResumeStore((state) => state.resume.sections.education)

  return (
    <Section<Education> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left">
            <LinkedEntity
              name={item.institution}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div>{item.area}</div>
            <div>{item.score}</div>
          </div>

          <div className="shrink-0 text-right group-[.sidebar]:text-left">
            <div className="font-bold">{item.date}</div>
            <div>{item.studyType}</div>
          </div>
        </div>
      )}
    </Section>
  )
}

function Awards() {
  const section = useResumeStore((state) => state.resume.sections.awards)

  return (
    <Section<Award> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left">
            <div className="font-bold">{item.title}</div>
            <LinkedEntity name={item.awarder} url={item.url} separateLinks={section.separateLinks} />
          </div>

          <div className="shrink-0 text-right group-[.sidebar]:text-left">
            <div className="font-bold">{item.date}</div>
          </div>
        </div>
      )}
    </Section>
  )
}

function Certifications() {
  const section = useResumeStore((state) => state.resume.sections.certifications)

  return (
    <Section<Certification> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left">
            <div className="font-bold">{item.name}</div>
            <LinkedEntity name={item.issuer} url={item.url} separateLinks={section.separateLinks} />
          </div>

          <div className="shrink-0 text-right group-[.sidebar]:text-left">
            <div className="font-bold">{item.date}</div>
          </div>
        </div>
      )}
    </Section>
  )
}

function Skills() {
  const section = useResumeStore((state) => state.resume.sections.skills)

  return (
    <Section<Skill> section={section} levelKey="level" keywordsKey="keywords">
      {(item) => (
        <div>
          <div className="font-bold">{item.name}</div>
          <div>{item.description}</div>
        </div>
      )}
    </Section>
  )
}

function Interests() {
  const section = useResumeStore((state) => state.resume.sections.interests)

  return (
    <Section<Interest> section={section} className="space-y-1" keywordsKey="keywords">
      {(item) => <div className="font-bold">{item.name}</div>}
    </Section>
  )
}

function Publications() {
  const section = useResumeStore((state) => state.resume.sections.publications)

  return (
    <Section<Publication> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left">
            <LinkedEntity
              name={item.name}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div>{item.publisher}</div>
          </div>

          <div className="shrink-0 text-right group-[.sidebar]:text-left">
            <div className="font-bold">{item.date}</div>
          </div>
        </div>
      )}
    </Section>
  )
}

function Volunteer() {
  const section = useResumeStore((state) => state.resume.sections.volunteer)

  return (
    <Section<Volunteer> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left">
            <LinkedEntity
              name={item.organization}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div>{item.position}</div>
          </div>

          <div className="shrink-0 text-right group-[.sidebar]:text-left">
            <div className="font-bold">{item.date}</div>
            <div>{item.location}</div>
          </div>
        </div>
      )}
    </Section>
  )
}

function Languages() {
  const section = useResumeStore((state) => state.resume.sections.languages)

  return (
    <Section<Language> section={section} levelKey="level">
      {(item) => (
        <div>
          <div className="font-bold">{item.name}</div>
          <div>{item.description}</div>
        </div>
      )}
    </Section>
  )
}

function Projects() {
  const section = useResumeStore((state) => state.resume.sections.projects)

  return (
    <Section<Project> section={section} urlKey="url" summaryKey="summary" keywordsKey="keywords">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left">
            <LinkedEntity
              name={item.name}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div>{item.description}</div>
          </div>

          <div className="shrink-0 text-right group-[.sidebar]:text-left">
            <div className="font-bold">{item.date}</div>
          </div>
        </div>
      )}
    </Section>
  )
}

function References() {
  const section = useResumeStore((state) => state.resume.sections.references)

  return (
    <Section<Reference> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div>
          <LinkedEntity
            name={item.name}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div>{item.description}</div>
        </div>
      )}
    </Section>
  )
}

function Custom({ id }: Readonly<{ id: string }>) {
  const section = useResumeStore((state) => state.resume.sections.custom[id])

  if (!section) return null

  return (
    <Section<CustomSection> section={section} urlKey="url" summaryKey="summary" keywordsKey="keywords">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left">
            <LinkedEntity
              name={item.name}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div>{item.description}</div>
          </div>

          <div className="shrink-0 text-right group-[.sidebar]:text-left">
            <div className="font-bold">{item.date}</div>
            <div>{item.location}</div>
          </div>
        </div>
      )}
    </Section>
  )
}

function mapSectionToComponent(section: SectionKey) {
  switch (section) {
    case 'basics':
      return null
    case 'profiles':
      return <Profiles />
    case 'experience':
      return <Experience />
    case 'education':
      return <Education />
    case 'awards':
      return <Awards />
    case 'certifications':
      return <Certifications />
    case 'skills':
      return <Skills />
    case 'interests':
      return <Interests />
    case 'publications':
      return <Publications />
    case 'volunteer':
      return <Volunteer />
    case 'languages':
      return <Languages />
    case 'projects':
      return <Projects />
    case 'references':
      return <References />
    case 'summary':
    case 'custom':
      return null
    default: {
      const customId = getCustomSectionId(section)
      if (customId) return <Custom id={customId} />
      return assertNever(section as never)
    }
  }
}

export function Gengar({ columns, isFirstPage = false }: Readonly<TemplateProps>) {
  const [main, sidebar] = columns
  const primaryColor = useResumeStore((state) => state.resume.metadata.theme.primary)

  return (
    <div className="grid min-h-[inherit] grid-cols-3">
      <div className={cn('sidebar group flex flex-col', !(isFirstPage || sidebar.length > 0) && 'hidden')}>
        {isFirstPage && <Header />}

        <div className="p-custom flex-1 space-y-4" style={{ backgroundColor: hexToRgb(primaryColor, 0.2) }}>
          {sidebar.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>
      </div>

      <div className={cn('main group', sidebar.length > 0 ? 'col-span-2' : 'col-span-3')}>
        {isFirstPage && <Summary />}

        <div className="p-custom space-y-4">
          {main.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
