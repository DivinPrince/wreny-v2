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
import { cn, isEmptyString, isUrl } from '../lib/template-utils'
import { BrandIcon } from '../rendering/brand-icon'
import {
  DiffView,
  DeletedItemDiff,
  useSectionDiff,
} from '../rendering/diff-helpers'
import { Picture } from '../rendering/picture'
import {
  DiffMarkdown,
  DiffText,
  usePendingValue,
} from '../rendering/pending-changes'
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
  label?: ReactNode
  className?: string
}

type LinkedEntityProps = {
  name: ReactNode
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
  const pendingUrlHref = usePendingValue({
    section: 'basics',
    field: 'url.href',
    fallback: basics.url.href,
  })

  return (
    <div className="flex items-center space-x-4">
      <Picture />
      <div className="space-y-0.5">
        <div className="text-2xl font-bold">
          <DiffText section="basics" field="name">{basics.name}</DiffText>
        </div>
        <div className="text-base">
          <DiffText section="basics" field="headline">{basics.headline}</DiffText>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
          {basics.location && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0">
              <i className="ph ph-bold ph-map-pin text-primary" />
              <div><DiffText section="basics" field="location">{basics.location}</DiffText></div>
            </div>
          )}
          {basics.phone && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0">
              <i className="ph ph-bold ph-phone text-primary" />
              <a href={`tel:${basics.phone}`} target="_blank" rel="noreferrer">
                <DiffText section="basics" field="phone">{basics.phone}</DiffText>
              </a>
            </div>
          )}
          {basics.email && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0">
              <i className="ph ph-bold ph-at text-primary" />
              <a href={`mailto:${basics.email}`} target="_blank" rel="noreferrer">
                <DiffText section="basics" field="email">{basics.email}</DiffText>
              </a>
            </div>
          )}
          {isUrl(pendingUrlHref) && (
            <Link
              url={{ ...basics.url, href: pendingUrlHref }}
              label={
                <DiffText section="basics" field={['url.label', 'url.href']}>
                  {basics.url.label || basics.url.href}
                </DiffText>
              }
            />
          )}
          {basics.customFields.map((item) => (
            <Fragment key={item.id}>
              <div
                className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0"
              >
                <i className={cn(`ph ph-bold ph-${item.icon}`, 'text-primary')} />
                {isUrl(item.value) ? (
                  <a href={item.value} target="_blank" rel="noreferrer noopener nofollow">
                    <DiffText section="basics" field="value" itemId={item.id}>
                      {item.name || item.value}
                    </DiffText>
                  </a>
                ) : (
                  <span>
                    <DiffText section="basics" field="name" itemId={item.id}>{item.name}</DiffText>
                    {item.name && item.value ? ': ' : null}
                    <DiffText section="basics" field="value" itemId={item.id}>{item.value}</DiffText>
                  </span>
                )}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

function Summary() {
  const section = useResumeStore((state) => state.resume.sections.summary)
  const { isHidden } = useSectionDiff('summary')

  if ((!section.visible && !isHidden) || (!isHidden && isEmptyString(section.content))) return null

  return (
    <section id={section.id}>
      <h4 className="mb-2 border-b pb-0.5 text-sm font-bold">{section.name}</h4>

      {isHidden ? (
        <DiffView original={`${section.name} section`} proposed="Hidden" />
      ) : (
        <DiffMarkdown
          section="summary"
          field="content"
          content={section.content}
          style={{ columns: section.columns }}
          className="wysiwyg"
        />
      )}
    </section>
  )
}

function Rating({ level }: Readonly<RatingProps>) {
  return (
    <div className="flex items-center gap-x-1.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={cn('size-2 rounded-full border border-highlight', level > index && 'bg-highlight')}
        />
      ))}
    </div>
  )
}

function Link({ url, icon, iconOnRight, label, className }: Readonly<LinkProps>) {
  if (!isUrl(url.href)) return null

  return (
    <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0">
      {!iconOnRight && (icon ?? <i className="ph ph-bold ph-link text-primary" />)}
      <a
        href={url.href}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className={cn('inline-block', className)}
      >
        {label ?? (url.label || url.href)}
      </a>
      {iconOnRight && (icon ?? <i className="ph ph-bold ph-link text-primary" />)}
    </div>
  )
}

