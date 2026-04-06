/**
 * ProjectCards — Active Centre Focus + Drawer
 *
 * One centred "active" card is always expanded and fully legible.
 * Neighbour cards are shown at reduced opacity and scale — clicking
 * any card makes it the active centre. Arrow keys and swipe navigate.
 * Clicking the active card opens the detail drawer.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projects } from '../data/projects';
import type { Project } from '../data/projects';

const springTransition = { type: 'spring' as const, stiffness: 260, damping: 28 };

export default function ProjectCards() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const touchStartX = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);

  const total = projects.length;

  const goTo = useCallback((index: number) => {
    setActiveIndex(((index % total) + total) % total);
  }, [total]);

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  const handleCardClick = useCallback((index: number) => {
    if (index === activeIndex) {
      setExpandedId(projects[index].id);
    } else {
      goTo(index);
    }
  }, [activeIndex, goTo]);

  const handleClose = useCallback(() => setExpandedId(null), []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Only respond when section is in viewport
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goPrev, goNext]);

  // Determine which cards to show: active + up to 2 on each side
  const visibleCards = useMemo(() => {
    const visible: { project: Project; index: number; offset: number }[] = [];
    for (let offset = -2; offset <= 2; offset++) {
      const idx = ((activeIndex + offset) % total + total) % total;
      visible.push({ project: projects[idx], index: idx, offset });
    }
    return visible;
  }, [activeIndex, total]);

  return (
    <section id="projects" ref={sectionRef} style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <motion.div
        className="mb-10 px-8 text-center sm:mb-14 sm:px-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
      >
        <h2
          className="mb-3 font-display text-4xl tracking-tight sm:text-5xl"
          style={{ color: 'var(--text-primary)' }}
        >
          projects
        </h2>
        <p
          className="mx-auto max-w-md text-sm"
          style={{ color: 'var(--text-secondary)', opacity: 0.7 }}
        >
          click to explore &middot; arrow keys to navigate
        </p>
      </motion.div>

      {/* ── Desktop: Active Centre Focus ── */}
      <div
        className="relative mx-auto hidden sm:block overflow-hidden"
        style={{ height: '460px', maxWidth: '100%' }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 50) dx > 0 ? goPrev() : goNext();
        }}
      >
        {/* Arrow buttons */}
        <button
          onClick={goPrev}
          className="absolute left-2 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 lg:left-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--surface-border)',
            color: 'var(--text-primary)',
            backdropFilter: 'blur(12px)',
          }}
          aria-label="Previous project"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goNext}
          className="absolute right-2 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 lg:right-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--surface-border)',
            color: 'var(--text-primary)',
            backdropFilter: 'blur(12px)',
          }}
          aria-label="Next project"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Card carousel */}
        <div className="relative flex h-full items-center justify-center">
          <AnimatePresence mode="popLayout">
            {visibleCards.map(({ project, index, offset }) => {
              const isActive = offset === 0;
              const absOffset = Math.abs(offset);

              // Positioning
              const x = offset * 280;
              const scale = isActive ? 1 : 0.82 - absOffset * 0.04;
              const opacity = isActive ? 1 : 0.55 - (absOffset - 1) * 0.15;
              const zIndex = 10 - absOffset;

              return (
                <motion.article
                  key={project.id}
                  layout
                  className={`project-card ${isActive ? 'chromatic-border' : ''} absolute cursor-pointer overflow-hidden rounded-2xl`}
                  style={{
                    width: isActive ? '340px' : '260px',
                    height: isActive ? '430px' : '360px',
                    backdropFilter: 'blur(30px) saturate(140%)',
                    zIndex,
                  }}
                  initial={{ opacity: 0, x, scale: scale * 0.9 }}
                  animate={{ opacity, x, scale, y: isActive ? 0 : 10 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={springTransition}
                  onClick={() => handleCardClick(index)}
                  role="button"
                  tabIndex={isActive ? 0 : -1}
                  aria-label={isActive ? `Open ${project.title}` : `Select ${project.title}`}
                  onKeyDown={(e) => {
                    if (isActive && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      setExpandedId(project.id);
                    }
                  }}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ height: isActive ? '200px' : '160px' }}>
                    <div
                      className="absolute inset-0 opacity-25"
                      style={{ background: `linear-gradient(135deg, ${project.color}, transparent)` }}
                    />
                    <img
                      src={project.image}
                      alt={project.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Body */}
                  <div className="flex flex-col p-5">
                    <h3
                      className={`mb-2 font-display ${isActive ? 'text-xl' : 'text-base'}`}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {project.title}
                    </h3>

                    {isActive && (
                      <p
                        className="mb-3 text-[13px] leading-relaxed line-clamp-3"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {project.description}
                      </p>
                    )}

                    <div className={`${isActive ? 'mt-auto' : 'mt-1'} flex flex-wrap gap-1.5`}>
                      {project.tags.slice(0, isActive ? 4 : 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide"
                          style={{
                            background: 'var(--surface)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--surface-border)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {isActive && (
                      <div
                        className="mt-4 flex items-center gap-1.5 text-sm font-medium"
                        style={{ color: 'var(--accent-blue)' }}
                      >
                        View Project
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M6 3l5 5-5 5" />
                        </svg>
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {projects.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? '24px' : '8px',
                background: i === activeIndex ? 'var(--accent-blue)' : 'var(--surface-border)',
              }}
              aria-label={`Go to project ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Mobile: Swipeable cards ── */}
      <div
        className="relative sm:hidden"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 50) dx > 0 ? goPrev() : goNext();
        }}
      >
        <div className="relative mx-auto flex items-center justify-center" style={{ height: '420px' }}>
          <AnimatePresence mode="popLayout">
            {visibleCards
              .filter(({ offset }) => Math.abs(offset) <= 1)
              .map(({ project, index, offset }) => {
                const isActive = offset === 0;
                return (
                  <motion.article
                    key={project.id}
                    layout
                    className={`project-card ${isActive ? 'chromatic-border' : ''} absolute cursor-pointer overflow-hidden rounded-2xl`}
                    style={{
                      width: isActive ? '300px' : '240px',
                      height: isActive ? '400px' : '340px',
                      backdropFilter: 'blur(30px) saturate(140%)',
                        zIndex: isActive ? 10 : 5,
                    }}
                    initial={{ opacity: 0, x: offset * 200, scale: 0.85 }}
                    animate={{
                      opacity: isActive ? 1 : 0.5,
                      x: offset * 200,
                      scale: isActive ? 1 : 0.85,
                      y: isActive ? 0 : 10,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={springTransition}
                    onClick={() => handleCardClick(index)}
                  >
                    <div className="relative overflow-hidden" style={{ height: isActive ? '180px' : '150px' }}>
                      <div
                        className="absolute inset-0 opacity-25"
                        style={{ background: `linear-gradient(135deg, ${project.color}, transparent)` }}
                      />
                      <img
                        src={project.image}
                        alt={project.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-col p-4">
                      <h3
                        className={`mb-1 font-display ${isActive ? 'text-lg' : 'text-sm'}`}
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {project.title}
                      </h3>
                      {isActive && (
                        <p
                          className="mb-2 text-[12px] leading-relaxed line-clamp-2"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {project.description}
                        </p>
                      )}
                      <div className="mt-auto flex flex-wrap gap-1.5">
                        {project.tags.slice(0, isActive ? 3 : 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              background: 'var(--surface)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--surface-border)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {isActive && (
                        <div
                          className="mt-3 flex items-center gap-1 text-xs font-medium"
                          style={{ color: 'var(--accent-blue)' }}
                        >
                          View Project
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M6 3l5 5-5 5" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </motion.article>
                );
              })}
          </AnimatePresence>
        </div>

        {/* Mobile dot indicators */}
        <div className="flex justify-center gap-2 pb-2">
          {projects.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? '20px' : '6px',
                background: i === activeIndex ? 'var(--accent-blue)' : 'var(--surface-border)',
              }}
              aria-label={`Go to project ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Expanded drawer ── */}
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

/* ── Expanded overlay — glassmorphic drawer ── */

function ExpandedCard({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40"
        style={{ background: 'var(--overlay-backdrop)', backdropFilter: 'blur(12px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Slide-over drawer */}
      <motion.aside
        className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto sm:w-[520px] md:w-[560px] lg:w-[600px]"
        style={{
          background: 'var(--bg-primary)',
          borderLeft: '1px solid var(--surface-border)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--surface-border)',
            color: 'var(--text-primary)',
            minWidth: '44px',
            minHeight: '44px',
          }}
          aria-label="Close project details"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {/* Image */}
        <div className="px-10 pt-10 lg:px-14 lg:pt-12">
          <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '16/10' }}>
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: `linear-gradient(135deg, ${project.color}, transparent)` }}
            />
            <img
              src={project.image}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-[640px] px-10 pb-20 pt-10 lg:px-14">
          <motion.h3
            className="mb-5 font-display text-2xl sm:text-3xl"
            style={{ color: 'var(--text-primary)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {project.title}
          </motion.h3>

          <motion.p
            className="mb-10 text-[15px] leading-[1.9]"
            style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {project.description}
          </motion.p>

          {/* Case study — Challenge / Process / Outcome */}
          {(project.challenge || project.process || project.outcome) && (
            <motion.div
              className="mb-10 rounded-2xl p-6 flex flex-col gap-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
            >
              {project.challenge && (
                <div>
                  <span className="mb-1.5 block font-accent text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--accent-indigo)' }}>Challenge</span>
                  <p className="text-[14px] leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>{project.challenge}</p>
                </div>
              )}
              {project.process && (
                <div>
                  <span className="mb-1.5 block font-accent text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--accent-indigo)' }}>Process</span>
                  <p className="text-[14px] leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>{project.process}</p>
                </div>
              )}
              {project.outcome && (
                <div>
                  <span className="mb-1.5 block font-accent text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--accent-indigo)' }}>Outcome</span>
                  <p className="text-[14px] leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>{project.outcome}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Tags */}
          <motion.div
            className="mb-10 flex flex-wrap gap-2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-4 py-1.5 text-[11px] font-medium tracking-wide"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--surface-border)',
                }}
              >
                {tag}
              </span>
            ))}
          </motion.div>

          {/* Links */}
          {project.links.length > 0 && (
            <motion.div
              className="flex flex-col gap-3 pt-8"
              style={{ borderTop: '1px solid var(--surface-border)' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {project.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{
                    background: 'var(--accent-blue)',
                    color: 'var(--cta-button-text)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {link.label}
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 3h7v7M13 3L5 11" />
                  </svg>
                </a>
              ))}
            </motion.div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
