import type { ResumeData, TemplateId } from "@/lib/resume-schema";

interface Props {
  data: ResumeData;
  template: TemplateId;
}

function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return "";
  if (!end) return start ?? "";
  return `${start ?? ""} – ${end}`;
}

function SectionTitle({ children, template }: { children: React.ReactNode; template: TemplateId }) {
  if (template === "classic") {
    return (
      <h2
        style={{
          fontSize: "11pt",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 700,
          borderBottom: "1px solid #111",
          paddingBottom: 2,
          marginTop: 14,
          marginBottom: 6,
        }}
      >
        {children}
      </h2>
    );
  }
  if (template === "modern") {
    return (
      <h2
        style={{
          fontSize: "10.5pt",
          fontWeight: 700,
          color: "#1f3a8a",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginTop: 14,
          marginBottom: 6,
        }}
      >
        {children}
      </h2>
    );
  }
  return (
    <h2
      style={{
        fontSize: "11pt",
        fontWeight: 700,
        marginTop: 14,
        marginBottom: 4,
        borderBottom: "2px solid #1f3a8a",
        paddingBottom: 2,
        display: "inline-block",
      }}
    >
      {children}
    </h2>
  );
}

function Header({ data, template }: Props) {
  const { personalInfo } = data;
  const contactBits = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    ...(personalInfo.links ?? []).map((l) => `${l.label}: ${l.url}`),
  ].filter(Boolean);

  if (template === "classic") {
    return (
      <header style={{ textAlign: "center", marginBottom: 8 }}>
        <h1 style={{ fontSize: "20pt", fontWeight: 700, letterSpacing: "0.05em" }}>
          {personalInfo.fullName || "Your Name"}
        </h1>
        <div style={{ fontSize: "9.5pt", marginTop: 4, color: "#333" }}>
          {contactBits.join("  •  ")}
        </div>
      </header>
    );
  }
  if (template === "modern") {
    return (
      <header style={{ marginBottom: 6 }}>
        <h1 style={{ fontSize: "22pt", fontWeight: 700, color: "#0b0b0b" }}>
          {personalInfo.fullName || "Your Name"}
        </h1>
        <div style={{ fontSize: "9.5pt", marginTop: 2, color: "#444" }}>
          {contactBits.join("  |  ")}
        </div>
      </header>
    );
  }
  return (
    <header style={{ marginBottom: 6 }}>
      <h1 style={{ fontSize: "20pt", fontWeight: 700 }}>{personalInfo.fullName || "Your Name"}</h1>
      <div style={{ fontSize: "9.5pt", color: "#333" }}>{contactBits.join(" • ")}</div>
    </header>
  );
}

function ExperienceSection({ data, template }: Props) {
  if (!data.experience.length) return null;
  return (
    <section>
      <SectionTitle template={template}>Experience</SectionTitle>
      {data.experience.map((e, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
          >
            <div>
              <span style={{ fontWeight: 700 }}>{e.role}</span>
              <span> — {e.company}</span>
              {e.location ? <span style={{ color: "#555" }}> · {e.location}</span> : null}
            </div>
            <div style={{ fontSize: "9.5pt", color: "#555" }}>
              {formatDateRange(e.startDate, e.endDate || "Present")}
            </div>
          </div>
          {e.bullets.length ? (
            <ul>
              {e.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </section>
  );
}

function EducationSection({ data, template }: Props) {
  if (!data.education.length) return null;
  return (
    <section>
      <SectionTitle template={template}>Education</SectionTitle>
      {data.education.map((e, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontWeight: 700 }}>{e.institution}</span>
              <span>
                {" "}
                — {e.degree}
                {e.field ? `, ${e.field}` : ""}
              </span>
              {e.gpa ? <span style={{ color: "#555" }}> · GPA {e.gpa}</span> : null}
            </div>
            <div style={{ fontSize: "9.5pt", color: "#555" }}>
              {formatDateRange(e.startDate, e.endDate)}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function ProjectsSection({ data, template }: Props) {
  if (!data.projects.length) return null;
  return (
    <section>
      <SectionTitle template={template}>Projects</SectionTitle>
      {data.projects.map((p, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div>
            <span style={{ fontWeight: 700 }}>{p.name}</span>
            {p.link ? <span style={{ color: "#555" }}> · {p.link}</span> : null}
            {p.techStack?.length ? (
              <span style={{ color: "#555" }}> · {p.techStack.join(", ")}</span>
            ) : null}
          </div>
          {p.description ? <div>{p.description}</div> : null}
          {p.bullets.length ? (
            <ul>
              {p.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </section>
  );
}

function SkillsSection({ data, template }: Props) {
  if (!data.skills.length) return null;
  return (
    <section>
      <SectionTitle template={template}>Skills</SectionTitle>
      {data.skills.map((s, i) => (
        <div key={i}>
          <span style={{ fontWeight: 700 }}>{s.category}:</span> {s.items.join(", ")}
        </div>
      ))}
    </section>
  );
}

function CertsSection({ data, template }: Props) {
  if (!data.certifications?.length) return null;
  return (
    <section>
      <SectionTitle template={template}>Certifications</SectionTitle>
      {data.certifications.map((c, i) => (
        <div key={i}>
          <span style={{ fontWeight: 700 }}>{c.name}</span>
          {c.issuer ? <span> — {c.issuer}</span> : null}
          {c.date ? <span style={{ color: "#555" }}> · {c.date}</span> : null}
        </div>
      ))}
    </section>
  );
}

function AchievementsSection({ data, template }: Props) {
  if (!data.achievements?.length) return null;
  return (
    <section>
      <SectionTitle template={template}>Achievements</SectionTitle>
      <ul>
        {data.achievements.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
    </section>
  );
}

function LanguagesSection({ data, template }: Props) {
  if (!data.languages?.length) return null;
  return (
    <section>
      <SectionTitle template={template}>Languages</SectionTitle>
      <div>
        {data.languages
          .map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name))
          .join(", ")}
      </div>
    </section>
  );
}

function SummarySection({ data, template }: Props) {
  if (!data.summary?.trim()) return null;
  return (
    <section>
      <SectionTitle template={template}>Summary</SectionTitle>
      <p>{data.summary}</p>
    </section>
  );
}

export function TemplateRenderer({ data, template }: Props) {
  const order: Array<(props: Props) => React.ReactNode> =
    template === "fresher"
      ? [
          SummarySection,
          EducationSection,
          ProjectsSection,
          ExperienceSection,
          SkillsSection,
          CertsSection,
          AchievementsSection,
          LanguagesSection,
        ]
      : [
          SummarySection,
          ExperienceSection,
          ProjectsSection,
          EducationSection,
          SkillsSection,
          CertsSection,
          AchievementsSection,
          LanguagesSection,
        ];

  return (
    <div className={`resume-page template-${template}`}>
      <Header data={data} template={template} />
      {order.map((Section, i) => (
        <Section key={i} data={data} template={template} />
      ))}
    </div>
  );
}