function LinkedEntity({ name, url, separateLinks, className }: Readonly<LinkedEntityProps>) {
  return !separateLinks && isUrl(url.href) ? (
    <Link
      url={url}
      label={name}
      icon={<i className="ph ph-bold ph-globe text-primary" />}
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
  const { isHidden, deletedItems } = useSectionDiff(section.id)

  if ((!section.visible && !isHidden) || (section.items.length === 0 && deletedItems.length === 0)) return null

  return (
    <section id={section.id} className="grid">
      <h4 className="mb-2 border-b pb-0.5 text-sm font-bold">{section.name}</h4>

      <div
        className="grid gap-x-6 gap-y-3"
        style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
      >
        {isHidden ? (
          <DiffView original={`${section.name} section`} proposed="Hidden" />
        ) : (
          <>
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
                      <DiffMarkdown
                        section={section.id}
                        field={summaryKey as string}
                        itemId={item.id}
                        content={summary}
                        className="wysiwyg"
                      />
                    )}

                    {level !== undefined && level > 0 && <Rating level={level} />}

                    {keywords !== undefined && keywords.length > 0 && (
                      <p className="text-sm">
                        <DiffText section={section.id} field="keywords" itemId={item.id}>
                          {keywords.join(', ')}
                        </DiffText>
                      </p>
                    )}
                  </div>
                )
              })}
            {deletedItems.map((change) => (
              <DeletedItemDiff key={change.id} change={change} className={className} />
            ))}
          </>
        )}
      </div>
    </section>
  )
}

function ProfileRow({ item }: Readonly<{ item: Profile }>) {
  const pendingHref = usePendingValue({
    section: 'profiles',
    field: 'url.href',
    itemId: item.id,
    fallback: item.url.href,
  })

  return (
    <div>
      {isUrl(pendingHref) ? (
        <Link
          url={{ ...item.url, href: pendingHref }}
          label={
            <DiffText section="profiles" field={['username', 'url.href']} itemId={item.id}>
              {item.username || item.url.label || item.url.href}
            </DiffText>
          }
          icon={<BrandIcon slug={item.icon} />}
        />
      ) : (
        <p>
          <DiffText section="profiles" field="username" itemId={item.id}>{item.username}</DiffText>
        </p>
      )}
      {!item.icon && (
        <p className="text-sm">
          <DiffText section="profiles" field="network" itemId={item.id}>{item.network}</DiffText>
        </p>
      )}
    </div>
  )
}

function Profiles() {
  const section = useResumeStore((state) => state.resume.sections.profiles)

  return (
    <Section<Profile> section={section}>
      {(item) => <ProfileRow item={item} />}
    </Section>
  )
}

function Experience() {
  const section = useResumeStore((state) => state.resume.sections.experience)

  return (
    <Section<Experience> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between">
          <div className="text-left">
            <LinkedEntity
              name={<DiffText section="experience" field="company" itemId={item.id}>{item.company}</DiffText>}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div><DiffText section="experience" field="position" itemId={item.id}>{item.position}</DiffText></div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold"><DiffText section="experience" field="date" itemId={item.id}>{item.date}</DiffText></div>
            <div><DiffText section="experience" field="location" itemId={item.id}>{item.location}</DiffText></div>
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
        <div className="flex items-start justify-between">
          <div className="text-left">
            <LinkedEntity
              name={<DiffText section="education" field="institution" itemId={item.id}>{item.institution}</DiffText>}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div><DiffText section="education" field="area" itemId={item.id}>{item.area}</DiffText></div>
            <div><DiffText section="education" field="score" itemId={item.id}>{item.score}</DiffText></div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold"><DiffText section="education" field="date" itemId={item.id}>{item.date}</DiffText></div>
            <div><DiffText section="education" field="studyType" itemId={item.id}>{item.studyType}</DiffText></div>
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
        <div className="flex items-start justify-between">
          <div className="text-left">
            <div className="font-bold"><DiffText section="awards" field="title" itemId={item.id}>{item.title}</DiffText></div>
            <LinkedEntity
              name={<DiffText section="awards" field="awarder" itemId={item.id}>{item.awarder}</DiffText>}
              url={item.url}
              separateLinks={section.separateLinks}
            />
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold"><DiffText section="awards" field="date" itemId={item.id}>{item.date}</DiffText></div>
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
        <div className="flex items-start justify-between">
          <div className="text-left">
            <div className="font-bold"><DiffText section="certifications" field="name" itemId={item.id}>{item.name}</DiffText></div>
            <LinkedEntity
              name={<DiffText section="certifications" field="issuer" itemId={item.id}>{item.issuer}</DiffText>}
              url={item.url}
              separateLinks={section.separateLinks}
            />
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold"><DiffText section="certifications" field="date" itemId={item.id}>{item.date}</DiffText></div>
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
          <div className="font-bold"><DiffText section="skills" field="name" itemId={item.id}>{item.name}</DiffText></div>
          <div><DiffText section="skills" field="description" itemId={item.id}>{item.description}</DiffText></div>
        </div>
      )}
    </Section>
  )
}

