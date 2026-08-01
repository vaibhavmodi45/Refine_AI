import { useState } from "react";
import type { ResumeData, TemplateId } from "@/lib/resume-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";

type Setter = (patch: (d: ResumeData) => ResumeData) => void;

function IconBtn({
  onClick,
  label,
  danger,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={danger ? "ghost" : "outline"}
      onClick={onClick}
      className={danger ? "text-destructive" : ""}
    >
      {danger ? <Trash2 className="h-4 w-4" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
      {!danger && label}
    </Button>
  );
}

function BulletsEditor({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (b: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-2">
          <Textarea
            value={b}
            onChange={(e) => onChange(bullets.map((x, j) => (j === i ? e.target.value : x)))}
            rows={2}
          />
          <IconBtn danger label="" onClick={() => onChange(bullets.filter((_, j) => j !== i))} />
        </div>
      ))}
      <IconBtn label="Add bullet" onClick={() => onChange([...bullets, ""])} />
    </div>
  );
}

export function ResumeEditor({
  data,
  setData,
  template,
  onTemplateChange,
}: {
  data: ResumeData;
  setData: Setter;
  template: TemplateId;
  onTemplateChange: (t: TemplateId) => void;
}) {
  const [open, setOpen] = useState<string>("personal");
  void template;
  void onTemplateChange;

  return (
    <Card className="p-4">
      <Accordion
        type="single"
        collapsible
        value={open}
        onValueChange={(v) => setOpen(v || "personal")}
      >
        <AccordionItem value="personal">
          <AccordionTrigger>Personal info</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Full name</Label>
                <Input
                  value={data.personalInfo.fullName}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      personalInfo: { ...d.personalInfo, fullName: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={data.personalInfo.email}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      personalInfo: { ...d.personalInfo, email: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={data.personalInfo.phone ?? ""}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      personalInfo: { ...d.personalInfo, phone: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={data.personalInfo.location ?? ""}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      personalInfo: { ...d.personalInfo, location: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Links</Label>
              <div className="mt-2 space-y-2">
                {(data.personalInfo.links ?? []).map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Label (LinkedIn)"
                      value={l.label}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          personalInfo: {
                            ...d.personalInfo,
                            links: (d.personalInfo.links ?? []).map((x, j) =>
                              j === i ? { ...x, label: e.target.value } : x,
                            ),
                          },
                        }))
                      }
                    />
                    <Input
                      placeholder="URL"
                      value={l.url}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          personalInfo: {
                            ...d.personalInfo,
                            links: (d.personalInfo.links ?? []).map((x, j) =>
                              j === i ? { ...x, url: e.target.value } : x,
                            ),
                          },
                        }))
                      }
                    />
                    <IconBtn
                      danger
                      label=""
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          personalInfo: {
                            ...d.personalInfo,
                            links: (d.personalInfo.links ?? []).filter((_, j) => j !== i),
                          },
                        }))
                      }
                    />
                  </div>
                ))}
                <IconBtn
                  label="Add link"
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      personalInfo: {
                        ...d.personalInfo,
                        links: [...(d.personalInfo.links ?? []), { label: "", url: "" }],
                      },
                    }))
                  }
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="summary">
          <AccordionTrigger>Summary</AccordionTrigger>
          <AccordionContent>
            <Textarea
              rows={4}
              value={data.summary ?? ""}
              onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="experience">
          <AccordionTrigger>Experience</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {data.experience.map((e, i) => (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Role"
                    value={e.role}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        experience: d.experience.map((x, j) =>
                          j === i ? { ...x, role: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="Company"
                    value={e.company}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        experience: d.experience.map((x, j) =>
                          j === i ? { ...x, company: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="Location"
                    value={e.location ?? ""}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        experience: d.experience.map((x, j) =>
                          j === i ? { ...x, location: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Start"
                      value={e.startDate}
                      onChange={(ev) =>
                        setData((d) => ({
                          ...d,
                          experience: d.experience.map((x, j) =>
                            j === i ? { ...x, startDate: ev.target.value } : x,
                          ),
                        }))
                      }
                    />
                    <Input
                      placeholder="End / Present"
                      value={e.endDate ?? ""}
                      onChange={(ev) =>
                        setData((d) => ({
                          ...d,
                          experience: d.experience.map((x, j) =>
                            j === i ? { ...x, endDate: ev.target.value } : x,
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
                <BulletsEditor
                  bullets={e.bullets}
                  onChange={(b) =>
                    setData((d) => ({
                      ...d,
                      experience: d.experience.map((x, j) => (j === i ? { ...x, bullets: b } : x)),
                    }))
                  }
                />
                <IconBtn
                  danger
                  label=""
                  onClick={() =>
                    setData((d) => ({ ...d, experience: d.experience.filter((_, j) => j !== i) }))
                  }
                />
              </div>
            ))}
            <IconBtn
              label="Add experience"
              onClick={() =>
                setData((d) => ({
                  ...d,
                  experience: [
                    ...d.experience,
                    {
                      role: "",
                      company: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      bullets: [],
                    },
                  ],
                }))
              }
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="education">
          <AccordionTrigger>Education</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {data.education.map((e, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-md border p-3">
                <Input
                  placeholder="Institution"
                  value={e.institution}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      education: d.education.map((x, j) =>
                        j === i ? { ...x, institution: ev.target.value } : x,
                      ),
                    }))
                  }
                />
                <Input
                  placeholder="Degree"
                  value={e.degree}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      education: d.education.map((x, j) =>
                        j === i ? { ...x, degree: ev.target.value } : x,
                      ),
                    }))
                  }
                />
                <Input
                  placeholder="Field"
                  value={e.field ?? ""}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      education: d.education.map((x, j) =>
                        j === i ? { ...x, field: ev.target.value } : x,
                      ),
                    }))
                  }
                />
                <Input
                  placeholder="GPA"
                  value={e.gpa ?? ""}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      education: d.education.map((x, j) =>
                        j === i ? { ...x, gpa: ev.target.value } : x,
                      ),
                    }))
                  }
                />
                <Input
                  placeholder="Start"
                  value={e.startDate ?? ""}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      education: d.education.map((x, j) =>
                        j === i ? { ...x, startDate: ev.target.value } : x,
                      ),
                    }))
                  }
                />
                <Input
                  placeholder="End"
                  value={e.endDate ?? ""}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      education: d.education.map((x, j) =>
                        j === i ? { ...x, endDate: ev.target.value } : x,
                      ),
                    }))
                  }
                />
                <div className="col-span-2">
                  <IconBtn
                    danger
                    label=""
                    onClick={() =>
                      setData((d) => ({ ...d, education: d.education.filter((_, j) => j !== i) }))
                    }
                  />
                </div>
              </div>
            ))}
            <IconBtn
              label="Add education"
              onClick={() =>
                setData((d) => ({
                  ...d,
                  education: [
                    ...d.education,
                    { institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "" },
                  ],
                }))
              }
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="projects">
          <AccordionTrigger>Projects</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {data.projects.map((p, i) => (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Name"
                    value={p.name}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        projects: d.projects.map((x, j) =>
                          j === i ? { ...x, name: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="Link"
                    value={p.link ?? ""}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        projects: d.projects.map((x, j) =>
                          j === i ? { ...x, link: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                </div>
                <Input
                  placeholder="Tech stack (comma-separated)"
                  value={(p.techStack ?? []).join(", ")}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      projects: d.projects.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              techStack: ev.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            }
                          : x,
                      ),
                    }))
                  }
                />
                <Textarea
                  placeholder="Description"
                  value={p.description ?? ""}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      projects: d.projects.map((x, j) =>
                        j === i ? { ...x, description: ev.target.value } : x,
                      ),
                    }))
                  }
                />
                <BulletsEditor
                  bullets={p.bullets}
                  onChange={(b) =>
                    setData((d) => ({
                      ...d,
                      projects: d.projects.map((x, j) => (j === i ? { ...x, bullets: b } : x)),
                    }))
                  }
                />
                <IconBtn
                  danger
                  label=""
                  onClick={() =>
                    setData((d) => ({ ...d, projects: d.projects.filter((_, j) => j !== i) }))
                  }
                />
              </div>
            ))}
            <IconBtn
              label="Add project"
              onClick={() =>
                setData((d) => ({
                  ...d,
                  projects: [
                    ...d.projects,
                    { name: "", description: "", techStack: [], bullets: [], link: "" },
                  ],
                }))
              }
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="skills">
          <AccordionTrigger>Skills</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {data.skills.map((s, i) => (
              <div key={i} className="grid grid-cols-[180px_1fr_auto] gap-2 rounded-md border p-3">
                <Input
                  placeholder="Category"
                  value={s.category}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      skills: d.skills.map((x, j) =>
                        j === i ? { ...x, category: ev.target.value } : x,
                      ),
                    }))
                  }
                />
                <Input
                  placeholder="Items (comma-separated)"
                  value={s.items.join(", ")}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      skills: d.skills.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              items: ev.target.value
                                .split(",")
                                .map((v) => v.trim())
                                .filter(Boolean),
                            }
                          : x,
                      ),
                    }))
                  }
                />
                <IconBtn
                  danger
                  label=""
                  onClick={() =>
                    setData((d) => ({ ...d, skills: d.skills.filter((_, j) => j !== i) }))
                  }
                />
              </div>
            ))}
            <IconBtn
              label="Add skill group"
              onClick={() =>
                setData((d) => ({ ...d, skills: [...d.skills, { category: "", items: [] }] }))
              }
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="certs">
          <AccordionTrigger>Certifications</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {(data.certifications ?? []).map((c, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 rounded-md border p-3">
                <Input
                  placeholder="Name"
                  value={c.name}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      certifications: (d.certifications ?? []).map((x, j) =>
                        j === i ? { ...x, name: ev.target.value } : x,
                      ),
                    }))
                  }
                />
                <Input
                  placeholder="Issuer"
                  value={c.issuer ?? ""}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      certifications: (d.certifications ?? []).map((x, j) =>
                        j === i ? { ...x, issuer: ev.target.value } : x,
                      ),
                    }))
                  }
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Date"
                    value={c.date ?? ""}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        certifications: (d.certifications ?? []).map((x, j) =>
                          j === i ? { ...x, date: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                  <IconBtn
                    danger
                    label=""
                    onClick={() =>
                      setData((d) => ({
                        ...d,
                        certifications: (d.certifications ?? []).filter((_, j) => j !== i),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
            <IconBtn
              label="Add certification"
              onClick={() =>
                setData((d) => ({
                  ...d,
                  certifications: [...(d.certifications ?? []), { name: "", issuer: "", date: "" }],
                }))
              }
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="achievements">
          <AccordionTrigger>Achievements</AccordionTrigger>
          <AccordionContent>
            <BulletsEditor
              bullets={data.achievements ?? []}
              onChange={(b) => setData((d) => ({ ...d, achievements: b }))}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="languages">
          <AccordionTrigger>Languages</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {(data.languages ?? []).map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-md border p-3">
                <Input
                  placeholder="Language"
                  value={l.name}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      languages: (d.languages ?? []).map((x, j) =>
                        j === i ? { ...x, name: ev.target.value } : x,
                      ),
                    }))
                  }
                />
                <Input
                  placeholder="Proficiency"
                  value={l.proficiency ?? ""}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      languages: (d.languages ?? []).map((x, j) =>
                        j === i ? { ...x, proficiency: ev.target.value } : x,
                      ),
                    }))
                  }
                />
                <IconBtn
                  danger
                  label=""
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      languages: (d.languages ?? []).filter((_, j) => j !== i),
                    }))
                  }
                />
              </div>
            ))}
            <IconBtn
              label="Add language"
              onClick={() =>
                setData((d) => ({
                  ...d,
                  languages: [...(d.languages ?? []), { name: "", proficiency: "" }],
                }))
              }
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
