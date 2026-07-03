// TransConnect Training Resource Kit - Main JavaScript

// Resource Data Store
const resourceData = {
    'amplifier-onboarding': {
        title: 'Amplifier Onboarding Guide',
        role: 'amplifier',
        file: '../amplifier-onboarding-guide.md',
        available: true
    },
    'general-onboarding': {
        title: 'General Onboarding Guide',
        role: 'general',
        file: '../general-onboarding-guide.md',
        available: true
    },
    'infantry-onboarding': {
        title: 'Infantry Onboarding Guide',
        role: 'infantry',
        file: '../infantry-onboarding-guide.md',
        available: true
    },
    'amplifier-workflow': {
        title: 'Daily Workflow & Procedures',
        role: 'amplifier',
        file: '../amplifier-daily-workflow.md',
        available: true
    },
    'amplifier-whatsapp-templates': {
        title: 'WhatsApp Response Templates',
        role: 'amplifier',
        file: '../amplifier-whatsapp-templates.md',
        available: true
    },
    'amplifier-weekly-report': {
        title: 'Weekly Report Template',
        role: 'amplifier',
        file: '../amplifier-weekly-report-template.md',
        available: true
    },
    'amplifier-troubleshooting': {
        title: 'Troubleshooting Guide',
        role: 'amplifier',
        file: '../amplifier-troubleshooting-guide.md',
        available: true
    },
    'amplifier-faq': {
        title: 'Customer Support FAQ',
        role: 'amplifier',
        file: '../amplifier-support-faq.md',
        available: true
    }
};

// Generate prompts for resources not yet created
const generatePrompts = {
    'general-workflow': '/generate-training General daily workflow',
    'infantry-workflow': '/generate-training Infantry daily workflow',
    'amplifier-scripts': '/generate-training Amplifier communication scripts',
    'general-scripts': '/generate-training General communication scripts',
    'infantry-scripts': '/generate-training Infantry communication scripts',
    'general-troubleshooting': '/generate-training General troubleshooting guide',
    'infantry-troubleshooting': '/generate-training Infantry troubleshooting guide',
    'amplifier-performance': '/generate-training Amplifier performance assessment',
    'general-performance': '/generate-training General performance assessment',
    'infantry-performance': '/generate-training Infantry performance assessment',
    'kpi-dashboards': '/generate-training KPI dashboard templates',
    'report-templates': '/generate-training weekly report templates',
    'improvement-plans': '/generate-training performance improvement plans',
    'recognition-programs': '/generate-training recognition and incentive programs',
    'milestone-goals': '/generate-training 30-60-90 day goals',
    'meeting-templates': '/generate-training one-on-one meeting templates',
    'feature-reference': '/generate-training platform feature reference',
    'faq-library': '/generate-training customer FAQ library',
    'safety-protocols': '/generate-training safety and security protocols'
};

// Initialize markdown parser
let md;
if (typeof markdownit !== 'undefined') {
    md = markdownit({
        html: true,
        linkify: true,
        typographer: true
    });
}

// Current resource for PDF download
let currentResourceId = null;
let currentResourceContent = null;

// Load resource content
async function loadResource(resourceId) {
    const resource = resourceData[resourceId];
    
    if (!resource || !resource.available) {
        return null;
    }
    
    try {
        const response = await fetch(resource.file);
        if (!response.ok) {
            throw new Error('Resource not found');
        }
        const markdown = await response.text();
        return markdown;
    } catch (error) {
        console.error('Error loading resource:', error);
        return null;
    }
}

