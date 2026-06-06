'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import NotificationsBadge from './NotificationsBadge';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const links = [
    { href: '/cars', label: 'Browse Cars' },
    { href: '/cars?condition=new', label: 'New Cars' },
    { href: '/cars?condition=used', label: 'Used Cars' },
    { href: '/compare', label: 'Compare' },
    { href: '/wishlist', label: 'Saved' },
  ];

  const active = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href.split('?')[0]));

  return (
    <nav style={{ background: '#1b3a6b', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(0,0,0,.2)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, background: '#e8612c', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <path d="M3 10L5.5 4H16.5L19 10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
              <rect x="1" y="10" width="20" height="4" rx="2" fill="#fff"/>
              <circle cx="5" cy="14" r="1.5" fill="#e8612c"/>
              <circle cx="17" cy="14" r="1.5" fill="#e8612c"/>
            </svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.1 }}>Chaudhary</div>
            <div style={{ color: '#e8612c', fontWeight: 700, fontSize: '.7rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>Motors</div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{
              color: active(l.href) ? '#e8612c' : 'rgba(255,255,255,.85)',
              fontWeight: 500, fontSize: '.875rem', padding: '6px 12px', borderRadius: 8,
              transition: 'color .15s, background .15s',
              background: active(l.href) ? 'rgba(255,255,255,.1)' : 'transparent',
              textDecoration: 'none'
            }}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <>
                <NotificationsBadge />
                <Link href="/buyer-dashboard" style={{ color: 'rgba(255,255,255,.8)', fontSize: '.85rem', textDecoration: 'none', fontWeight: 500, marginRight: 8 }}>
                  My Bids
                </Link>
                <Link href="/dashboard" style={{ color: 'rgba(255,255,255,.8)', fontSize: '.85rem', textDecoration: 'none', fontWeight: 500 }}>
                  My Garage
                </Link>
                <button onClick={() => signOut()} style={{ color: '#fff', fontSize: '.85rem', background: 'rgba(255,255,255,.1)', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={{ color: '#fff', fontSize: '.85rem', fontWeight: 600, textDecoration: 'none' }}>
                  Sign In
                </Link>
                <Link href="/signup" className="btn-orange" style={{ fontSize: '.85rem', padding: '6px 12px' }}>
                  Sign Up
                </Link>
              </>
            )}
            <Link href="/dashboard/properties/new" className="btn-orange" style={{ fontSize: '.85rem', padding: '6px 12px' }}>
              Sell Car
            </Link>
          </div>

          {/* Hamburger */}
          <button onClick={() => setOpen(!open)} style={{ color: '#fff', padding: 6, background: 'transparent', border: 'none', cursor: 'pointer' }} className="mobile-menu-btn">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div style={{ background: '#112649', borderTop: '1px solid rgba(255,255,255,.1)', padding: '12px 16px 16px' }}>
          {user && (
            <>
              <Link href="/buyer-dashboard" onClick={() => setOpen(false)} style={{ display: 'block', color: '#fff', fontSize: '.9rem', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,.1)', textDecoration: 'none' }}>
                My Bids (Buyer)
              </Link>
              <Link href="/dashboard" onClick={() => setOpen(false)} style={{ display: 'block', color: '#fff', fontSize: '.9rem', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,.1)', marginBottom: 8, textDecoration: 'none' }}>
                My Garage (Seller)
              </Link>
            </>
          )}
          
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
              display: 'block', color: '#fff', padding: '10px 12px', borderRadius: 8, fontWeight: 500, fontSize: '.9rem',
              background: active(l.href) ? 'rgba(232,97,44,.2)' : 'transparent', marginBottom: 2, textDecoration: 'none'
            }}>
              {l.label}
            </Link>
          ))}
          
          <div style={{ height: 1, background: 'rgba(255,255,255,.1)', margin: '8px 0' }} />
          
          {user ? (
            <button onClick={() => { signOut(); setOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', padding: '10px 12px', borderRadius: 8, fontWeight: 500, fontSize: '.9rem', cursor: 'pointer' }}>
              Sign Out
            </button>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} style={{ display: 'block', color: '#fff', padding: '10px 12px', borderRadius: 8, fontWeight: 500, fontSize: '.9rem', textDecoration: 'none' }}>
                Sign In
              </Link>
              <Link href="/signup" onClick={() => setOpen(false)} style={{ display: 'block', color: '#fff', padding: '10px 12px', borderRadius: 8, fontWeight: 500, fontSize: '.9rem', textDecoration: 'none' }}>
                Sign Up
              </Link>
            </>
          )}
          
          <Link href={user ? "/dashboard/properties/new" : "/contact"} onClick={() => setOpen(false)} style={{
            display: 'block', marginTop: 12, background: '#e8612c', color: '#fff', textDecoration: 'none',
            padding: '12px', borderRadius: 8, fontWeight: 600, textAlign: 'center'
          }}>
            Sell Your Car
          </Link>
        </div>
      )}

      <style>{`
        .desktop-nav { display: flex !important; }
        .mobile-menu-btn { display: none !important; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
