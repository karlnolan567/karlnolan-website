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

**Sign-off**:
The public Build payment rule: the final invoice comes after the client signs off the system against test cases agreed up front, at the start of the Build. Visitor-facing words: "You sign off against test cases agreed up front, before the final invoice." Discovery and the look before the quote are free. Builds are priced per job, with a fixed price agreed before any work starts. Not a euro ROI or CSAT-lift promise. Replaced the earlier pay-when-satisfied wording on 18 Oct 2026, because that wording invited open-ended unpaid work.
_Avoid_: "you don't pay until you're satisfied" or any satisfaction-based payment wording; "guarantee"; a published Build, pilot, or scoping price; applying this to workshops or support

**Pilot**:
The visitor-facing name for a first fixed-scope Build that automates one workflow (for example orders, invoices, or delivery dockets) with a person approving every step. Scope, duration, and a fixed price are agreed in writing before work starts.
_Avoid_: publishing a euro price for it; open-ended "phase 1" with no test cases

**Solution**:
Visitor-facing word for the delivered Build the client signs off.
_Avoid_: using “solution” to mean discovery, scoping, workshops, or support

**Support**:
Optional help after go-live, quoted case by case.
_Avoid_: publishing a €250/mo floor

**Architecture**:
How Design is done on a Build — system shape and fit with what the client already runs, from years of hands-on architect work. Not a separate thing you buy.
_Avoid_: architecture consulting (as a public offer); diagrams-and-hand-off; treating this as background-only

**Example build**:
A public, anonymized write-up of a working system Karl has built (screenshots, production language). Lives on the marketing site at `case-studies.html`; the home page features three that fit the target buyer. Replaced "Client result" on 18 Oct 2026 so unnamed systems are not presented as client results.
_Avoid_: Client result (on public pages), Demo (on public pages), case study (as the nav label)

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
