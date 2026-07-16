const isLocalPreview =
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

const SITE = {
    // Update canonicalUrl, contactEmail, privacyEmail, and og:url tags across HTML when domain goes live.
    brandName: 'Bespoke AI',
    legalName: 'Bespoke Core AI Engineering Limited',
    contactEmail: 'karlnolan@bespoke-ai.ie',
    privacyEmail: 'privacy@ai-development.ie',
    linkedIn: 'https://www.linkedin.com/in/karl-nolan-69433b29/',
    canonicalUrl: '${CANONICAL_URL}',
    googleFormUrl: 'https://forms.gle/HCQSAhwR9JJpygxb9',
    showWorkshop: false,
    workshopHubUrl: 'workshops.html',
    workshopApplicationFormUrls: {
        foundations: 'https://docs.google.com/forms/d/e/1FAIpQLSfxOWUF7taVGa3elYl28JZpebJwUcFnpKG42qyZaRLhYbymIg/viewform',
        engineering: 'https://docs.google.com/forms/d/e/1FAIpQLSfqQlawqCZfgIwJ653dPEME039aB303ZOzGn--tyxBqCZKJkQ/viewform',
        automation: 'https://docs.google.com/forms/d/e/1FAIpQLSfiq9GHiqYih0mAi3BoxI8cZA9P643JNAviMdsPb2cN5BiPEA/viewform',
    },
    workshopOnePagerPdf: 'workshop-one-pager.pdf',
    partialVersion: '20260701a',
    assessmentUrl: '${ASSESSMENT_URL}',
    whatWeAutomateUrl: 'what-we-automate.html',
    navOrder: ['engagement', 'about', 'case-studies', 'our-service', 'what-we-automate', 'assessment'],
    // Prod URLs — used on VPS. On localhost, chat points at local n8n (see below).
    chatWebhookUrl: isLocalPreview
        ? 'http://localhost:5678/webhook/bcai-website-chat/chat'
        : '${CHAT_WEBHOOK_URL}',
    chatWarmCacheUrl: isLocalPreview
        ? 'http://localhost:5678/webhook/bcai-warm-knowledge'
        : '${CHAT_WARM_CACHE_URL}',
    chatGreeting: 'Hi — I\'m Ask BCAI (Bespoke Core AI Engineering). I can answer questions about Bespoke AI and this website. What would you like to know?',
    bookingUrl: isLocalPreview
        ? 'http://localhost:5678/webhook/booking'
        : '${BOOKING_URL}',
    bookingSuccessUrl: isLocalPreview
        ? 'http://localhost:8080/index.html?call-booked=1'
        : '${BOOKING_SUCCESS_URL}',
    googleDriveKnowledgeFolderId: '1TtHiEjxrG20SCaAK4G-EuzRJY7TcKQA2',
};
