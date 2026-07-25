const isLocalPreview =
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

const SITE = {
    // Update canonicalUrl, contactEmail, privacyEmail, and og:url tags across HTML when domain goes live.
    brandName: 'Bespoke AI',
    legalName: 'Bespoke Core AI Engineering Limited',
    contactEmail: 'info@bespoke-ai.ie',
    privacyEmail: 'info@bespoke-ai.ie',
    linkedIn: 'https://www.linkedin.com/in/karl-nolan-bespoke-ai/',
    canonicalUrl: 'https://www.bespoke-ai.ie/',
    googleFormUrl: 'https://forms.gle/HCQSAhwR9JJpygxb9',
    showWorkshop: false,
    workshopHubUrl: 'agentic-impact-workshop.html',
    workshopApplicationFormUrls: {
        foundations: 'https://docs.google.com/forms/d/e/1FAIpQLSfxOWUF7taVGa3elYl28JZpebJwUcFnpKG42qyZaRLhYbymIg/viewform',
        engineering: 'https://docs.google.com/forms/d/e/1FAIpQLSfqQlawqCZfgIwJ653dPEME039aB303ZOzGn--tyxBqCZKJkQ/viewform',
        automation: 'https://docs.google.com/forms/d/e/1FAIpQLSfiq9GHiqYih0mAi3BoxI8cZA9P643JNAviMdsPb2cN5BiPEA/viewform',
    },
    workshopOnePagerPdf: 'workshop-one-pager.pdf',
    partialVersion: '20260725j',
    assessmentUrl: 'https://www.bespoke-ai.ie/assessment',
    workflowAssessmentUrl: 'workflow-assessment.html',
    whatWeAutomateUrl: 'what-we-automate.html',
    scopingUrl: 'scoping.html',
    aboutUrl: 'about.html',
    aiEngineeringUrl: 'ai-engineering.html',
    caseStudiesUrl: 'case-studies.html',
    navOrder: ['offer', 'engagement', 'scoping', 'where-to-start', 'case-studies', 'about', 'ai-engineering', 'workshop'],
    // Prod URLs — used on VPS. On localhost, chat points at local n8n (see below).
    chatWebhookUrl: isLocalPreview
        ? 'http://localhost:5678/webhook/bcai-website-chat/chat'
        : 'https://www.bespoke-ai.ie/webhook/bcai-website-chat/chat',
    chatWarmCacheUrl: isLocalPreview
        ? 'http://localhost:5678/webhook/bcai-warm-knowledge'
        : 'https://www.bespoke-ai.ie/webhook/bcai-warm-knowledge',
    chatGreeting: 'Hi — I\'m Ask BCAI (Bespoke Core AI Engineering). I can answer questions about Bespoke AI and this website. What would you like to know?',
    bookingUrl: isLocalPreview
        ? 'https://www.bespoke-ai.ie/webhook/booking'
        : 'https://www.bespoke-ai.ie/webhook/booking',
    bookingSuccessUrl: isLocalPreview
        ? 'http://127.0.0.1:8765/index.html?call-booked=1'
        : 'https://www.bespoke-ai.ie/index.html?call-booked=1',
    googleDriveKnowledgeFolderId: '1TtHiEjxrG20SCaAK4G-EuzRJY7TcKQA2',
};
