import companies from '../src/data/companies.json' with { type: 'json' };
import vacancies from '../src/data/vacancies.json' with { type: 'json' };

const entries = [
  ...companies.map((item) => ({ label: item.company, url: item.sourceUrl })),
  ...vacancies.map((item) => ({ label: `${item.company} — ${item.title}`, url: item.sourceUrl }))
].filter((item) => item.url);

const unique = [...new Map(entries.map((entry) => [entry.url, entry])).values()];
const results = [];

async function inspect(entry) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(entry.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'JobSearch-Link-Monitor/1.0' }
    });
    return { ...entry, status: response.status, ok: response.ok || [401, 403, 429].includes(response.status) };
  } catch (error) {
    return { ...entry, status: 'ERROR', ok: false, error: error.name };
  } finally {
    clearTimeout(timer);
  }
}

for (let index = 0; index < unique.length; index += 8) {
  const batch = unique.slice(index, index + 8);
  results.push(...await Promise.all(batch.map(inspect)));
}

const failures = results.filter((item) => !item.ok);
console.log(`Checked ${results.length} unique links.`);
console.log(`Potential failures: ${failures.length}.`);
for (const item of failures) console.log(`- ${item.status} | ${item.label} | ${item.url}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const fs = await import('node:fs/promises');
  const rows = failures.length
    ? failures.map((item) => `| ${item.status} | ${item.label.replaceAll('|', '\\|')} | ${item.url} |`).join('\n')
    : '| — | Nenhuma falha relevante | — |';
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `# JobSearch — verificação semanal\n\nLinks analisados: **${results.length}**  \nFalhas potenciais: **${failures.length}**\n\n| Status | Fonte | URL |\n|---|---|---|\n${rows}\n`);
}

// O monitor gera relatório, mas não derruba o workflow por bloqueios de robôs ou redes sociais.
process.exit(0);
