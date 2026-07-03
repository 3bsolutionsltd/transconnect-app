# TransConnect Training Resource Kit

A comprehensive web-based training portal for TransConnect MVP1 launch team members. This resource kit provides access to all training materials, with PDF download capabilities and a professionally branded interface.

## 📋 Overview

The Training Resource Kit is designed to support the **July 1, 2026** launch of TransConnect MVP1 in Kampala, Uganda. It serves three key roles:

- **Amplifier** - Digital Marketing & Support Specialist
- **General** - Field Operations Lead  
- **Infantry** - Brand Ambassador

## 🚀 Features

### ✅ Current Features
- **3 Complete Onboarding Guides** (10-day structured programs)
- **Role-Specific Content** with color-coded organization
- **PDF Download** for all available resources
- **Responsive Design** works on desktop, tablet, and mobile
- **Markdown Rendering** for rich content display
- **Easy Navigation** with smooth scrolling
- **Modal Viewing** for focused reading experience
- **Generation Prompts** for creating new resources

### 📊 Resource Categories

1. **Onboarding Guides** (3/3 available)
   - Amplifier 10-Day Onboarding
   - General 10-Day Onboarding
   - Infantry 10-Day Onboarding

2. **Operational Guides** (0/9 available)
   - Daily workflows for each role
   - Communication scripts
   - Troubleshooting guides

3. **Performance Tools** (0/9 available)
   - Performance assessments
   - KPI dashboards
   - Weekly report templates
   - Improvement plans
   - Recognition programs
   - 30-60-90 day goals
   - One-on-one meeting templates

4. **Support Materials** (0/3 available)
   - Platform feature reference
   - Customer FAQ library
   - Safety & security protocols

## 🛠️ Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript** - No framework dependencies
- **markdown-it.js** - Markdown parsing and rendering
- **html2pdf.js** - Client-side PDF generation
- **Google Fonts (Inter)** - Professional typography

## 📁 File Structure

```
training/resource-kit/
├── index.html              # Main portal page
├── styles.css              # TransConnect branded styles
├── app.js                  # Core functionality
└── README.md              # This file

training/
├── amplifier-onboarding-guide.md
├── general-onboarding-guide.md
├── infantry-onboarding-guide.md
└── training.md            # Role definitions & KPIs
```

## 🎯 Usage

### Opening the Portal

1. Navigate to the `training/resource-kit/` directory
2. Open `index.html` in any modern web browser
3. All resources load instantly (no server required)

### Viewing Resources

1. Browse available resources in each section
2. Click **"View Guide"** to read in the modal viewer
3. Click **"Download PDF"** to save a branded PDF copy
4. Use the navigation bar to jump between sections

### Generating New Resources

For resources marked "Coming Soon":

1. Click **"Generate Now"** button
2. Copy the provided prompt command
3. Use the command in your TransConnect chat with Copilot
4. Refresh the page once the resource is created

Example prompt:
```
/generate-training Amplifier daily workflow
```

### PDF Downloads

All PDF downloads include:
- **TransConnect branding** with logo and colors
- **Formatted content** with proper headings and spacing
- **Print-optimized** layout for easy reading
- **Generation date** for version tracking

## 🎨 Branding

The resource kit follows TransConnect's brand guidelines:

### Colors
- **Primary Blue**: `#2563EB` - Main brand color
- **Primary Dark**: `#1E40AF` - Hover states
- **Accent Green**: `#10B981` - Success/General role
- **Accent Yellow**: `#F59E0B` - Warning/Infantry role
- **Accent Red**: `#EF4444` - Critical items/Amplifier role

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold weights (600-800)
- **Body**: Regular weight (400)
- **Line Height**: 1.6 for readability

### Design Principles
- **Clean & Professional** - Minimal clutter
- **Mobile-First** - Responsive at all breakpoints
- **Accessible** - WCAG AA compliant colors
- **Fast** - No heavy dependencies

## 🔧 Customization

### Adding New Resources

1. Create the markdown file in `training/` directory
2. Add entry to `resourceData` in `app.js`:

```javascript
'resource-id': {
    title: 'Resource Title',
    role: 'amplifier', // or 'general' or 'infantry'
    file: '../filename.md',
    available: true
}
```

3. Update HTML to add the resource card
4. Refresh the portal

### Modifying Styles

Edit `styles.css` and use CSS variables for consistency:

```css
:root {
    --primary-blue: #2563EB;
    --spacing-lg: 2rem;
    --radius-xl: 1rem;
}
```

### Extending Functionality

The `app.js` file is modular and easy to extend:

- `loadResource(resourceId)` - Fetch markdown content
- `viewResource(resourceId)` - Display in modal
- `downloadPDF(resourceId)` - Generate PDF
- `generateResource(resourceId)` - Show generation prompt

## 📱 Browser Support

Tested and working on:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## ⚡ Performance

- **First Load**: < 1 second (all files < 200KB total)
- **Resource Loading**: Instant (local file access)
- **PDF Generation**: 2-5 seconds (depends on content length)
- **No Backend Required**: Runs entirely in browser

## 🔒 Security

- **No External API Calls** - All data is local
- **No User Tracking** - Privacy-focused
- **No Authentication** - Open access for team members
- **Client-Side Only** - No server vulnerabilities

## 📝 Content Guidelines

When creating new training materials:

1. **Use Markdown** - Keeps content portable and version-controllable
2. **Follow Structure** - Use consistent heading hierarchy
3. **Include Examples** - Real scenarios from TransConnect
4. **Reference KPIs** - Link back to role metrics in `training.md`
5. **Add Dates** - Include creation/update dates in content
6. **Be Practical** - Focus on actionable information

## 🎓 Training Material Types

The system supports 6 types of training content:

1. **Onboarding Guides** - 10-day structured programs
2. **Daily Workflows** - Step-by-step daily routines
3. **Training Modules** - Skill-building lessons
4. **Performance Assessments** - Evaluation frameworks
5. **Communication Scripts** - Pre-written messaging templates
6. **Troubleshooting Guides** - Problem-solving resources

## 🚀 Deployment

### Local Development
- Simply open `index.html` in a browser
- No build process required

### Web Hosting
To host online:

1. Upload entire `resource-kit/` folder to web server
2. Ensure relative paths to `../training/*.md` files work
3. No server-side configuration needed
4. Works with GitHub Pages, Netlify, Vercel, etc.

### Intranet Deployment
Perfect for company intranet:

1. Place on shared drive or internal web server
2. Team members can bookmark the URL
3. Updates automatically when new `.md` files are added

## 📊 Metrics

The resource kit tracks:
- **21 Total Resources** planned
- **3 Available** (onboarding guides)
- **18 Pending** (operational, performance, support)
- **3 Roles** supported (Amplifier, General, Infantry)

## 🤝 Contributing

To add new training materials:

1. Use the generation prompt: `/generate-training [Role] [content type]`
2. Save the generated markdown in `training/` directory
3. Update `app.js` to register the new resource
4. Add resource card in `index.html`
5. Test PDF download functionality

## 📞 Support

For issues or questions:
- **Project**: TransConnect MVP1
- **Organization**: 3B Solutions Ltd
- **Repository**: github.com/3bsolutionsltd/transconnect-app
- **Location**: Kampala, Uganda
- **Launch Date**: July 1, 2026

## 📜 License

Internal training materials for TransConnect launch team. All content is proprietary to 3B Solutions Ltd.

---

**Built for the TransConnect MVP1 Launch Team** 🚀  
*Empowering Amplifiers, Generals, and Infantry to transform urban mobility in Uganda*
