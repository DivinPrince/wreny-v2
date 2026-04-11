import { Fragment, type ReactNode } from 'react'
import type {
  Award,
  Certification,
  CustomSection,
  Education,
  Experience,
  Interest,
  Language,
  Profile,
  Project,
  Publication,
  Reference,
  SectionKey,
  Skill,
  URL,
  Volunteer,
} from '@repo/core/schemas'

import { cn, isEmptyString, isUrl } from '../lib/template-utils'
import { BrandIcon } from '../rendering/brand-icon'
import { CustomFieldIcon } from '../rendering/custom-field-icon'
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

const Header = () => {
  const basics = useResumeStore((state) => state.resume.basics)
  const pendingUrlHref = usePendingValue({
    section: 'basics',
    field: 'url.href',
    fallback: basics.url.href,
  })

  return (
    <div className="grid grid-cols-4 gap-x-6">
      <div className="mt-1 space-y-2 text-right">
        <Picture className="ml-auto" />
      </div>

      <div className="col-span-3 space-y-2">
        <div>
          <div className="text-2xl font-bold">
            <DiffText section="basics" field="name">{basics.name}</DiffText>
          </div>
          <div className="text-base">
            <DiffText section="basics" field="headline">{basics.headline}</DiffText>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          {basics.location && (
            <div className="flex items-center gap-x-1.5">
              <i className="ph ph-bold ph-map-pin text-primary" />
              <div><DiffText section="basics" field="location">{basics.location}</DiffText></div>
            </div>
          )}
          {basics.phone && (
            <div className="flex items-center gap-x-1.5">
              <i className="ph ph-bold ph-phone text-primary" />
              <a href={`tel:${basics.phone}`} target="_blank" rel="noreferrer">
                <DiffText section="basics" field="phone">{basics.phone}</DiffText>
              </a>
            </div>
          )}
          {basics.email && (
            <div className="flex items-center gap-x-1.5">
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
        </div>

        <div className="flex flex-wrap gap-x-3 text-sm">
          {basics.customFields.map((item) => (
            <div key={item.id} className="flex items-center gap-x-1.5">
              <CustomFieldIcon slug={item.icon} />
              {isUrl(item.value) ? (
                <a href={item.value} target="_blank" rel="noreferrer noopener nofollow">
                  <DiffText section="basics" field="value" itemId={item.id}>
                    {item.name || item.value}
                  </DiffText>
                </a>
              ) : (
                <>
                  <span className="text-primary">
                    <DiffText section="basics" field="name" itemId={item.id}>{item.name}</DiffText>
                  </span>
                  <span><DiffText section="basics" field="value" itemId={item.id}>{item.value}</DiffText></span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const Summary = () => {
  const section = useResumeStore((state) => state.resume.sections.summary)
  const { isHidden } = useSectionDiff('summary')

  if ((!section.visible && !isHidden) || (!isHidden && isEmptyString(section.content))) return null

  return (
    <section id={section.id} className="grid grid-cols-4 gap-x-6">
      <div className="text-right">
        <h4 className="font-medium text-primary">{section.name}</h4>
      </div>

      <div className="col-span-3">
        <div className="relative">
          <hr className="mt-3 border-highlight pb-3" />
          <div className="absolute bottom-3 right-0 size-3 bg-highlight" />
        </div>

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
      </div>
    </section>
  )
}

type LinkProps = {
  url: URL
  icon?: ReactNode
  iconOnRight?: boolean
  label?: ReactNode
  className?: string
}

const Link = ({ url, icon, iconOnRight, label, className }: Readonly<LinkProps>) => {
  if (!isUrl(url.href)) return null

  return (
    <div className="flex items-center gap-x-1.5">
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

type LinkedEntityProps = {
  name: ReactNode
  url: URL
  separateLinks: boolean
  className?: string
}

const LinkedEntity = ({ name, url, separateLinks, className }: Readonly<LinkedEntityProps>) => {
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

type SectionGroup<T> = {
  id: string
  name: string
  columns: number
  separateLinks: boolean
  visible: boolean
  items: Array<T & { id: string; visible: boolean }>
}

type SectionProps<T> = {
  section: SectionGroup<T>
  children?: (item: T) => ReactNode
  urlKey?: keyof T
  dateKey?: keyof T
  levelKey?: keyof T
  summaryKey?: keyof T
  keywordsKey?: keyof T
}

const Section = <T,>({
  section,
  children,
  urlKey,
  dateKey,
  summaryKey,
  keywordsKey,
}: Readonly<SectionProps<T>>) => {
  const { isHidden, deletedItems } = useSectionDiff(section.id)

  if ((!section.visible && !isHidden) || (section.items.length === 0 && deletedItems.length === 0)) return null

  if (isHidden) {
    return (
      <section id={section.id} className={cn('grid', dateKey !== undefined && 'gap-y-4')}>
        <div className="grid grid-cols-4 gap-x-6">
          <div className="text-right">
            <h4 className="font-medium text-primary">{section.name}</h4>
          </div>
          <div className="col-span-3">
            <div className="relative">
              <hr className="mt-3 border-highlight" />
              <div className="absolute bottom-0 right-0 size-3 bg-highlight" />
            </div>
            <DiffView original={`${section.name} section`} proposed="Hidden" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id={section.id} className={cn('grid', dateKey !== undefined && 'gap-y-4')}>
      <div className="grid grid-cols-4 gap-x-6">
        <div className="text-right">
          <h4 className="font-medium text-primary">{section.name}</h4>
        </div>

        <div className="col-span-3">
          <div className="relative">
            <hr className="mt-3 border-highlight" />
            <div className="absolute bottom-0 right-0 size-3 bg-highlight" />
          </div>
        </div>
      </div>

      {dateKey !== undefined && (
        <div className="grid grid-cols-4 gap-x-6 gap-y-4">
          {section.items
            .filter((item) => item.visible)
            .map((item) => {
              const url = (urlKey ? item[urlKey] : undefined) as URL | undefined
              const date = (dateKey ? item[dateKey] : undefined) as string | undefined
              const summary = (summaryKey ? item[summaryKey] : undefined) as string | undefined
              const keywords = (keywordsKey ? item[keywordsKey] : undefined) as string[] | undefined

              return (
                <Fragment key={item.id}>
                  <div className="text-right font-medium text-primary">
                    {date !== undefined && (
                      <DiffText section={section.id} field={dateKey as string} itemId={item.id}>
                        {date}
                      </DiffText>
                    )}
                  </div>

                  <div className="col-span-3 space-y-1">
                    {children?.(item as T)}

                    {url !== undefined && section.separateLinks && <Link url={url} />}

                    {summary !== undefined && !isEmptyString(summary) && (
                      <DiffMarkdown
                        section={section.id}
                        field={summaryKey as string}
                        itemId={item.id}
                        content={summary}
                        className="wysiwyg"
                      />
                    )}

                    {keywords !== undefined && keywords.length > 0 && (
                      <p className="text-sm">
                        <DiffText section={section.id} field="keywords" itemId={item.id}>
                          {keywords.join(', ')}
                        </DiffText>
                      </p>
                    )}
                  </div>
                </Fragment>
              )
            })}
          {deletedItems.map((change) => (
            <Fragment key={change.id}>
              <div />
              <div className="col-span-3">
                <DeletedItemDiff change={change} />
              </div>
            </Fragment>
          ))}
        </div>
      )}

      {dateKey === undefined && (
        <div className="grid grid-cols-4 gap-x-6">
          <div
            className="col-span-3 col-start-2 grid gap-x-6 gap-y-3"
            style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
          >
            {section.items
              .filter((item) => item.visible)
              .map((item) => {
                const url = (urlKey ? item[urlKey] : undefined) as URL | undefined
                const summary = (summaryKey ? item[summaryKey] : undefined) as string | undefined
                const keywords = (keywordsKey ? item[keywordsKey] : undefined) as string[] | undefined

                return (
                  <div key={item.id}>
                    {children?.(item as T)}

                    {url !== undefined && section.separateLinks && <Link url={url} />}

                    {summary !== undefined && !isEmptyString(summary) && (
                      <DiffMarkdown
                        section={section.id}
                        field={summaryKey as string}
                        itemId={item.id}
                        content={summary}
                        className="wysiwyg"
                      />
                    )}

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
              <DeletedItemDiff key={change.id} change={change} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

const ProfileRow = ({ item }: Readonly<{ item: Profile }>) => {
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
        <p><DiffText section="profiles" field="username" itemId={item.id}>{item.username}</DiffText></p>
      )}
      {!item.icon && (
        <p className="text-sm"><DiffText section="profiles" field="network" itemId={item.id}>{item.network}</DiffText></p>
      )}
    </div>
  )
}

const ProfilesSection = () => {
  const section = useResumeStore((state) => state.resume.sections.profiles)

  return (
    <Section<Profile> section={section}>
      {(item) => <ProfileRow item={item} />}
    </Section>
  )
}

const ExperienceSection = () => {
  const section = useResumeStore((state) => state.resume.sections.experience)

  return (
    <Section<Experience> section={section} urlKey="url" dateKey="date" summaryKey="summary">
      {(item) => (
        <div>
          <LinkedEntity
            name={<DiffText section="experience" field="company" itemId={item.id}>{item.company}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div><DiffText section="experience" field="position" itemId={item.id}>{item.position}</DiffText></div>
          <div><DiffText section="experience" field="location" itemId={item.id}>{item.location}</DiffText></div>
        </div>
      )}
    </Section>
  )
}

const EducationSection = () => {
  const section = useResumeStore((state) => state.resume.sections.education)

  return (
    <Section<Education> section={section} urlKey="url" dateKey="date" summaryKey="summary">
      {(item) => (
        <div>
          <LinkedEntity
            name={<DiffText section="education" field="institution" itemId={item.id}>{item.institution}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div><DiffText section="education" field="area" itemId={item.id}>{item.area}</DiffText></div>
          <div><DiffText section="education" field="studyType" itemId={item.id}>{item.studyType}</DiffText></div>
          <div><DiffText section="education" field="score" itemId={item.id}>{item.score}</DiffText></div>
        </div>
      )}
    </Section>
  )
}

const AwardsSection = () => {
  const section = useResumeStore((state) => state.resume.sections.awards)

  return (
    <Section<Award> section={section} urlKey="url" dateKey="date" summaryKey="summary">
      {(item) => (
        <div>
          <div className="font-bold"><DiffText section="awards" field="title" itemId={item.id}>{item.title}</DiffText></div>
          <LinkedEntity
            name={<DiffText section="awards" field="awarder" itemId={item.id}>{item.awarder}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
          />
        </div>
      )}
    </Section>
  )
}

const CertificationsSection = () => {
  const section = useResumeStore((state) => state.resume.sections.certifications)

  return (
    <Section<Certification> section={section} urlKey="url" dateKey="date" summaryKey="summary">
      {(item) => (
        <div>
          <div className="font-bold"><DiffText section="certifications" field="name" itemId={item.id}>{item.name}</DiffText></div>
          <LinkedEntity
            name={<DiffText section="certifications" field="issuer" itemId={item.id}>{item.issuer}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
          />
        </div>
      )}
    </Section>
  )
}

const SkillsSection = () => {
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

const InterestsSection = () => {
  const section = useResumeStore((state) => state.resume.sections.interests)

  return (
    <Section<Interest> section={section} keywordsKey="keywords">
      {(item) => (
        <div className="font-bold">
          <DiffText section="interests" field="name" itemId={item.id}>{item.name}</DiffText>
        </div>
      )}
    </Section>
  )
}

const PublicationsSection = () => {
  const section = useResumeStore((state) => state.resume.sections.publications)

  return (
    <Section<Publication> section={section} urlKey="url" dateKey="date" summaryKey="summary">
      {(item) => (
        <div>
          <LinkedEntity
            name={<DiffText section="publications" field="name" itemId={item.id}>{item.name}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div><DiffText section="publications" field="publisher" itemId={item.id}>{item.publisher}</DiffText></div>
        </div>
      )}
    </Section>
  )
}

const VolunteerSection = () => {
  const section = useResumeStore((state) => state.resume.sections.volunteer)

  return (
    <Section<Volunteer> section={section} urlKey="url" dateKey="date" summaryKey="summary">
      {(item) => (
        <div>
          <LinkedEntity
            name={<DiffText section="volunteer" field="organization" itemId={item.id}>{item.organization}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div><DiffText section="volunteer" field="position" itemId={item.id}>{item.position}</DiffText></div>
          <div><DiffText section="volunteer" field="location" itemId={item.id}>{item.location}</DiffText></div>
        </div>
      )}
    </Section>
  )
}

const LanguagesSection = () => {
  const section = useResumeStore((state) => state.resume.sections.languages)

  return (
    <Section<Language> section={section} levelKey="level">
      {(item) => (
        <div>
          <div className="font-bold"><DiffText section="languages" field="name" itemId={item.id}>{item.name}</DiffText></div>
          <div><DiffText section="languages" field="description" itemId={item.id}>{item.description}</DiffText></div>
        </div>
      )}
    </Section>
  )
}

const ProjectsSection = () => {
  const section = useResumeStore((state) => state.resume.sections.projects)

  return (
    <Section<Project>
      section={section}
      urlKey="url"
      dateKey="date"
      summaryKey="summary"
      keywordsKey="keywords"
    >
      {(item) => (
        <div>
          <LinkedEntity
            name={<DiffText section="projects" field="name" itemId={item.id}>{item.name}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div><DiffText section="projects" field="description" itemId={item.id}>{item.description}</DiffText></div>
        </div>
      )}
    </Section>
  )
}

const ReferencesSection = () => {
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

const Custom = ({ id }: Readonly<{ id: string }>) => {
  const section = useResumeStore((state) => state.resume.sections.custom[id])

  if (!section) return null

  return (
    <Section<CustomSection>
      section={section}
      urlKey="url"
      dateKey="date"
      summaryKey="summary"
      keywordsKey="keywords"
    >
      {(item) => (
        <div>
          <LinkedEntity
            name={<DiffText section={section.id} field="name" itemId={item.id}>{item.name}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div><DiffText section={section.id} field="description" itemId={item.id}>{item.description}</DiffText></div>
          <div><DiffText section={section.id} field="location" itemId={item.id}>{item.location}</DiffText></div>
        </div>
      )}
    </Section>
  )
}

const mapSectionToComponent = (section: SectionKey) => {
  switch (section) {
    case 'basics':
      return null
    case 'profiles':
      return <ProfilesSection />
    case 'summary':
      return <Summary />
    case 'experience':
      return <ExperienceSection />
    case 'education':
      return <EducationSection />
    case 'awards':
      return <AwardsSection />
    case 'certifications':
      return <CertificationsSection />
    case 'skills':
      return <SkillsSection />
    case 'interests':
      return <InterestsSection />
    case 'publications':
      return <PublicationsSection />
    case 'volunteer':
      return <VolunteerSection />
    case 'languages':
      return <LanguagesSection />
    case 'projects':
      return <ProjectsSection />
    case 'references':
      return <ReferencesSection />
    case 'custom':
      return null
    default: {
      const customId = getCustomSectionId(section)
      if (customId) return <Custom id={customId} />
      return assertNever(section as never)
    }
  }
}

export const Nosepass = ({ columns, isFirstPage = false }: TemplateProps) => {
  const name = useResumeStore((state) => state.resume.basics.name)
  const [main, sidebar] = columns

  return (
    <div className="p-custom space-y-6">
      <div className="flex items-center justify-between">
        <img alt="Europass Logo" className="h-[42px]" src="/assets/europass.png" />

        <p className="font-medium text-primary">Curriculum Vitae</p>

        <p className="font-medium text-primary">
          <DiffText section="basics" field="name">{name}</DiffText>
        </p>
      </div>

      {isFirstPage && <Header />}

      <div className="space-y-4">
        {main.map((section) => (
          <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
        ))}

        {sidebar.map((section) => (
          <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
        ))}
      </div>
    </div>
  )
}
