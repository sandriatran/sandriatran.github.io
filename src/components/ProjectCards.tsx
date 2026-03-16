/**
 * ProjectCards — React Island (Interactive Card Stack)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projects } from '../data/projects';
import type { Project } from '../data/projects';

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 };

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springTransition, opacity: { duration: 0.4 } },
  },
};

export default function ProjectCards() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCardClick = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleClose = () => setExpandedId(null);

  return (
    <section id="projects">
      <motion.div
        className="mb-14 text-center"
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
      </motion.div>

      {/* Card grid */}
      <motion.div
        className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-2 sm:px-8 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            isExpanded={expandedId === project.id}
            onClick={() => handleCardClick(project.id)}
            isLastOdd={projects.length % 2 === 1 && index === projects.length - 1}
            isSingleLg={projects.length % 3 === 1 && index === projects.length - 1}
          />
        ))}
      </motion.div>

      {/* Expanded overlay */}
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

/* ── Card (grid item) — glassmorphic ── */

function ProjectCard({
  project,
  isExpanded,
  onClick,
  isLastOdd,
  isSingleLg,
}: {
  project: Project;
  isExpanded: boolean;
  onClick: () => void;
  isLastOdd: boolean;
  isSingleLg?: boolean;
}) {
  return (
    <motion.article
      className={`group project-card relative cursor-pointer overflow-hidden rounded-2xl ${isLastOdd ? 'sm:col-span-2 sm:max-w-md sm:mx-auto lg:col-span-1 lg:max-w-none lg:mx-0' : ''} ${isSingleLg ? 'lg:col-start-2' : ''}`}
      style={{
        backdropFilter: 'blur(30px) saturate(140%)',
        WebkitBackdropFilter: 'blur(30px) saturate(140%)',
        transition: 'box-shadow 0.3s ease',
      }}
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -6 }}
      transition={springTransition}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Card image */}
      <div className="relative h-48 overflow-hidden sm:h-52">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(135deg, ${project.color}, transparent)`,
          }}
        />
        <img
          src={project.image}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Card body */}
      <div className="flex flex-col justify-between p-6" style={{ minHeight: '200px' }}>
        <h3
          className="mb-2 font-display text-[22px]"
          style={{ color: 'var(--text-primary)' }}
        >
          {project.title}
        </h3>
        <p
          className="mb-4 text-[15px] leading-relaxed line-clamp-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          {project.description}
        </p>

        <div>
          {/* Tags row */}
          <div className="flex flex-wrap gap-2">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-[11px] font-medium tracking-wide"
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

          {/* View Project hover affordance */}
          <div
            className="mt-4 flex items-center gap-1.5 text-sm font-medium opacity-70 transition-opacity duration-300 group-hover:opacity-100"
            style={{ color: 'var(--accent-blue)' }}
          >
            View Project
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ── Expanded overlay — glassmorphic ── */

function ExpandedCard({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40"
        style={{ background: 'var(--overlay-backdrop)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
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

        {/* Image — contained, not full-bleed */}
        <div className="px-8 pt-8 sm:px-10 sm:pt-10">
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

        {/* Content — generous spacing */}
        <div className="px-8 pb-16 pt-8 sm:px-10 sm:pb-20 sm:pt-10">
          <motion.h3
            className="mb-4 font-display text-2xl sm:text-3xl"
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
