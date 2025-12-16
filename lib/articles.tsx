export interface Article {
  title: string;
  slug: string;
  readTime: string;
  excerpt: string;
  content: () => JSX.Element;
}

export const articles: Article[] = [
  {
    title: "How to Tailor Your CV for Each Job — Without Rewriting It Every Time",
    slug: "tailor-your-cv-without-rewriting",
    readTime: "6 min read",
    excerpt: "A practical system to customize your CV for each role in minutes—without creating a new version every time.",
    content: () => (
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 leading-relaxed">
          Tailoring your CV works. Recruiters notice it. ATS systems reward it. And it increases interview rates.
        </p>
        <p>
          But rewriting your CV from scratch for every job is a fast way to burn out.
        </p>
        <p>
          The goal is not to create a brand-new CV each time. The goal is to <strong>adapt your existing CV so the most relevant parts become obvious</strong>—quickly.
        </p>
        <p>
          Here's a simple system that keeps your CV consistent while making every application feel specific.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1) Start with a strong "core CV"</h2>
        <p>
          Your core CV is your single source of truth. It contains everything:
        </p>
        <ul>
          <li>Full work history (with results and impact)</li>
          <li>All key skills and tools</li>
          <li>Projects, achievements, certifications</li>
          <li>Education and relevant extras</li>
        </ul>
        <p>
          Think of it like a "master document." You don't send it as-is every time—but you always start from it.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2) Tailor the top third first (that's what gets read)</h2>
        <p>
          Most CV scanning happens in seconds. The top of your CV should answer:
        </p>
        <ul>
          <li>What role are you?</li>
          <li>What level are you?</li>
          <li>What are your strongest matching skills?</li>
        </ul>
        <p>Update these sections per job:</p>
        <ul>
          <li><strong>Title / headline</strong> (align with job title where honest)</li>
          <li><strong>Summary</strong> (2–4 lines that mirror the role)</li>
          <li><strong>Key skills</strong> (put the most relevant first)</li>
        </ul>
        <p>This gives a recruiter instant confidence: "This fits."</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3) Match job keywords—without keyword stuffing</h2>
        <p>
          Keyword alignment matters, especially if an ATS is involved.
        </p>
        <p>Do this:</p>
        <ul>
          <li>Copy 6–10 important phrases from the job post (skills, tools, domain language)</li>
          <li>If they're true for you, reflect them in your CV naturally</li>
          <li>Swap synonyms to match the employer's language</li>
        </ul>
        <p>Example:</p>
        <ul>
          <li>Job: "Stakeholder management"</li>
          <li>CV: "Worked with stakeholders across product and engineering"</li>
        </ul>
        <p>You're not gaming the system—you're speaking the same language.</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4) Reorder bullets so relevant impact appears first</h2>
        <p>
          You don't need new experience—you need better emphasis.
        </p>
        <p>For each role, reorder bullets so the most relevant items are on top:</p>
        <ul>
          <li>If the job is React-heavy, put React impact first</li>
          <li>If the job emphasizes leadership, put mentoring/ownership first</li>
          <li>If the job is data-focused, lead with metrics and outcomes</li>
        </ul>
        <p>Same truth, better signal.</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5) Create a small "plug-in" section for role-specific proof</h2>
        <p>
          Add one lightweight section you can swap in and out:
        </p>
        <ul>
          <li>"Selected Projects"</li>
          <li>"Relevant Highlights"</li>
          <li>"Case Studies"</li>
          <li>"Most Relevant Achievements"</li>
        </ul>
        <p>Keep it short (3–5 bullets). Make it specific.</p>
        <p>This is where your CV becomes memorable.</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6) Use a quick checklist before you send</h2>
        <p>Before submitting, check:</p>
        <ul>
          <li>Does my headline match the role?</li>
          <li>Are the top skills the ones the job asks for?</li>
          <li>Do I show proof (metrics/results), not just tasks?</li>
          <li>Is location/remote preference clear?</li>
          <li>Does it read clearly in 10 seconds?</li>
        </ul>
        <p>If yes—send.</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">The takeaway</h2>
        <p>
          Tailoring isn't about rewriting. It's about <strong>re-ranking what you already have</strong> so the match is obvious.
        </p>
        <p>
          If you can do that consistently, you'll look like the perfect candidate more often—because you'll be easier to understand.
        </p>
      </div>
    )
  },
  {
    title: "What Recruiters Actually Look for in a CV (And What They Ignore)",
    slug: "what-recruiters-look-for",
    readTime: "7 min read",
    excerpt: "Recruiters scan for signals—clarity, fit, impact. Here's what matters most and what barely moves the needle.",
    content: () => (
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 leading-relaxed">
          A CV isn't evaluated the way people think it is.
        </p>
        <p>
          Most recruiters don't "read" your CV. They <strong>scan</strong> it—fast—looking for signals that answer:
        </p>
        <ul>
          <li>Is this person a fit for the role?</li>
          <li>Is the level right?</li>
          <li>Can I justify shortlisting them?</li>
        </ul>
        <p>
          If your CV doesn't provide clear signals quickly, you can be rejected even with strong experience.
        </p>
        <p>
          Here's what recruiters typically look for, and what they usually ignore.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What recruiters look for</h2>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1) Clear role identity</h3>
        <p>
          Within seconds, a recruiter wants to know what you are:
        </p>
        <ul>
          <li>"Frontend Engineer"</li>
          <li>"Customer Success Manager"</li>
          <li>"Product Designer"</li>
          <li>"Data Analyst"</li>
        </ul>
        <p>
          If your CV feels like "a little of everything," it's harder to place you.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2) Level and scope</h3>
        <p>
          Recruiters scan for seniority signals:
        </p>
        <ul>
          <li>Ownership and decision-making</li>
          <li>Leading projects or initiatives</li>
          <li>Mentoring or influencing others</li>
          <li>Complexity of work (scale, stakeholders, systems)</li>
        </ul>
        <p>
          Even if the job doesn't say "senior," the recruiter will still try to place your level.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3) Relevant skills (the job's language)</h3>
        <p>
          Skills matter, but especially the ones in the job post.
          Recruiters look for:
        </p>
        <ul>
          <li>Tools (e.g. React, Figma, Salesforce)</li>
          <li>Methods (e.g. user research, CI/CD, stakeholder management)</li>
          <li>Domain context (e.g. fintech, B2B SaaS, healthcare)</li>
        </ul>
        <p>
          If your CV uses different wording, your fit can be missed.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4) Proof of impact</h3>
        <p>
          The best CVs show outcomes:
        </p>
        <ul>
          <li>"Reduced churn by 12%"</li>
          <li>"Improved page load time by 35%"</li>
          <li>"Managed 30+ enterprise accounts"</li>
          <li>"Shipped X feature used by Y users"</li>
        </ul>
        <p>
          Impact makes your experience believable and valuable.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5) A story that makes sense</h3>
        <p>
          Recruiters don't mind job changes. They mind confusion.
        </p>
        <p>
          A good CV makes transitions understandable:
        </p>
        <ul>
          <li>Promotions</li>
          <li>Changes in industry</li>
          <li>Shifts in responsibility</li>
          <li>Short tenures (explained briefly if needed)</li>
        </ul>
        <p>
          Clarity creates trust.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What recruiters ignore (more than you think)</h2>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1) Fancy design</h3>
        <p>
          A clean layout helps. But fancy design rarely wins you interviews.
          In many cases, it hurts ATS parsing.
        </p>
        <p>
          Simple, readable, consistent = best.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2) A long list of every tool you've touched</h3>
        <p>
          A "skills dump" is easy to ignore.
          A focused list that matches the role is more powerful.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3) Personal clichés</h3>
        <p>
          Phrases like:
        </p>
        <ul>
          <li>"Hard-working"</li>
          <li>"Team player"</li>
          <li>"Results-driven"</li>
        </ul>
        <p>
          These don't differentiate you. Use evidence instead.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4) Everything you did in every job</h3>
        <p>
          Recruiters don't need your full history in detail.
          They need the parts that prove you fit this role.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">The takeaway</h2>
        <p>
          A great CV is a fast argument:
        </p>
        <ul>
          <li>"This is my role."</li>
          <li>"This is my level."</li>
          <li>"Here's proof."</li>
          <li>"Here's why it matches your job."</li>
        </ul>
        <p>
          If your CV does that in 10 seconds, you'll get more interviews.
        </p>
      </div>
    )
  },
  {
    title: "Why You're Qualified — But Still Not Getting Interviews",
    slug: "qualified-but-no-interviews",
    readTime: "6 min read",
    excerpt: "If you're not getting interviews, it's often not your experience—it's clarity, alignment, and signal strength.",
    content: () => (
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 leading-relaxed">
          You've applied for jobs you're clearly qualified for.
          You meet the requirements.
          Sometimes you even exceed them.
        </p>
        <p>
          And yet — no interviews.
        </p>
        <p>
          This is one of the most common (and frustrating) experiences in a job search. The good news? In most cases, it's <strong>not</strong> because you're unqualified. It's because of how your profile is <em>presented and interpreted</em>.
        </p>
        <p>
          Here are the most common reasons this happens — and how to fix them.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1) Your CV doesn't clearly match the role you're applying for</h2>
        <p>
          Recruiters don't read CVs line by line. They scan.
        </p>
        <p>
          If it's not immediately obvious <em>how</em> you fit the role, they move on — even if the experience is there.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Common issues</h3>
        <ul>
          <li>Your title doesn't align with the job title</li>
          <li>Relevant experience is buried too far down</li>
          <li>Too many unrelated skills dilute the message</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How to fix it</h3>
        <ul>
          <li>Make your current or target role obvious at the top</li>
          <li>Prioritise experience that matches the job</li>
          <li>De-emphasise irrelevant roles or tasks</li>
        </ul>
        <p>
          Clarity beats completeness.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2) Your CV speaks in responsibilities, not outcomes</h2>
        <p>
          Many CVs list what someone <em>did</em>, but not what they <em>achieved</em>.
        </p>
        <p>
          Recruiters are looking for signals:
        </p>
        <ul>
          <li>Impact</li>
          <li>Ownership</li>
          <li>Results</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Instead of</h3>
        <p>
          "Worked on frontend development"
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Try</h3>
        <p>
          "Built and maintained React components used by 50k+ users"
        </p>
        <p>
          Small changes like this dramatically increase perceived seniority and relevance.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3) Your skills don't align with how jobs describe them</h2>
        <p>
          You might have the right skills — just not described in the right language.
        </p>
        <p>
          This matters because:
        </p>
        <ul>
          <li>Recruiters search for keywords</li>
          <li>ATS systems filter based on phrasing</li>
          <li>Job descriptions and CVs often speak different "dialects"</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Example</h3>
        <ul>
          <li>Job ad: "Modern frontend framework experience"</li>
          <li>Your CV: "Built UIs in JavaScript"</li>
        </ul>
        <p>
          Same thing. Different signal.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4) Seniority mismatch sends mixed signals</h2>
        <p>
          Being overqualified can be as problematic as being underqualified.
        </p>
        <p>
          Red flags recruiters might see:
        </p>
        <ul>
          <li>Very senior experience for a mid-level role</li>
          <li>Titles that don't match responsibilities</li>
          <li>Too broad a career narrative</li>
        </ul>
        <p>
          This creates uncertainty:
          "Will this person be bored?"
          "Are they too expensive?"
          "Why are they applying here?"
        </p>
        <p>
          Your CV should clearly communicate <strong>the level you're aiming for</strong>, not just everything you've ever done.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5) Location and preferences aren't clear</h2>
        <p>
          Many strong candidates get filtered out simply due to:
        </p>
        <ul>
          <li>Location assumptions</li>
          <li>Remote vs on-site uncertainty</li>
          <li>Relocation ambiguity</li>
        </ul>
        <p>
          If you're open to multiple locations or remote work, say it clearly. Ambiguity often leads to rejection.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">The takeaway</h2>
        <p>
          If you're not getting interviews, it's rarely about ability.
        </p>
        <p>
          It's about:
        </p>
        <ul>
          <li>Alignment</li>
          <li>Clarity</li>
          <li>Signal strength</li>
        </ul>
        <p>
          Your experience may be strong — but if it's not presented in a way that clearly matches the role, it won't convert into interviews.
        </p>
      </div>
    )
  },
  {
    title: "Skills That Matter Most in 2025 (And How to Show Them on Your CV)",
    slug: "skills-that-matter-2025",
    readTime: "8 min read",
    excerpt: "The best skills aren't just buzzwords. Here's how to pick the right ones and prove them with evidence on your CV.",
    content: () => (
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 leading-relaxed">
          Hiring in 2025 rewards people who can do two things:
        </p>
        <ol>
          <li>Solve real problems</li>
          <li>Communicate that clearly</li>
        </ol>
        <p>
          That's why the most valuable skills are often a mix of:
        </p>
        <ul>
          <li>Technical capability (how you build)</li>
          <li>Business thinking (why you build)</li>
          <li>Collaboration (how you deliver)</li>
        </ul>
        <p>
          Here's a practical guide to the skills that matter—and how to show them on your CV in a way recruiters trust.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1) Role-specific core skills (depth beats breadth)</h2>
        <p>
          For most roles, employers want depth in the core:
        </p>
        <ul>
          <li>Engineers: modern frameworks, testing, performance, architecture basics</li>
          <li>Designers: systems thinking, user research, prototyping, accessibility</li>
          <li>CS/Sales: pipeline ownership, discovery, objection handling, retention</li>
        </ul>
        <p>
          A short list of strong, relevant skills is more effective than a long list of everything.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How to show it</h3>
        <ul>
          <li>Put the most relevant 6–10 skills near the top</li>
          <li>Tie them to evidence in experience bullets</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2) Problem-solving with measurable outcomes</h2>
        <p>
          Outcomes make skills real.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Examples</h3>
        <ul>
          <li>"Reduced support tickets by 18% by improving onboarding"</li>
          <li>"Increased conversion by 9% with A/B-tested landing page changes"</li>
          <li>"Automated reporting to save 6 hours/week"</li>
        </ul>
        <p>
          Even small metrics help.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3) Communication and stakeholder alignment</h2>
        <p>
          Cross-functional work is the default in 2025.
        </p>
        <p>
          Employers value:
        </p>
        <ul>
          <li>clear written updates</li>
          <li>decision-making transparency</li>
          <li>aligning product, engineering, design, and business</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How to show it</h3>
        <ul>
          <li>Mention stakeholders, not just tasks</li>
          <li>Show ownership of decisions and trade-offs</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4) AI fluency (as a productivity skill)</h2>
        <p>
          AI isn't "one skill." It's the ability to use tools responsibly to:
        </p>
        <ul>
          <li>speed up work</li>
          <li>improve quality</li>
          <li>automate repetitive tasks</li>
          <li>communicate faster</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How to show it</h3>
        <p>
          Instead of "Used AI," say what it changed:
        </p>
        <ul>
          <li>"Used AI tooling to draft test cases and cut QA cycles by 20%"</li>
          <li>"Created prompt templates to standardize customer responses"</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5) Adaptability and learning velocity</h2>
        <p>
          Tools change. Good fundamentals don't.
        </p>
        <p>
          Hiring managers look for:
        </p>
        <ul>
          <li>curiosity</li>
          <li>structured learning</li>
          <li>fast iteration</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How to show it</h3>
        <ul>
          <li>Certifications only if relevant</li>
          <li>Personal projects with outcomes</li>
          <li>Upward progression in responsibilities</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">The takeaway</h2>
        <p>
          In 2025, skills matter most when they're:
        </p>
        <ul>
          <li>relevant to the role</li>
          <li>expressed in the employer's language</li>
          <li>supported by evidence</li>
        </ul>
        <p>
          Make your skills credible, not just listed.
        </p>
      </div>
    )
  }
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find(article => article.slug === slug);
}
