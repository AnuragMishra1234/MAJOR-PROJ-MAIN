import React from 'react';
import Hero from '../components/landing/Hero';
import WhySection from '../components/landing/WhySection';
import WorkflowSection from '../components/landing/WorkflowSection';
import AgentSection from '../components/landing/AgentSection';
import GenerationSection from '../components/landing/GenerationSection';
import WebsiteGenPreview from '../components/landing/WebsiteGenPreview';
import ValidationSection from '../components/landing/ValidationSection';
import HealingSection from '../components/landing/HealingSection';
import WorkspacePreview from '../components/landing/WorkspacePreview';
import FinalCTA from '../components/landing/FinalCTA';

/**
 * Landing Page (Page 1) — Complete Art Deco Experience
 */
export default function LandingPage({ onNavigate }) {
  return (
    <div className="w-full">
      <Hero onNavigate={onNavigate} />
      <WhySection />
      <WorkflowSection />
      <AgentSection />
      <GenerationSection />
      <WebsiteGenPreview />
      <ValidationSection />
      <HealingSection />
      <WorkspacePreview onNavigate={onNavigate} />
      <FinalCTA onNavigate={onNavigate} />
    </div>
  );
}
