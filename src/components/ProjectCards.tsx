/**
 * ProjectCards — Active Centre Focus + Morphic centered modal
 *
 * Active card expands via Framer Motion layoutId into a centred modal.
 * Arrow keys / swipe to navigate. Click active card to open detail.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projects } from '../data/projects';
import type { Project } from '../data/projects';

const spring = { type: 'spring' as const, stiffness: 280, damping: 30 };

export default function ProjectCards() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const touchStartX = useRef(0);
  const sectionRef  = useRef<HTMLElement>(null);
  const total = projects.length;

  const goTo   = useCallback((i: number) => setActiveIndex(((i % total) + total) % total), [total]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  const handleCardClick = useCallback((index: number) => {
    if (index === activeIndex) setExpandedId(projects[index].id);
    else goTo(index);
  }, [activeIndex, goTo]);

  const handleClose = useCallback(() => setExpandedId(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!sectionRef.current) return;
      const r = sectionRef.current.getBoundingClientRect();
      if (r.top > window.innerHeight || r.bottom < 0) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext]);

  const visibleCards = useMemo(() => {
    const v: { project: Project; index: number; offset: number }[] = [];
    for (let offset = -2; offset <= 2; offset++) {
      const idx = ((activeIndex + offset) % total + total) % total;
      v.push({ project: projects[idx], index: idx, offset });
    }
    return v;
  }, [activeIndex, total]);

  return (
    <section id="projects" ref={sectionRef} style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

      <motion.div className="mb-10 px-8 text-center sm:mb-14 sm:px-12"
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }}>
        <h2 className="mb-3 font-display text-4xl tracking-tight sm:text-5xl" style={{ color: 'var(--text-primary)' }}>
          projects
        </h2>
        <p className="mx-auto max-w-md text-sm" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
          click to explore &middot; arrow keys to navigate
        </p>
      </motion.div>

      {/* ── Desktop carousel ── */}
      <div className="relative mx-auto hidden sm:block overflow-hidden" style={{ height: '460px' }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchStartX.current; if (Math.abs(dx) > 50) dx > 0 ? goPrev() : goNext(); }}>

        <button onClick={goPrev} className="absolute left-2 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 lg:left-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', backdropFilter: 'blur(12px)' }} aria-label="Previous project">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={goNext} className="absolute right-2 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 lg:right-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', backdropFilter: 'blur(12px)' }} aria-label="Next project">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5l7 7-7 7" /></svg>
        </button>

        <div className="relative flex h-full items-center justify-center">
          <AnimatePresence mode="popLayout">
            {visibleCards.map(({ project, index, offset }) => {
              const isActive = offset === 0;
              const absOffset = Math.abs(offset);
              return (
                <motion.article key={project.id} layout
                  layoutId={isActive ? `card-${project.id}` : undefined}
                  className={`project-card ${isActive ? 'chromatic-border' : ''} absolute cursor-pointer overflow-hidden rounded-2xl`}
                  style={{ width: isActive ? '340px' : '260px', height: isActive ? '430px' : '360px', backdropFilter: 'blur(30px) saturate(140%)', zIndex: 10 - absOffset }}
                  initial={{ opacity: 0, x: offset * 280, scale: (isActive ? 1 : 0.82 - absOffset * 0.04) * 0.9 }}
                  animate={{ opacity: isActive ? 1 : 0.55 - (absOffset - 1) * 0.15, x: offset * 280, scale: isActive ? 1 : 0.82 - absOffset * 0.04, y: isActive ? 0 : 10 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={spring}
                  onClick={() => handleCardClick(index)}
                  role="button" tabIndex={isActive ? 0 : -1}
                  aria-label={isActive ? `Open ${project.title}` : `Select ${project.title}`}
                  onKeyDown={(e) => { if (isActive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setExpandedId(project.id); } }}>
                  <div className="relative overflow-hidden" style={{ height: isActive ? '200px' : '160px' }}>
                    <div className="absolute inset-0 opacity-25" style={{ background: `linear-gradient(135deg, ${project.color}, transparent)` }} />
                    <img src={project.image} alt={project.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex flex-col p-5">
                    <h3 className={`mb-2 font-display ${isActive ? 'text-xl' : 'text-base'}`} style={{ color: 'var(--text-primary)' }}>{project.title}</h3>
                    {isActive && <p className="mb-3 text-[13px] leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>}
                    <div className={`${isActive ? 'mt-auto' : 'mt-1'} flex flex-wrap gap-1.5`}>
                      {project.tags.slice(0, isActive ? 4 : 2).map((tag) => (
                        <span key={tag} className="rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide"
                          style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--surface-border)' }}>{tag}</span>
                      ))}
                    </div>
                    {isActive && (
                      <div className="mt-4 flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--accent-blue)' }}>
                        View Project <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3l5 5-5 5" /></svg>
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {projects.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className="h-2 rounded-full transition-all duration-300"
              style={{ width: i === activeIndex ? '24px' : '8px', background: i === activeIndex ? 'var(--accent-blue)' : 'var(--surface-border)' }}
              aria-label={`Go to project ${i + 1}`} />
          ))}
        </div>
      </div>

      {/* ── Mobile carousel ── */}
      <div className="relative sm:hidden"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchStartX.current; if (Math.abs(dx) > 50) dx > 0 ? goPrev() : goNext(); }}>
        <div className="relative mx-auto flex items-center justify-center" style={{ height: '420px' }}>
          <AnimatePresence mode="popLayout">
            {visibleCards.filter(({ offset }) => Math.abs(offset) <= 1).map(({ project, index, offset }) => {
              const isActive = offset === 0;
              return (
                <motion.article key={project.id} layout
                  className={`project-card ${isActive ? 'chromatic-border' : ''} absolute cursor-pointer overflow-hidden rounded-2xl`}
                  style={{ width: isActive ? '300px' : '240px', height: isActive ? '400px' : '340px', backdropFilter: 'blur(30px) saturate(140%)', zIndex: isActive ? 10 : 5 }}
                  initial={{ opacity: 0, x: offset * 200, scale: 0.85 }}
                  animate={{ opacity: isActive ? 1 : 0.5, x: offset * 200, scale: isActive ? 1 : 0.85, y: isActive ? 0 : 10 }}
                  exit={{ opacity: 0, scale: 0.8 }} transition={spring}
                  onClick={() => handleCardClick(index)}>
                  <div className="relative overflow-hidden" style={{ height: isActive ? '180px' : '150px' }}>
                    <div className="absolute inset-0 opacity-25" style={{ background: `linear-gradient(135deg, ${project.color}, transparent)` }} />
                    <img src={project.image} alt={project.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex flex-col p-4">
                    <h3 className={`mb-1 font-display ${isActive ? 'text-lg' : 'text-sm'}`} style={{ color: 'var(--text-primary)' }}>{project.title}</h3>
                    {isActive && <p className="mb-2 text-[12px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>}
                    <div className="mt-auto flex flex-wrap gap-1.5">
                      {project.tags.slice(0, isActive ? 3 : 2).map((tag) => (
                        <span key={tag} className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--surface-border)' }}>{tag}</span>
                      ))}
                    </div>
                    {isActive && (
                      <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent-blue)' }}>
                        View Project <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3l5 5-5 5" /></svg>
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-2 pb-2">
          {projects.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === activeIndex ? '20px' : '6px', background: i === activeIndex ? 'var(--accent-blue)' : 'var(--surface-border)' }}
              aria-label={`Go to project ${i + 1}`} />
          ))}
        </div>
      </div>

      {/* ── Morphic modal ── */}
      <AnimatePresence>
        {expandedId && (
          <ExpandedCard
            project={projects.find((p) => p.id === expandedId)!}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function ExpandedCard({ project, onClose }: { project: Project; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />

      {/* Modal — morphs from card via layoutId */}
      <motion.aside
        layoutId={`card-${project.id}`}
        className="fixed z-50 overflow-hidden rounded-2xl"
        style={{
          width: 'min(680px, 90vw)',
          maxHeight: '88vh',
          top: '50%', left: '50%',
          translateX: '-50%', translateY: '-50%',
          background: 'var(--bg-primary)',
          border: '1px solid var(--surface-border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          overflowY: 'auto',
        }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      >
        {/* Close */}
        <button onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
          style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', minWidth: 44, minHeight: 44 }}
          aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>

        {/* Image */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${project.color}, transparent)` }} />
          <img src={project.image} alt={project.title} className="h-full w-full object-cover" />
        </div>

        {/* Content */}
        <div className="px-10 pb-16 pt-8 lg:px-12">
          <motion.h3 className="mb-4 font-display text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            {project.title}
          </motion.h3>
          <motion.p className="mb-8 text-[15px] leading-[1.9]" style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            {project.description}
          </motion.p>

          {(project.challenge || project.process || project.outcome) && (
            <motion.div className="mb-10 rounded-2xl p-6 flex flex-col gap-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              {project.challenge && <div>
                <span className="mb-1.5 block font-accent text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--accent-indigo)' }}>Challenge</span>
                <p className="text-[14px] leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>{project.challenge}</p>
              </div>}
              {project.process && <div>
                <span className="mb-1.5 block font-accent text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--accent-indigo)' }}>Process</span>
                <p className="text-[14px] leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>{project.process}</p>
              </div>}
              {project.outcome && <div>
                <span className="mb-1.5 block font-accent text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--accent-indigo)' }}>Outcome</span>
                <p className="text-[14px] leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>{project.outcome}</p>
              </div>}
            </motion.div>
          )}

          <motion.div className="mb-10 flex flex-wrap gap-2.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            {project.tags.map((tag) => (
              <span key={tag} className="rounded-full px-4 py-1.5 text-[11px] font-medium tracking-wide"
                style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--surface-border)' }}>{tag}</span>
            ))}
          </motion.div>

          {project.links.length > 0 && (
            <motion.div className="flex flex-col gap-3 pt-8" style={{ borderTop: '1px solid var(--surface-border)' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              {project.links.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{ background: 'var(--accent-blue)', color: 'var(--cta-button-text)' }}
                  onClick={(e) => e.stopPropagation()}>
                  {link.label}
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3h7v7M13 3L5 11" /></svg>
                </a>
              ))}
            </motion.div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
