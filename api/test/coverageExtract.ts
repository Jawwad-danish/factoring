import * as fs from 'node:fs';
import * as path from 'node:path';

interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

interface CoverageSummary {
  total: {
    lines: CoverageMetric;
    statements: CoverageMetric;
    functions: CoverageMetric;
    branches: CoverageMetric;
    branchesTrue: CoverageMetric;
  };
}

function getCoverageSummary(): CoverageSummary {
  const coverageSummaryPath = path.join(
    __dirname,
    'coverage',
    'coverage-summary.json',
  );
  if (fs.existsSync(coverageSummaryPath)) {
    const contents = fs.readFileSync(coverageSummaryPath, {
      encoding: 'utf-8',
    });
    const coverage = JSON.parse(contents);
    return coverage;
  }

  throw new Error('Coverage summary not found');
}

function extractCoverage() {
  try {
    const coverageSummary = getCoverageSummary();
    return coverageSummary.total.lines.pct;
  } catch (error) {
    console.error(error);
    return -1;
  }
}

console.log(extractCoverage());
