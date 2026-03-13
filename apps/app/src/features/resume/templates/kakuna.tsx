import { Fragment, type ReactNode } from 'react'
import type {
  Award,
  Certification,
  CustomSection,
  Education,
  Experience,
  Interest,
  Language,
  Project,
  Publication,
  Reference,
  SectionKey,
  Skill,
  URL,
  Volunteer,
} from '@repo/core/schemas'

import { cn, isEmptyString, isUrl, sanitize } from '../lib/template-utils'
import { BrandIcon } from '../rendering/BrandIcon'
import { Picture } from '../rendering/Picture'
import { useResumeStore } from '../rendering/store'
import type { TemplateProps } from './types'

const assertNever = (value: never): never => {
  throw new Error(`Unhandled section: ${String(value)}`)
}

const getCustomSectionId = (section: SectionKey) =>
  section.startsWith('custom.') ? section.slice('custom.'.length) : null

const Header = () => {
  const basics = useResumeStore((state) => state.resume.basics)
  const profiles = useResumeStore((state) => state.resume.sections.profiles)

  return (
    <div className="flex flex-col items-center justify-center space-y-2 pb-2 text-center">
      <Picture />

      <div>
        <div className="text-2xl font-bold">{basics.name}</div>
        <div className="text-base">{basics.headline}</div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
        {basics.location && (
          <div className="flex items-center gap-x-1.5">
            <i className="ph ph-bold ph-map-pin text-primary" />
            <div>{basics.location}</div>
          </div>
        )}
        {basics.phone && (
          <div className="flex items-center gap-x-1.5">
            <i className="ph ph-bold ph-phone text-primary" />
            <a href={`tel:${basics.phone}`} target="_blank" rel="noreferrer">
              {basics.phone}
            </a>
          </div>
        )}
        {basics.email && (
          <div className="flex items-center gap-x-1.5">
            <i className="ph ph-bold ph-at text-primary" />
            <a href={`mailto:${basics.email}`} target="_blank" rel="noreferrer">
              {basics.email}
            </a>
          </div>
        )}

        <Link url={basics.url} />

        {basics.customFields.map((item) => (
          <div key={item.id} className="flex items-center gap-x-1.5">
            <i className={cn(`ph ph-bold ph-${item.icon}`, 'text-primary')} />
            {isUrl(item.value) ? (
              <a href={item.value} target="_blank" rel="noreferrer noopener nofollow">
                {item.name || item.value}
              </a>
            ) : (
              <span>{[item.name, item.value].filter(Boolean).join(': ')}</span>
            )}
          </div>
        ))}
      </div>

      {profiles.visible && profiles.items.length > 0 && (
        <div className="flex items-center gap-x-3 gap-y-0.5">
          {profiles.items
            .filter((item) => item.visible)
            .map((item) => (
              <div key={item.id} className="flex items-center gap-x-2">
                <Link
                  url={item.url}
                  label={item.username}
                  className="text-sm"
                  icon={<BrandIcon slug={item.icon} />}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

const Summary = () => {
  const section = useResumeStore((state) => state.resume.sections.summary)

  if (!section.visible || isEmptyString(section.content)) return null

  return (
    <section id={section.id}>
      <h4 className="mb-2 border-b border-primary text-center font-bold text-primary">
        {section.name}
      </h4>

      <div
        dangerouslySetInnerHTML={{ __html: sanitize(section.content) }}
        style={{ columns: section.columns }}
        className="wysiwyg"
      />
    </section>
  )
}

type RatingProps = { level: number }

const Rating = ({ level }: Readonly<RatingProps>) => (
  <div className="flex items-center gap-x-1.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className={cn('h-3 w-5 rounded border-2 border-primary', level > index && 'bg-primary')}
      />
    ))}
  </div>
)

type LinkProps = {
  url: URL
  icon?: ReactNode
  iconOnRight?: boolean
  label?: string
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
  name: string
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
  if (!section.visible || section.items.length === 0) return null

  return (
    <section id={section.id} className="grid">
      <h4 className="mb-2 border-b border-primary text-center font-bold text-primary">
        {section.name}
      </h4>

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
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitize(summary) }}
                    className="wysiwyg"
                  />
                )}

                {level !== undefined && level > 0 && <Rating level={level} />}

                {keywords !== undefined && keywords.length > 0 && (
                  <p className="text-sm">{keywords.join(', ')}</p>
                )}

                {url !== undefined && section.separateLinks && <Link url={url} />}
              </div>
            )
          })}
      </div>
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
            name={item.company}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div>{item.position}</div>
          <div>{item.location}</div>
          <div className="font-bold">{item.date}</div>
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
            name={item.institution}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div>{item.area}</div>
          <div>{item.score}</div>
          <div>{item.studyType}</div>
          <div className="font-bold">{item.date}</div>
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
          <div className="font-bold">{item.title}</div>
          <LinkedEntity name={item.awarder} url={item.url} separateLinks={section.separateLinks} />
          <div className="font-bold">{item.date}</div>
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
          <div className="font-bold">{item.name}</div>
          <LinkedEntity name={item.issuer} url={item.url} separateLinks={section.separateLinks} />
          <div className="font-bold">{item.date}</div>
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
          <div className="font-bold">{item.name}</div>
          <div>{item.description}</div>
        </div>
      )}
    </Section>
  )
}

const InterestsSection = () => {
  const section = useResumeStore((state) => state.resume.sections.interests)

  return (
    <Section<Interest> section={section} keywordsKey="keywords" className="space-y-0.5">
      {(item) => <div className="font-bold">{item.name}</div>}
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
            name={item.name}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div>{item.publisher}</div>
          <div className="font-bold">{item.date}</div>
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
            name={item.organization}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div>{item.position}</div>
          <div>{item.location}</div>
          <div className="font-bold">{item.date}</div>
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
          <div className="font-bold">{item.name}</div>
          <div>{item.description}</div>
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
              name={item.name}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div>{item.description}</div>
            <div className="font-bold">{item.date}</div>
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
              name={item.name}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div>{item.description}</div>
            <div>{item.location}</div>
            <div className="font-bold">{item.date}</div>
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
