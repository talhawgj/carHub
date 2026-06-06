'use client';

import Link from 'next/link';

export default function CarInspectionLandingPage() {
  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      
      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(135deg, #1b3a6b, #112649)', color: '#fff', padding: '80px 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={{ display: 'inline-block', background: 'rgba(232,97,44,.2)', color: '#e8612c', fontWeight: 700, fontSize: '.85rem', padding: '6px 16px', borderRadius: 999, marginBottom: 24, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Autofy Certified
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, marginBottom: 24 }}>
            200+ Point <br /> <span style={{ color: '#e8612c' }}>Digital Inspection</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.6, marginBottom: 40 }}>
            Every car on CarMandi goes through our rigorous inspection process. 
            We send a certified Autofy inspector to your doorstep to evaluate your car and generate a detailed digital report.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/sell-your-car" className="btn-orange" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              List Car & Book Inspection
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#111827' }}>What We Check</h2>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', marginTop: 12 }}>A comprehensive evaluation of your vehicle</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32 }}>
            {[
              { icon: '🔧', title: 'Engine & Transmission', desc: 'Detailed diagnostics of engine health, fluid levels, and transmission shifting.' },
              { icon: '🚗', title: 'Exterior & Paint', desc: 'Thorough check for accidents, touchups, dents, and paint thickness.' },
              { icon: '💺', title: 'Interior & Electronics', desc: 'Verification of AC, dashboard electronics, seats, and cabin condition.' },
              { icon: '⚙️', title: 'Suspension & Brakes', desc: 'Underbody inspection for rust, suspension wear, and brake life.' },
              { icon: '📄', title: 'Documents', desc: 'Verification of registration, chassis number, and previous records.' },
              { icon: '📸', title: 'High-Res Photos', desc: 'We take 30+ professional photos for your auction listing.' }
            ].map((feature, i) => (
              <div key={i} style={{ background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 20 }}>{feature.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', marginBottom: 12 }}>{feature.title}</h3>
                <p style={{ color: '#4b5563', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#fff', padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#111827' }}>How It Works</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto' }}>
            {[
              { step: '01', title: 'Book an Appointment', desc: 'After entering your car details, choose a date and time that works for you.' },
              { step: '02', title: 'Inspector Visits', desc: 'Our certified inspector will visit your location to evaluate the car. Takes about 45 minutes.' },
              { step: '03', title: 'Report Generated', desc: 'A digital report with a score is generated and attached to your listing.' },
              { step: '04', title: 'Auction Goes Live', desc: 'Once the report is ready, your car goes live in our auction for thousands of buyers to see.' }
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'center', background: '#f9fafb', padding: 24, borderRadius: 16 }}>
                <div style={{ fontWeight: 900, fontSize: '2.5rem', color: '#e8612c' }}>{s.step}</div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ color: '#4b5563' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