function Interests() {
  const section = useResumeStore((state) => state.resume.sections.interests)

  return (
    <Section<Interest> section={section} keywordsKey="keywords" className="space-y-0.5">
      {(item) => (
        <div className="font-bold">
          <DiffText section="interests" field="name" itemId={item.id}>{item.name}</DiffText>
        </div>
      )}
    </Section>
  )
}

function Publications() {
  const section = useResumeStore((state) => state.resume.sections.publications)

  return (
    <Section<Publication> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between">
          <div className="text-left">
            <LinkedEntity
              name={<DiffText section="publications" field="name" itemId={item.id}>{item.name}</DiffText>}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div><DiffText section="publications" field="publisher" itemId={item.id}>{item.publisher}</DiffText></div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold"><DiffText section="publications" field="date" itemId={item.id}>{item.date}</DiffText></div>
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
        <div className="flex items-start justify-between">
          <div className="text-left">
            <LinkedEntity
              name={<DiffText section="volunteer" field="organization" itemId={item.id}>{item.organization}</DiffText>}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div><DiffText section="volunteer" field="position" itemId={item.id}>{item.position}</DiffText></div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold"><DiffText section="volunteer" field="date" itemId={item.id}>{item.date}</DiffText></div>
            <div><DiffText section="volunteer" field="location" itemId={item.id}>{item.location}</DiffText></div>
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
        <div className="space-y-0.5">
          <div className="font-bold"><DiffText section="languages" field="name" itemId={item.id}>{item.name}</DiffText></div>
          <div><DiffText section="languages" field="description" itemId={item.id}>{item.description}</DiffText></div>
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
        <div className="flex items-start justify-between">
          <div className="text-left">
            <LinkedEntity
              name={<DiffText section="projects" field="name" itemId={item.id}>{item.name}</DiffText>}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div><DiffText section="projects" field="description" itemId={item.id}>{item.description}</DiffText></div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold"><DiffText section="projects" field="date" itemId={item.id}>{item.date}</DiffText></div>
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
            name={<DiffText section="references" field="name" itemId={item.id}>{item.name}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div><DiffText section="references" field="description" itemId={item.id}>{item.description}</DiffText></div>
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
        <div className="flex items-start justify-between">
          <div className="text-left">
            <LinkedEntity
              name={<DiffText section={section.id} field="name" itemId={item.id}>{item.name}</DiffText>}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div><DiffText section={section.id} field="description" itemId={item.id}>{item.description}</DiffText></div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold"><DiffText section={section.id} field="date" itemId={item.id}>{item.date}</DiffText></div>
            <div><DiffText section={section.id} field="location" itemId={item.id}>{item.location}</DiffText></div>
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
    case 'summary':
      return <Summary />
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
    case 'custom':
      return null
    default: {
      const customId = getCustomSectionId(section)
      if (customId) return <Custom id={customId} />
      return assertNever(section as never)
    }
  }
}

export function Static({ columns, isFirstPage = false }: Readonly<TemplateProps>) {
  const [main = [], sidebar = []] = columns

  return (
    <div className="p-custom space-y-3">
      {isFirstPage && <Header />}
      <div className="grid grid-cols-3 gap-x-4">
        <div
          className={cn('sidebar group space-y-4', sidebar.length === 0 && 'hidden')}
        >
          {sidebar.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>

        <div
          className={cn(
            'main group space-y-4',
            sidebar.length > 0 ? 'col-span-2' : 'col-span-3',
          )}
        >
          {main.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
