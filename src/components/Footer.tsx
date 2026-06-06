'use client';
import Link from 'next/link';

const footerLinks = {
  Browse: [
    { href: '/cars', label: 'All Vehicles' },
    { href: '/cars?condition=new', label: 'New Cars' },
    { href: '/cars?condition=used', label: 'Used Cars' },
    { href: '/cars?category=sedan', label: 'Sedans' },
    { href: '/cars?category=suv', label: 'SUVs' },
  ],
  Company: [
    { href: '/contact', label: 'Contact Us' },
    { href: '/compare', label: 'Compare Cars' },
    { href: '/wishlist', label: 'Saved Cars' },
  ],
};

export default function Footer() {
  return (
    <>
      <style>{`
        .footer-link { color: rgba(255,255,255,.65); font-size:.85rem; transition:color .15s; }
        .footer-link:hover { color: #e8612c; }
        .footer-social { width:34px;height:34px;background:rgba(255,255,255,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.9rem;transition:background .2s;text-decoration:none; }
        .footer-social:hover { background:rgba(232,97,44,.4); }
      `}</style>
      <footer style={{ background: '#0d2140', color: 'rgba(255,255,255,.7)' }}>
        <div className="container" style={{ padding: '48px 1.5rem 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', paddingBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, background: '#e8612c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="14" viewBox="0 0 22 16" fill="none">
                    <path d="M3 10L5.5 4H16.5L19 10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                    <rect x="1" y="10" width="20" height="4" rx="2" fill="#fff"/>
                    <circle cx="5" cy="14" r="1.5" fill="#e8612c"/>
                    <circle cx="17" cy="14" r="1.5" fill="#e8612c"/>
                  </svg>
                </div>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>Chaudhary Motors</span>
              </div>
              <p style={{ fontSize: '.85rem', lineHeight: 1.7 }}>Pakistan&apos;s trusted car marketplace. Find your perfect vehicle with ease.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {['📘', '📸', '🐦'].map((icon, i) => (
                  <a key={i} href="#" className="footer-social">{icon}</a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '.9rem', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {links.map(l => (
                    <li key={l.href}>
                      <Link href={l.href} className="footer-link">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '.9rem', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.06em' }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span>📍</span><span>Lahore, Punjab, Pakistan</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📞</span>
                  <a href="tel:+923001234567" className="footer-link">+92 300 1234567</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>✉️</span>
                  <a href="mailto:info@chaudharymotors.pk" className="footer-link" style={{ fontSize: '.8rem' }}>info@chaudharymotors.pk</a>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', fontSize: '.8rem' }}>
            <p>© 2026 Chaudhary Motors. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
