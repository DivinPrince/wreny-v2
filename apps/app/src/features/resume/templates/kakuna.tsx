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
import {
  DiffView,
  DeletedItemDiff,
  useSectionDiff,
} from '../rendering/diff-helpers'
import { Picture } from '../rendering/picture'
import {
  DiffHTML,
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

const ProfileRow = ({ item }: Readonly<{ item: Profile }>) => {
  const pendingHref = usePendingValue({
    section: 'profiles',
    field: 'url.href',
    itemId: item.id,
    fallback: item.url.href,
  })

  return (
    <div className="flex items-center gap-x-2">
      {isUrl(pendingHref) ? (
        <Link
          url={{ ...item.url, href: pendingHref }}
          label={
            <DiffText section="profiles" field={['username', 'url.href']} itemId={item.id}>
              {item.username || item.url.label || item.url.href}
            </DiffText>
          }
          className="text-sm"
          icon={<BrandIcon slug={item.icon} />}
        />
      ) : (
        <DiffText section="profiles" field="username" itemId={item.id}>{item.username}</DiffText>
      )}
    </div>
  )
}

const Header = () => {
  const basics = useResumeStore((state) => state.resume.basics)
  const profiles = useResumeStore((state) => state.resume.sections.profiles)
  const { isHidden: profilesHidden, deletedItems: deletedProfiles } = useSectionDiff('profiles')
  const pendingUrlHref = usePendingValue({
    section: 'basics',
    field: 'url.href',
    fallback: basics.url.href,
  })

  return (
    <div className="flex flex-col items-center justify-center space-y-2 pb-2 text-center">
      <Picture />

      <div>
        <div className="text-2xl font-bold">
          <DiffText section="basics" field="name">{basics.name}</DiffText>
        </div>
        <div className="text-base">
          <DiffText section="basics" field="headline">{basics.headline}</DiffText>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
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

        {basics.customFields.map((item) => (
          <Fragment key={item.id}>
            <div className="flex items-center gap-x-1.5">
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

      {(profilesHidden || (profiles.visible && (profiles.items.length > 0 || deletedProfiles.length > 0))) && (
        <div className="flex items-center gap-x-3 gap-y-0.5">
          {profilesHidden ? (
            <DiffView original="Profiles section" proposed="Hidden" className="text-sm" />
          ) : (
            <>
              {profiles.items
                .filter((item) => item.visible)
                .map((item) => (
                  <ProfileRow key={item.id} item={item} />
                ))}
              {deletedProfiles.map((change) => (
                <DeletedItemDiff key={change.id} change={change} className="text-sm" />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

const Summary = () => {
  const section = useResumeStore((state) => state.resume.sections.summary)
  const { isHidden } = useSectionDiff('summary')

  if ((!section.visible && !isHidden) || (!isHidden && isEmptyString(section.content))) return null

  return (
    <section id={section.id}>
      <h4 className="mb-2 border-b border-primary text-center font-bold text-primary">
        {section.name}
      </h4>

      {isHidden ? (
        <DiffView original={`${section.name} section`} proposed="Hidden" />
      ) : (
        <DiffHTML
          section="summary"
          field="content"
          html={section.content}
          style={{ columns: section.columns }}
          className="wysiwyg"
        />
      )}
    </section>
  )
}

type RatingProps = { level: number }

const Rating = ({ level }: Readonly<RatingProps>) => (
  <div className="flex items-center gap-x-1.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className={cn('h-3 w-5 rounded border-2 border-highlight', level > index && 'bg-highlight')}
      />
    ))}
  </div>
)

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
  className?: string
  urlKey?: keyof T
  levelKey?: keyof T
  summaryKey?: keyof T
  keywordsKey?: keyof T
}

const Section = <T,>({
  section,
  children,
  className,
  urlKey,
  levelKey,
  summaryKey,
  keywordsKey,
}: Readonly<SectionProps<T>>) => {
  const { isHidden, deletedItems } = useSectionDiff(section.id)

  if ((!section.visible && !isHidden) || (section.items.length === 0 && deletedItems.length === 0)) return null

  return (
    <section id={section.id} className="grid">
      <h4 className="mb-2 border-b border-primary text-center font-bold text-primary">
        {section.name}
      </h4>

      {isHidden ? (
        <DiffView original={`${section.name} section`} proposed="Hidden" />
      ) : (
        <div
          className="grid gap-x-6 gap-y-3"
          style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
        >
          {section.items
            .filter((item) => item.visible)
            .map((item) => {
              const url = (urlKey ? item[urlKey] : undefined) as URL | undefined
              const level = (levelKey ? item[levelKey] : undefined) as number | undefined
              const summary = (summaryKey ? item[summaryKey] : undefined) as string | undefined
              const keywords = (keywordsKey ? item[keywordsKey] : undefined) as string[] | undefined

              return (
                <div key={item.id} className={cn('space-y-2', className)}>
                  <div>{children?.(item as T)}</div>

                  {summary !== undefined && !isEmptyString(summary) && (
                    <DiffHTML
                      section={section.id}
                      field={summaryKey as string}
                      itemId={item.id}
                      html={summary}
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

                  {url !== undefined && section.separateLinks && <Link url={url} />}
                </div>
              )
            })}
          {deletedItems.map((change) => (
            <DeletedItemDiff key={change.id} change={change} className={className} />
          ))}
        </div>
      )}
    </section>
  )
}

const ExperienceSection = () => {
  const section = useResumeStore((state) => state.resume.sections.experience)

  return (
    <Section<Experience> section={section} urlKey="url" summaryKey="summary">
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
          <div className="font-bold"><DiffText section="experience" field="date" itemId={item.id}>{item.date}</DiffText></div>
        </div>
      )}
    </Section>
  )
}

const EducationSection = () => {
  const section = useResumeStore((state) => state.resume.sections.education)

  return (
    <Section<Education> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div>
          <LinkedEntity
            name={<DiffText section="education" field="institution" itemId={item.id}>{item.institution}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div><DiffText section="education" field="area" itemId={item.id}>{item.area}</DiffText></div>
          <div><DiffText section="education" field="score" itemId={item.id}>{item.score}</DiffText></div>
          <div><DiffText section="education" field="studyType" itemId={item.id}>{item.studyType}</DiffText></div>
          <div className="font-bold"><DiffText section="education" field="date" itemId={item.id}>{item.date}</DiffText></div>
        </div>
      )}
    </Section>
  )
}

const AwardsSection = () => {
  const section = useResumeStore((state) => state.resume.sections.awards)

  return (
    <Section<Award> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div>
          <div className="font-bold"><DiffText section="awards" field="title" itemId={item.id}>{item.title}</DiffText></div>
          <LinkedEntity
            name={<DiffText section="awards" field="awarder" itemId={item.id}>{item.awarder}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
          />
          <div className="font-bold"><DiffText section="awards" field="date" itemId={item.id}>{item.date}</DiffText></div>
        </div>
      )}
    </Section>
  )
}

const CertificationsSection = () => {
  const section = useResumeStore((state) => state.resume.sections.certifications)

  return (
    <Section<Certification> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div>
          <div className="font-bold"><DiffText section="certifications" field="name" itemId={item.id}>{item.name}</DiffText></div>
          <LinkedEntity
            name={<DiffText section="certifications" field="issuer" itemId={item.id}>{item.issuer}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
          />
          <div className="font-bold"><DiffText section="certifications" field="date" itemId={item.id}>{item.date}</DiffText></div>
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
    <Section<Interest> section={section} keywordsKey="keywords" className="space-y-0.5">
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
    <Section<Publication> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div>
          <LinkedEntity
            name={<DiffText section="publications" field="name" itemId={item.id}>{item.name}</DiffText>}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div><DiffText section="publications" field="publisher" itemId={item.id}>{item.publisher}</DiffText></div>
          <div className="font-bold"><DiffText section="publications" field="date" itemId={item.id}>{item.date}</DiffText></div>
        </div>
      )}
    </Section>
  )
}

const VolunteerSection = () => {
  const section = useResumeStore((state) => state.resume.sections.volunteer)

  return (
    <Section<Volunteer> section={section} urlKey="url" summaryKey="summary">
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
          <div className="font-bold"><DiffText section="volunteer" field="date" itemId={item.id}>{item.date}</DiffText></div>
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
    <Section<Project> section={section} urlKey="url" summaryKey="summary" keywordsKey="keywords">
      {(item) => (
        <div>
          <div>
            <LinkedEntity
              name={<DiffText section="projects" field="name" itemId={item.id}>{item.name}</DiffText>}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div><DiffText section="projects" field="description" itemId={item.id}>{item.description}</DiffText></div>
            <div className="font-bold"><DiffText section="projects" field="date" itemId={item.id}>{item.date}</DiffText></div>
          </div>
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
      summaryKey="summary"
      keywordsKey="keywords"
    >
      {(item) => (
        <div>
          <div>
            <LinkedEntity
              name={<DiffText section={section.id} field="name" itemId={item.id}>{item.name}</DiffText>}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div><DiffText section={section.id} field="description" itemId={item.id}>{item.description}</DiffText></div>
            <div><DiffText section={section.id} field="location" itemId={item.id}>{item.location}</DiffText></div>
            <div className="font-bold"><DiffText section={section.id} field="date" itemId={item.id}>{item.date}</DiffText></div>
          </div>
        </div>
      )}
    </Section>
  )
}

const mapSectionToComponent = (section: SectionKey) => {
  switch (section) {
    case 'basics':
      return null
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
    case 'profiles':
      return null
    case 'custom':
      return null
    default: {
      const customId = getCustomSectionId(section)
      if (customId) return <Custom id={customId} />
      return assertNever(section as never)
    }
  }
}

export const Kakuna = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns

  return (
    <div className="p-custom space-y-4">
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
