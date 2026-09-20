# Bespoke AI website

Public marketing site for Bespoke AI, plus a gated Demo Hub used when walking customers through working systems.

## Language

**Software development**:
The primary public offer — designing, implementing, and testing a working system for a defined problem. New systems (apps, APIs, integrations) and governed workflow automation both count. Staff augmentation does not.
_Avoid_: AI training, workshops (as current public offers); contractor / embedded-team capacity; treating this as background only (“27+ years”) rather than the thing you buy

**Build**:
A software development engagement that ships a working system. Governed workflow automation is a typical kind of Build, not a separate headline offer.
_Avoid_: AI project (when you mean a Build); training cohort

**How We Work**:
The public engagement path: discovery, then design, implementation, and test, then handover. No public scoping fee — feasibility before the quote is part of discovery and design. Optional support is quoted case by case. For an automation Build, design includes mapping and improving the workflow.
_Avoid_: a second public process called “map then automate”; staff augmentation; a public €250/mo support floor; a public paid-scoping offer

**Pay-when-satisfied**:
The public Build payment rule: no Build invoice until the client is 100% satisfied with the solution. Discovery and the look before the quote are free. Builds are priced per job. Not a euro ROI or CSAT-lift promise. The bad-faith fence is not a public page; it lives on the build quote.
_Avoid_: “100% guarantee” as visitor-facing words; a public terms paragraph for this rule; narrating the fence on the site or in Ask BCAI; deposit or progress invoices on a Build; a published Build or scoping price; applying this to workshops or support

**Solution**:
Visitor-facing word for the delivered Build the client must be satisfied with.
_Avoid_: using “solution” to mean discovery, scoping, workshops, or support

**Support**:
Optional help after go-live, quoted case by case.
_Avoid_: publishing a €250/mo floor

**Architecture**:
How Design is done on a Build — system shape and fit with what the client already runs, from years of hands-on architect work. Not a separate thing you buy.
_Avoid_: architecture consulting (as a public offer); diagrams-and-hand-off; treating this as background-only

**Client result**:
A public, anonymized write-up of a shipped system (screenshots, production language). Lives on the marketing site.
_Avoid_: Demo (on public pages), case study (as the nav label)

**Demo Hub**:
A gated area of the same site, not in public nav, used during live customer walkthroughs. Same design system as the marketing site. After the access code, the main show is **architecture pages** for sellable Demos at `/demos/`. **Voice AI bots** are a hub card (Open Solution → `/demos/voice.html`, call-sheet), same session, not a footer link. Entry is a daft-property-style **access code** (one code for the whole hub) at `/demos/`, plus `noindex`. Live agent secrets stay in gitignored config. This map’s destination is a spec for it, not the HTML.
_Avoid_: Admin, CMS, back office

**Demo**:
An entry in the Demo Hub: a commercially sellable working system Karl can walk a customer through. Internal ops tools are not Demos.
_Avoid_: Internal tool, experiment, personal utility

**Inclusion catalog**:
Repo markdown Karl maintains: which `/Users/karl/src` folders qualify as Demos. It decides which hub cards exist. Customer pages never show folder paths, local run commands, or credentials.
_Avoid_: Sitemap, admin list, customer-facing inventory

**Voice bot**:
A Retell agent launched in the browser (web call / preview), not a phone handset. Listed on the hub with a name, a short description, and a launch control.
_Avoid_: Phone demo (when you mean the in-browser agent)

**Support Call**:
The Azure-backed ACME support Voice bot (`/Users/karl/src/azure/voice-agent`). One Demo with two launchers: the Azure Demo Call page and the Retell web call. Not a second bot beside “IT Support”.
_Avoid_: ACME IT Support Triage Bot (as a separate hub row)
