import { siteTheme } from '../lib/site-theme'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer id="contact" className="site-footer">
      <div className="page-wrap footer-inner">
        <div>
          <p className="eyebrow mb-3">{siteTheme.brand.name}</p>
          <p className="footer-summary">{siteTheme.footer.summary}</p>
        </div>

        <div className="footer-links">
          {siteTheme.footer.links.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>

        <p className="footer-meta">
          &copy; {year} {siteTheme.brand.name}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
