---
description: "Generate training content for TransConnect team roles: onboarding guides, daily workflows, training modules, performance assessments, communication scripts, troubleshooting guides. Use when: creating training materials, onboarding documentation, field agent guides, role-specific procedures, KPI assessment criteria."
name: "Generate Training Content"
argument-hint: "Role name and content type (e.g., 'Amplifier onboarding guide')"
agent: "agent"
---

# Generate TransConnect Training Content

You are creating training materials for the TransConnect MVP1 bus ticketing platform. Reference [training.md](../../training.md) for complete role specifications including KPAs and KPIs.

## Available Roles

1. **Digital Marketing & Support Specialist** ("The Amplifier")
2. **Field Operations Lead** ("The General")  
3. **Brand Ambassador** ("The Infantry")

## Content Types

Based on the user's request, generate one of the following:

### 1. Onboarding Guide
- Welcome message and company mission
- Role overview and reporting structure
- First week schedule with daily objectives
- System access setup (tools, platforms, credentials)
- Key contacts and escalation paths
- Success criteria for onboarding period

### 2. Daily Workflow Procedures
- Start-of-day checklist
- Core responsibilities by time block
- Standard operating procedures
- End-of-day reporting requirements
- Common scenarios and handling protocols

### 3. Role-Specific Training Modules
- Module objectives and learning outcomes
- Step-by-step procedures with screenshots/examples
- Best practices and do's/don'ts
- Practice exercises or scenarios
- Assessment quiz (5-10 questions)
- Reference materials and resources

### 4. Performance Assessment Criteria
- KPI definitions and measurement methods
- Performance rating scale (Below/Meets/Exceeds Expectations)
- Weekly/monthly assessment template
- Improvement plan framework
- Recognition criteria for outstanding performance

### 5. Communication Scripts/Templates
- Customer interaction scripts (greetings, FAQs, objection handling)
- WhatsApp response templates
- Daily/weekly report templates
- Escalation email templates
- Terminal manager communication guidelines

### 6. Troubleshooting Guides
- Common issues and solutions matrix
- Technical problems (app, payment, QR codes)
- Operational issues (terminal access, bus partnerships)
- When to escalate and to whom
- Emergency contact procedures

## Output Format

Structure the content as follows:

```markdown
# [Content Type]: [Role Name]

**Last Updated:** [Current Date]  
**Version:** 1.0  
**Target Role:** [Role Name with nickname]

## Overview
[Brief description of this training material's purpose]

## Content Sections
[Organized, role-specific content with clear headings]

### Key Performance Connection
[How this training relates to the role's KPAs/KPIs from training.md]

## Quick Reference
[Bullet-point summary or checklist for easy reference]

## Resources & Support
- Technical Lead Contact: [From org structure]
- Related Documents: [List relevant files]
- Tools & Platforms: [Specific to role]

---
*Part of TransConnect MVP1 Training System*
```

## Context Requirements

When generating content:

1. **Always reference** [training.md](../../training.md) for:
   - Accurate job titles and reporting structure
   - Specific KPAs and KPIs
   - Start dates and employment details

2. **Use TransConnect platform context**:
   - Mobile app: Flutter-based passenger application
   - Admin dashboard: React-based operator tools
   - Payment methods: MTN Mobile Money, Airtel Money, Flutterwave
   - QR code ticketing system
   - Key terminals: Namayiba, Link Bus (Kampala)
   - Launch date: July 1, 2026

3. **Maintain tone**:
   - Professional but approachable
   - Action-oriented and practical
   - Empowering (focus on impact and success)
   - Clear and unambiguous

4. **Include role-specific details**:
   - **Amplifier**: Digital channels, CPI targets, WhatsApp support, app store ratings
   - **General**: Terminal relations, team management, branding metrics, field logistics
   - **Infantry**: Direct passenger engagement, installation quotas, feedback collection

## Quality Standards

Ensure training content:
- ✅ Directly maps to role KPAs and KPIs
- ✅ Provides actionable, measurable steps
- ✅ Includes specific examples relevant to TransConnect
- ✅ Uses simple language appropriate for diverse education levels
- ✅ Contains practical tips from field operations perspective
- ✅ Follows TransConnect brand voice (innovative, reliable, customer-centric)

## Example Invocation Patterns

- "Create onboarding guide for Brand Ambassador"
- "Generate daily workflow for the General"
- "Build troubleshooting guide for Amplifier role"
- "Design performance assessment for Infantry"
- "Write communication scripts for Field Operations Lead"
