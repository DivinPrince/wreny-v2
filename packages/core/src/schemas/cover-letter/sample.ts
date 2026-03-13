import type { CoverLetterData } from "./index";

export const sampleCoverLetter: CoverLetterData = {
  sender: {
    name: "John Doe",
    email: "john.doe@gmail.com",
    phone: "(555) 123-4567",
    location: "Pleasantville, CA",
    title: "Senior Frontend Engineer",
    url: {
      label: "Portfolio",
      href: "https://johndoe.me/",
    },
  },
  recipient: {
    name: "Hiring Manager",
    title: "Engineering Manager",
    companyName: "Creative Solutions Inc.",
    location: "San Francisco, CA",
    email: "",
  },
  context: {
    jobTitle: "Senior Frontend Engineer",
    companyName: "Creative Solutions Inc.",
    jobUrl: "https://creativesolutions.inc/careers/senior-frontend-engineer",
    tone: "professional",
  },
  content: {
    greeting: "Dear Hiring Manager,",
    opening:
      "I am excited to apply for the Senior Frontend Engineer role at Creative Solutions Inc. With a strong background in building polished, high-performing web applications, I enjoy turning complex product goals into intuitive user experiences.",
    body: [
      "In my current role, I have led the redesign of customer-facing interfaces, improved accessibility standards, and partnered closely with product and design teams to ship measurable improvements in user engagement.",
      "I would bring the same combination of technical depth, product thinking, and ownership to your team. I am especially drawn to this role because of the opportunity to contribute to a product that values both performance and thoughtful design.",
    ],
    closing:
      "Thank you for your time and consideration. I would welcome the opportunity to discuss how my experience can support your team.",
    signature: "Sincerely,\nJohn Doe",
  },
  metadata: {
    template: "classic",
    notes: "",
  },
};