// View resource in modal
async function viewResource(resourceId) {
    const modal = document.getElementById('resourceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    const resource = resourceData[resourceId];
    if (!resource) return;
    
    modalTitle.textContent = resource.title;
    modalBody.innerHTML = '<div class="loading">Loading resource</div>';
    
    modal.classList.add('active');
    currentResourceId = resourceId;
    
    const markdown = await loadResource(resourceId);
    
    if (markdown && md) {
        currentResourceContent = markdown;
        const html = md.render(markdown);
        modalBody.innerHTML = html;
    } else {
        modalBody.innerHTML = '<p>Unable to load resource content.</p>';
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('resourceModal');
    modal.classList.remove('active');
    currentResourceId = null;
    currentResourceContent = null;
}

// Download PDF - using html2pdf.js
async function downloadPDF(resourceId) {
    const resource = resourceData[resourceId];
    if (!resource || !resource.available) {
        alert('This resource is not yet available. Click "Generate Now" to create it.');
        return;
    }
    
    const markdown = await loadResource(resourceId);
    if (!markdown || !md) {
        alert('Unable to load resource content for PDF generation.');
        return;
    }
    
    // Create a temporary container for PDF content
    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.width = '210mm'; // A4 width
    pdfContainer.style.padding = '20mm';
    pdfContainer.style.background = 'white';
    pdfContainer.style.fontFamily = 'Inter, sans-serif';
    pdfContainer.style.fontSize = '11pt';
    pdfContainer.style.lineHeight = '1.6';
    pdfContainer.style.color = '#1F2937';
    
    // Add TransConnect header
    const header = document.createElement('div');
    header.style.marginBottom = '30px';
    header.style.paddingBottom = '20px';
    header.style.borderBottom = '2px solid #2563EB';
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
            <div style="width: 32px; height: 32px; background: #2563EB; border-radius: 6px;"></div>
            <div>
                <div style="font-size: 18pt; font-weight: 700; color: #111827;">TransConnect</div>
                <div style="font-size: 9pt; color: #6B7280;">Training Resource Kit</div>
            </div>
        </div>
        <h1 style="font-size: 20pt; font-weight: 800; color: #111827; margin: 20px 0 10px 0;">${resource.title}</h1>
        <div style="font-size: 9pt; color: #6B7280;">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    `;
    pdfContainer.appendChild(header);
    
    // Add content
    const content = document.createElement('div');
    content.innerHTML = md.render(markdown);
    
    // Style the content for PDF
    const styles = `
        h1 { font-size: 18pt; font-weight: 700; color: #111827; margin: 25px 0 15px 0; page-break-after: avoid; }
        h2 { font-size: 16pt; font-weight: 600; color: #1F2937; margin: 20px 0 12px 0; page-break-after: avoid; }
        h3 { font-size: 14pt; font-weight: 600; color: #374151; margin: 18px 0 10px 0; page-break-after: avoid; }
        h4 { font-size: 12pt; font-weight: 600; color: #4B5563; margin: 15px 0 8px 0; }
        p { margin: 0 0 12px 0; color: #374151; line-height: 1.7; }
        ul, ol { margin: 0 0 12px 0; padding-left: 25px; }
        li { margin: 6px 0; color: #374151; }
        strong { color: #111827; font-weight: 600; }
        em { font-style: italic; color: #4B5563; }
        code { background: #F3F4F6; padding: 2px 6px; border-radius: 3px; font-size: 10pt; color: #1F2937; font-family: monospace; }
        pre { background: #F9FAFB; padding: 15px; border-radius: 6px; overflow-x: auto; margin: 12px 0; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
        th, td { padding: 10px; border: 1px solid #E5E7EB; text-align: left; }
        th { background: #F3F4F6; font-weight: 600; color: #111827; }
        blockquote { border-left: 3px solid #2563EB; padding-left: 15px; margin: 12px 0; color: #4B5563; font-style: italic; }
        hr { border: none; border-top: 1px solid #E5E7EB; margin: 20px 0; }
        .section { page-break-inside: avoid; }
    `;
    
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    content.insertBefore(styleTag, content.firstChild);
    
    pdfContainer.appendChild(content);
    document.body.appendChild(pdfContainer);
    
    // Generate PDF
    const opt = {
        margin: [15, 15, 15, 15],
        filename: `TransConnect-${resourceId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    try {
        await html2pdf().set(opt).from(pdfContainer).save();
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
    } finally {
        document.body.removeChild(pdfContainer);
    }
}

// Download current PDF from modal
async function downloadCurrentPDF() {
    if (currentResourceId) {
        await downloadPDF(currentResourceId);
    }
}

// Generate resource (show prompt to user)
function generateResource(resourceId) {
    const prompt = generatePrompts[resourceId];
    if (!prompt) {
        alert('Generation prompt not defined for this resource.');
        return;
    }
    
    const message = `To generate this resource, use the following command in your chat:\n\n${prompt}\n\nThis will create the training material, and it will automatically appear in this resource kit.`;
    
    // Create custom modal for generation
    const modal = document.getElementById('resourceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = 'Generate Training Resource';
    modalBody.innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">🚀</div>
            <h3 style="margin-bottom: 15px; color: #111827;">Ready to Create This Resource?</h3>
            <p style="margin-bottom: 20px; color: #6B7280;">Use the training generation prompt to create this material:</p>
            <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace; color: #2563EB; font-weight: 600;">
                ${prompt}
            </div>
            <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
                Copy this command and use it in your TransConnect chat to generate the training material. 
                Once created, refresh this page to see the new resource.
            </p>
            <button class="btn btn-primary" onclick="copyToClipboard('${prompt}')" style="margin-top: 20px;">
                Copy Command
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Command copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Filter by role
function filterByRole(role) {
    const cards = document.querySelectorAll('.resource-card');
    cards.forEach(card => {
        if (role === 'all') {
            card.style.display = 'flex';
        } else {
            const cardRole = card.getAttribute('data-role');
            card.style.display = (cardRole === role || !cardRole) ? 'flex' : 'none';
        }
    });
}

// Smooth scroll to section
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
        }
    });
});

// Close modal on background click
document.getElementById('resourceModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close modal
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Update nav on scroll
let ticking = false;
window.addEventListener('scroll', function() {
    if (!ticking) {
        window.requestAnimationFrame(function() {
            updateActiveNav();
            ticking = false;
        });
        ticking = true;
    }
});

function updateActiveNav() {
    const sections = document.querySelectorAll('.section[id]');
    const scrollPos = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('TransConnect Training Resource Kit loaded');
    console.log(`Available resources: ${Object.keys(resourceData).length}`);
    console.log(`Pending resources: ${Object.keys(generatePrompts).length}`);
});

// Export for global access
window.viewResource = viewResource;
window.closeModal = closeModal;
window.downloadPDF = downloadPDF;
window.downloadCurrentPDF = downloadCurrentPDF;
window.generateResource = generateResource;
window.filterByRole = filterByRole;
window.copyToClipboard = copyToClipboard;
