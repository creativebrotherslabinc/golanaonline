import os
import json
from groq import Groq
from google import genai
from google.genai import types

_PROMPT_TEMPLATE = """You are an expert resume writer and career strategist. Analyze the user's career history and the target job description, then generate highly optimized resume content.

USER CAREER HISTORY:
{career_history}

TARGET JOB DESCRIPTION:
{job_description}

Generate a JSON response with EXACTLY these fields:
{{
  "candidate_name": "Full name extracted from career history, or 'Applicant' if not found",
  "target_role": "The job title from the job description",
  "professional_summary": "3-4 sentence ATS-optimized professional summary. Lead with years of experience and key value proposition. Naturally incorporate 3-5 keywords from the job description.",
  "skills": ["skill1", "skill2", "skill3"],
  "work_experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "dates": "Month Year – Month Year (or Present)",
      "bullets": [
        "Achievement bullet starting with strong action verb, quantified where possible",
        "Achievement bullet 2",
        "Achievement bullet 3"
      ]
    }}
  ],
  "education": [
    {{
      "degree": "Degree Name and Field",
      "institution": "Institution Name",
      "year": "Year"
    }}
  ],
  "certifications": ["Certification 1", "Certification 2"],
  "cover_letter": "Full professional cover letter with 4 paragraphs: opening hook mentioning specific company/role, 2 middle paragraphs highlighting 2-3 relevant achievements from history that match the job, closing with call to action. Address: Dear Hiring Manager.",
  "ats_keywords": ["keyword1", "keyword2"]
}}

RULES:
- skills: 12-18 items, mix of technical and soft skills, prioritize those mentioned in job description
- work_experience bullets: 3-5 per role, start with strong verbs (Led, Developed, Increased, Reduced, Built, Managed, Designed, Implemented, etc.), quantify with numbers/percentages where possible
- cover_letter: personalized, specific, compelling — not generic
- Reorder work experience to put most relevant roles first if multiple exist
- Return ONLY valid JSON — no markdown fences, no explanation text"""


def _parse_json(content: str) -> dict:
    content = content.strip()
    # Strip markdown code blocks if present
    if content.startswith("```"):
        lines = content.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content = "\n".join(lines)
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(content[start:end])
        raise ValueError(f"Could not parse AI response as JSON: {content[:200]}")


def _generate_with_groq(career_history: str, job_description: str) -> dict:
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    prompt = _PROMPT_TEMPLATE.format(
        career_history=career_history,
        job_description=job_description,
    )
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=4000,
    )
    return _parse_json(response.choices[0].message.content)


def _generate_with_gemini(career_history: str, job_description: str) -> dict:
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    prompt = _PROMPT_TEMPLATE.format(
        career_history=career_history,
        job_description=job_description,
    )
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.3, max_output_tokens=4000),
    )
    return _parse_json(response.text)


def generate_resume_content(
    career_history: str,
    job_description: str,
    provider: str = "groq",
) -> dict:
    if provider == "gemini":
        return _generate_with_gemini(career_history, job_description)
    return _generate_with_groq(career_history, job_description)
