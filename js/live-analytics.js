const rawDataHead = document.querySelector('#raw-data-head');
const rawDataTable = document.querySelector('#raw-data-table');
const cleanDataHead = document.querySelector('#clean-data-head');
const cleanDataTable = document.querySelector('#clean-data-table');
const runDemoButton = document.querySelector('#run-live-demo');
const csvUpload = document.querySelector('#csv-upload');
const demoStatus = document.querySelector('#live-demo-status');
const rowsMetric = document.querySelector('#live-revenue');
const columnsMetric = document.querySelector('#live-forecast');
const relationshipMetric = document.querySelector('#live-anomaly');
const aiQualityScore = document.querySelector('#ai-quality-score');
const aiInsights = document.querySelector('#ai-insights');
const dashboardCanvas = document.querySelector('#dataset-dashboard-chart');
const dashboardBars = document.querySelector('#dataset-dashboard-bars');
const dashboardChartTitle = document.querySelector('#dashboard-chart-title');
const dashboardChartSummary = document.querySelector('#dashboard-chart-summary');
const chartTopSegment = document.querySelector('#chart-top-segment');
const chartVisibleTotal = document.querySelector('#chart-visible-total');
const chartKpiTotal = document.querySelector('#chart-kpi-total');
const chartKpiAverage = document.querySelector('#chart-kpi-average');
const chartKpiShare = document.querySelector('#chart-kpi-share');
const modelForecast = document.querySelector('#model-forecast');
const modelAnomalies = document.querySelector('#model-anomalies');
const modelConfidence = document.querySelector('#model-confidence');
const decisionReadiness = document.querySelector('#decision-readiness');
const decisionOpportunity = document.querySelector('#decision-opportunity');
const decisionRisk = document.querySelector('#decision-risk');
const decisionAction = document.querySelector('#decision-action');
const qualityCompleteness = document.querySelector('#quality-completeness');
const qualityDuplicates = document.querySelector('#quality-duplicates');
const qualityModelReady = document.querySelector('#quality-model-ready');
const pbiLatestMonth = document.querySelector('#pbi-latest-month');
const pbiMonthlyKpi = document.querySelector('#pbi-monthly-kpi');
const pbiMomChange = document.querySelector('#pbi-mom-change');
const pbiAverageMonthly = document.querySelector('#pbi-average-monthly');
const datasetRelationshipCount = document.querySelector('#dataset-relationship-count');
const datasetRelationshipSummary = document.querySelector('#dataset-relationship-summary');
const aiChatWindow = document.querySelector('#ai-chat-window');
const aiChatForm = document.querySelector('#ai-chat-form');
const aiQuestionInput = document.querySelector('#ai-question-input');
const aiQuestionChips = document.querySelectorAll('.ai-question-chip');
const analysisFiles = document.querySelector('#analysis-files');
const analysisShape = document.querySelector('#analysis-shape');
const analysisChartReady = document.querySelector('#analysis-chart-ready');
const workflowButtons = document.querySelectorAll('[data-stage-button]');
const workflowPanels = document.querySelectorAll('[data-stage-panel]');

const sampleCsv = `order_id,date,category,quantity,unit_price,region
 A-1001 ,2026/01/05,laptop,2,54000,South
A-1002,06-01-2026,Mobile,1,28500,West
A-1003,2026-01-07,Laptop,,62000,South
A-1002,06-01-2026,Mobile,1,28500,West
A-1004,2026-02-02,Accessories,5,1200,North
A-1005,bad-date,Tablet,3,18000,East
A-1006,2026-02-09,Mobile,4,29200,West`;

const sampleDataset = {
  name: 'sample_sales.csv',
  ...parseCsv(sampleCsv),
};
let activeDataset = sampleDataset;
let activeDatasets = [sampleDataset];
let activeCleaned = null;
let activeAnalysis = null;
let activeDatasetRelationships = [];

function updateStatus(message) {
  if (demoStatus) demoStatus.textContent = message;
}

function setWorkflowStage(stage) {
  workflowButtons.forEach(button => {
    const isActive = button.dataset.stageButton === stage;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  workflowPanels.forEach(panel => {
    panel.hidden = panel.dataset.stagePanel !== stage;
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(cell);
      if (row.some(value => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some(value => value.trim() !== '')) rows.push(row);

  const headers = rows.shift()?.map((header, index) => header.trim() || `Column ${index + 1}`) || [];
  const records = rows.map(values => headers.reduce((record, header, index) => {
    record[header] = values[index] || '';
    return record;
  }, {}));

  return { headers, records };
}

function combineDatasets(datasets) {
  if (datasets.length === 1) return datasets[0];

  const sourceHeader = 'Source Dataset';
  const headers = Array.from(new Set([
    sourceHeader,
    ...datasets.flatMap(dataset => dataset.headers),
  ]));

  const records = datasets.flatMap(dataset => dataset.records.map(record => headers.reduce((combinedRecord, header) => {
    combinedRecord[header] = header === sourceHeader ? dataset.name : record[header] || '';
    return combinedRecord;
  }, {})));

  return {
    name: `${datasets.length} uploaded datasets`,
    headers,
    records,
  };
}

function readCsvFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parsedDataset = parseCsv(String(reader.result || '').replace(/^\uFEFF/, ''));
      resolve({
        name: file.name,
        ...parsedDataset,
      });
    };
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsText(file);
  });
}

function normalizeValue(value) {
  return String(value ?? '').trim();
}

function parseNumber(value) {
  const normalized = normalizeValue(value).replace(/[$,%\s]/g, '').replace(/,/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeKey(value) {
  return normalizeValue(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function columnValueSet(dataset, header) {
  return new Set(dataset.records
    .map(record => normalizeKey(record[header]))
    .filter(Boolean));
}

function detectDatasetRelationships(datasets) {
  if (datasets.length < 2) return [];

  const relationships = [];

  for (let leftIndex = 0; leftIndex < datasets.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < datasets.length; rightIndex += 1) {
      const leftDataset = datasets[leftIndex];
      const rightDataset = datasets[rightIndex];
      const rightHeaderMap = rightDataset.headers.reduce((map, header) => {
        map.set(normalizeKey(header), header);
        return map;
      }, new Map());

      leftDataset.headers.forEach(leftHeader => {
        const rightHeader = rightHeaderMap.get(normalizeKey(leftHeader));
        if (!rightHeader) return;

        const leftValues = columnValueSet(leftDataset, leftHeader);
        const rightValues = columnValueSet(rightDataset, rightHeader);
        const smallestSetSize = Math.min(leftValues.size, rightValues.size);
        const overlapCount = [...leftValues].filter(value => rightValues.has(value)).length;
        const confidence = smallestSetSize ? Math.round((overlapCount / smallestSetSize) * 100) : 0;

        relationships.push({
          leftDataset: leftDataset.name,
          rightDataset: rightDataset.name,
          leftHeader,
          rightHeader,
          overlapCount,
          confidence,
        });
      });
    }
  }

  return relationships
    .filter(relationship => relationship.overlapCount > 0 || relationship.confidence > 0)
    .sort((first, second) => second.confidence - first.confidence || second.overlapCount - first.overlapCount);
}

function parseDateValue(value) {
  const normalized = normalizeValue(value);
  const dateParts = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  const dateValue = dateParts
    ? `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}`
    : normalized.replace(/\//g, '-');
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function titleCase(value) {
  const cleanValue = normalizeValue(value).toLowerCase();
  return cleanValue ? cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1) : '';
}

function inferColumnTypes(headers, records) {
  return headers.reduce((types, header) => {
    const values = records.map(record => normalizeValue(record[header])).filter(Boolean);
    const numericCount = values.filter(value => parseNumber(value) !== null).length;
    const dateCount = values.filter(value => parseDateValue(value) !== null).length;

    if (values.length && numericCount / values.length >= 0.7) {
      types[header] = 'number';
    } else if (values.length && dateCount / values.length >= 0.7) {
      types[header] = 'date';
    } else {
      types[header] = 'category';
    }

    return types;
  }, {});
}

function cleanDataset(dataset) {
  const types = inferColumnTypes(dataset.headers, dataset.records);
  const seenRows = new Set();
  let duplicateCount = 0;
  let missingCount = 0;

  const cleanedRecords = dataset.records.map(record => {
    const normalizedRecord = {};
    const rowSignature = dataset.headers.map(header => normalizeValue(record[header]).toLowerCase()).join('|');
    const isDuplicate = seenRows.has(rowSignature);

    if (isDuplicate) duplicateCount += 1;
    seenRows.add(rowSignature);

    dataset.headers.forEach(header => {
      const value = normalizeValue(record[header]);
      if (!value) missingCount += 1;

      if (types[header] === 'number') {
        normalizedRecord[header] = parseNumber(value);
      } else if (types[header] === 'date') {
        const parsedDate = parseDateValue(value);
        normalizedRecord[header] = parsedDate ? parsedDate.toISOString().slice(0, 10) : '';
      } else {
        normalizedRecord[header] = titleCase(value);
      }
    });

    normalizedRecord.__status = isDuplicate ? 'Duplicate removed' : 'Cleaned';
    normalizedRecord.__usable = !isDuplicate;
    return normalizedRecord;
  });

  const quantityColumn = dataset.headers.find(header =>
    types[header] === 'number' && /qty|quantity|units?/i.test(header)
  );
  const priceColumn = dataset.headers.find(header =>
    types[header] === 'number' && /price|rate|amount|value/i.test(header)
  );
  const analysisHeaders = [...dataset.headers];

  if (quantityColumn && priceColumn) {
    cleanedRecords.forEach(record => {
      record['Estimated Revenue'] = Number.isFinite(record[quantityColumn]) && Number.isFinite(record[priceColumn])
        ? record[quantityColumn] * record[priceColumn]
        : null;
    });
    types['Estimated Revenue'] = 'number';
    analysisHeaders.push('Estimated Revenue');
  }

  return {
    analysisHeaders,
    types,
    cleanedRecords,
    duplicateCount,
    missingCount,
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderTable(headElement, bodyElement, headers, records, status = false) {
  if (!headElement || !bodyElement) return;

  const visibleHeaders = headers.slice(0, 5);
  headElement.innerHTML = visibleHeaders.map(header => `<th>${escapeHtml(header)}</th>`).join('');
  if (status) headElement.innerHTML += '<th>Status</th>';

  if (!records.length) {
    const message = status ? 'Upload a CSV or analyze the sample to generate cleaned output.' : 'No rows available.';
    bodyElement.innerHTML = `<tr><td colspan="${visibleHeaders.length + (status ? 1 : 0)}">${message}</td></tr>`;
    return;
  }

  bodyElement.innerHTML = records.slice(0, 6).map(record => `
    <tr>
      ${visibleHeaders.map(header => `<td>${escapeHtml(record[header] ?? '-')}</td>`).join('')}
      ${status ? `<td>${escapeHtml(record.__status)}</td>` : ''}
    </tr>
  `).join('');
}

function correlation(xValues, yValues) {
  const pairs = xValues
    .map((value, index) => [value, yValues[index]])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

  if (pairs.length < 2) return 0;

  const xAverage = pairs.reduce((total, [x]) => total + x, 0) / pairs.length;
  const yAverage = pairs.reduce((total, [, y]) => total + y, 0) / pairs.length;
  const numerator = pairs.reduce((total, [x, y]) => total + (x - xAverage) * (y - yAverage), 0);
  const xVariance = pairs.reduce((total, [x]) => total + (x - xAverage) ** 2, 0);
  const yVariance = pairs.reduce((total, [, y]) => total + (y - yAverage) ** 2, 0);

  return xVariance && yVariance ? numerator / Math.sqrt(xVariance * yVariance) : 0;
}

function linearRegression(values) {
  const points = values
    .map((value, index) => ({ x: index + 1, y: value }))
    .filter(point => Number.isFinite(point.y));

  if (points.length < 2) {
    return { forecast: null, slope: 0, confidence: 0 };
  }

  const xAverage = points.reduce((total, point) => total + point.x, 0) / points.length;
  const yAverage = points.reduce((total, point) => total + point.y, 0) / points.length;
  const numerator = points.reduce((total, point) => total + (point.x - xAverage) * (point.y - yAverage), 0);
  const denominator = points.reduce((total, point) => total + (point.x - xAverage) ** 2, 0);
  const slope = denominator ? numerator / denominator : 0;
  const intercept = yAverage - slope * xAverage;
  const forecast = intercept + slope * (points.length + 1);
  const residuals = points.map(point => Math.abs(point.y - (intercept + slope * point.x)));
  const averageResidual = residuals.reduce((total, value) => total + value, 0) / residuals.length;
  const confidence = Math.max(0, Math.min(95, Math.round(95 - (averageResidual / Math.max(1, yAverage)) * 100)));

  return { forecast, slope, confidence };
}

function detectAnomalies(values) {
  const cleanValues = values.filter(value => Number.isFinite(value));
  if (cleanValues.length < 3) return [];

  const average = cleanValues.reduce((total, value) => total + value, 0) / cleanValues.length;
  const variance = cleanValues.reduce((total, value) => total + (value - average) ** 2, 0) / cleanValues.length;
  const standardDeviation = Math.sqrt(variance);

  if (!standardDeviation) return [];

  return cleanValues
    .map((value, index) => ({ index, value, zScore: Math.abs((value - average) / standardDeviation) }))
    .filter(point => point.zScore >= 1.6);
}

function chooseBusinessMeasure(numericColumns) {
  const priorityTerms = ['revenue', 'sales', 'amount', 'total', 'value', 'price', 'profit', 'cost'];
  return numericColumns.find(column => priorityTerms.some(term => column.toLowerCase().includes(term))) || numericColumns[0];
}

function formatCompactNumber(value) {
  if (!Number.isFinite(value)) return '--';
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(value % 1 ? 1 : 0);
}

function roundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, Math.abs(height) / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function buildMonthlyKpis(records, dateColumn, measureColumn) {
  if (!dateColumn || !measureColumn) {
    return null;
  }

  const monthlyTotals = records.reduce((summary, record) => {
    const parsedDate = parseDateValue(record[dateColumn]);
    const measure = record[measureColumn];
    if (!parsedDate || !Number.isFinite(measure)) return summary;

    const monthKey = parsedDate.toISOString().slice(0, 7);
    summary[monthKey] = (summary[monthKey] || 0) + measure;
    return summary;
  }, {});
  const monthEntries = Object.entries(monthlyTotals).sort(([left], [right]) => left.localeCompare(right));

  if (!monthEntries.length) {
    return null;
  }

  const latest = monthEntries[monthEntries.length - 1];
  const previous = monthEntries[monthEntries.length - 2];
  const average = monthEntries.reduce((total, [, value]) => total + value, 0) / monthEntries.length;
  const momChange = previous && previous[1]
    ? ((latest[1] - previous[1]) / Math.abs(previous[1])) * 100
    : null;

  return {
    average,
    latestMonth: latest[0],
    latestValue: latest[1],
    measureColumn,
    momChange,
    monthlyTotals: monthEntries.map(([month, value]) => ({ month, value })),
  };
}

function analyzeDataset(dataset, cleaned) {
  const usableRecords = cleaned.cleanedRecords.filter(record => record.__usable);
  const analysisHeaders = cleaned.analysisHeaders || dataset.headers;
  const numericColumns = analysisHeaders.filter(header => cleaned.types[header] === 'number');
  const categoryColumns = analysisHeaders.filter(header => cleaned.types[header] === 'category');
  const dateColumns = analysisHeaders.filter(header => cleaned.types[header] === 'date');
  const firstNumeric = numericColumns[0];
  const firstCategory = categoryColumns[0];
  const businessMeasure = chooseBusinessMeasure(numericColumns);
  let topRelationship = '-';
  let chartData = [];
  let modelResult = { forecast: null, slope: 0, confidence: 0 };
  let anomalies = [];
  const monthlyKpis = buildMonthlyKpis(usableRecords, dateColumns[0], businessMeasure);

  if (numericColumns.length >= 2) {
    const relationships = [];
    for (let i = 0; i < numericColumns.length; i += 1) {
      for (let j = i + 1; j < numericColumns.length; j += 1) {
        const left = numericColumns[i];
        const right = numericColumns[j];
        relationships.push({
          label: `${left} vs ${right}`,
          score: Math.abs(correlation(
            usableRecords.map(record => record[left]),
            usableRecords.map(record => record[right]),
          )),
        });
      }
    }
    const strongest = relationships.sort((a, b) => b.score - a.score)[0];
    if (strongest) topRelationship = `${strongest.label} (${strongest.score.toFixed(2)})`;
  }

  if (firstCategory && businessMeasure) {
    const grouped = usableRecords.reduce((summary, record) => {
      const key = record[firstCategory] || 'Unknown';
      summary[key] = (summary[key] || 0) + (record[businessMeasure] || 0);
      return summary;
    }, {});
    chartData = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
    if (topRelationship === '-') topRelationship = `${firstCategory} by ${businessMeasure}`;
  }

  if (businessMeasure) {
    const numericValues = usableRecords
      .map(record => record[businessMeasure])
      .filter(value => Number.isFinite(value));
    modelResult = linearRegression(numericValues);
    anomalies = detectAnomalies(numericValues);
  }

  const totalMissingCells = cleaned.missingCount;
  const totalCells = Math.max(1, dataset.records.length * dataset.headers.length);
  const completeness = Math.round(((totalCells - totalMissingCells) / totalCells) * 100);
  const duplicateRate = Math.round((cleaned.duplicateCount / Math.max(1, dataset.records.length)) * 100);
  const qualityScore = Math.max(0, Math.round(
    100 - ((cleaned.duplicateCount + totalMissingCells) / Math.max(1, dataset.records.length + dataset.headers.length)) * 35,
  ));
  const modelReadyScore = Math.round(
    Math.min(1, numericColumns.length / 2) * 35 +
    Math.min(1, categoryColumns.length) * 25 +
    Math.min(1, usableRecords.length / 10) * 25 +
    Math.min(1, completeness / 100) * 15,
  );
  const decisionReadinessScore = Math.round((qualityScore * .45) + (modelReadyScore * .35) + ((100 - duplicateRate) * .2));

  return {
    chartData,
    dateColumns,
    firstCategory,
    firstNumeric,
    businessMeasure,
    numericColumns,
    categoryColumns,
    qualityScore,
    topRelationship,
    usableRecords,
    modelResult,
    anomalies,
    completeness,
    duplicateRate,
    modelReadyScore,
    decisionReadinessScore,
    monthlyKpis,
  };
}

function drawDashboard(chartData) {
  const topItem = chartData[0];
  const totalValue = chartData.reduce((total, item) => total + item.value, 0);
  if (dashboardChartTitle) dashboardChartTitle.textContent = topItem ? `${topItem.label} leads the dataset` : 'Top categories by selected value';
  if (dashboardChartSummary) {
    dashboardChartSummary.textContent = topItem
      ? `${topItem.label} contributes ${Math.round((topItem.value / Math.max(totalValue, 1)) * 100)}% of the visible chart total.`
      : 'Upload data with at least one category and one numeric field to build charts.';
  }
  if (chartTopSegment) chartTopSegment.textContent = topItem ? topItem.label : '--';
  if (chartVisibleTotal) chartVisibleTotal.textContent = chartData.length ? formatCompactNumber(totalValue) : '--';
  if (chartKpiTotal) chartKpiTotal.textContent = chartData.length ? formatCompactNumber(totalValue) : '--';
  if (chartKpiAverage) chartKpiAverage.textContent = chartData.length ? formatCompactNumber(totalValue / chartData.length) : '--';
  if (chartKpiShare) {
    chartKpiShare.textContent = topItem
      ? `${Math.round((topItem.value / Math.max(totalValue, 1)) * 100)}%`
      : '--';
  }

  if (dashboardBars) {
    const maxValue = Math.max(...chartData.map(item => item.value), 1);
    dashboardBars.innerHTML = chartData.length
      ? chartData.map((item, index) => `
        <div class="dashboard-bar-row">
          <span><b>${index + 1}</b>${escapeHtml(item.label.slice(0, 16))}</span>
          <div class="dashboard-bar-track">
            <div class="dashboard-bar-fill" style="--bar-index:${index};width:${Math.max(4, (item.value / maxValue) * 100)}%"></div>
          </div>
          <strong>${formatCompactNumber(item.value)}</strong>
        </div>
      `).join('')
      : '<div class="dashboard-empty-state">Charts appear after upload.</div>';
  }

  if (!dashboardCanvas) return;

  const context = dashboardCanvas.getContext('2d');
  const width = dashboardCanvas.width;
  const height = dashboardCanvas.height;
  const padding = 42;
  const chartBottom = height - 42;
  const chartTop = 54;
  const chartHeight = chartBottom - chartTop;
  const maxValue = Math.max(...chartData.map(item => item.value), 1);

  context.clearRect(0, 0, width, height);
  const backgroundGradient = context.createLinearGradient(0, 0, width, height);
  backgroundGradient.addColorStop(0, 'rgba(15,23,42,.96)');
  backgroundGradient.addColorStop(.5, 'rgba(8,47,73,.72)');
  backgroundGradient.addColorStop(1, 'rgba(2,6,23,.98)');
  context.fillStyle = backgroundGradient;
  roundedRect(context, 0, 0, width, height, 18);
  context.fill();

  context.fillStyle = '#e2e8f0';
  context.font = '700 15px Segoe UI, sans-serif';
  context.fillText(chartData.length ? 'Segment Performance' : 'Upload data to build chart', padding, 28);
  context.fillStyle = '#94a3b8';
  context.font = '12px Segoe UI, sans-serif';
  context.fillText(chartData.length ? 'Auto-selected category vs business measure' : 'CSV category and numeric columns are required', padding, 46);

  context.strokeStyle = 'rgba(148,163,184,.16)';
  context.lineWidth = 1;
  for (let line = 0; line <= 4; line += 1) {
    const y = chartTop + (chartHeight / 4) * line;
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
    context.fillStyle = '#64748b';
    context.font = '10px Segoe UI, sans-serif';
    context.textAlign = 'right';
    context.fillText(formatCompactNumber(maxValue - ((maxValue / 4) * line)), padding - 8, y + 3);
  }

  if (!chartData.length) {
    context.textAlign = 'start';
    return;
  }

  const barGap = 16;
  const barWidth = Math.min(54, (width - padding * 2 - barGap * (chartData.length - 1)) / chartData.length);
  const totalBarsWidth = barWidth * chartData.length + barGap * (chartData.length - 1);
  const startX = (width - totalBarsWidth) / 2;
  const trendPoints = [];

  chartData.forEach((item, index) => {
    const barHeight = Math.max(8, (chartHeight * item.value) / maxValue);
    const x = startX + index * (barWidth + barGap);
    const y = chartBottom - barHeight;
    const gradient = context.createLinearGradient(0, y, 0, height - padding);
    gradient.addColorStop(0, index % 2 ? '#a7f3d0' : '#38bdf8');
    gradient.addColorStop(.55, index % 2 ? '#10b981' : '#2563eb');
    gradient.addColorStop(1, '#0f172a');

    context.shadowColor = 'rgba(34,211,238,.28)';
    context.shadowBlur = 16;
    context.fillStyle = gradient;
    roundedRect(context, x, y, barWidth, barHeight, 12);
    context.fill();
    context.shadowBlur = 0;

    context.fillStyle = '#94a3b8';
    context.font = '11px Segoe UI, sans-serif';
    context.textAlign = 'center';
    context.fillText(item.label.slice(0, 9), x + barWidth / 2, height - 16);

    context.fillStyle = '#e2e8f0';
    context.font = '700 11px Segoe UI, sans-serif';
    context.fillText(formatCompactNumber(item.value), x + barWidth / 2, Math.max(68, y - 8));
    trendPoints.push({ x: x + barWidth / 2, y });
  });

  context.beginPath();
  trendPoints.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y - 10);
    else context.lineTo(point.x, point.y - 10);
  });
  context.strokeStyle = '#facc15';
  context.lineWidth = 3;
  context.stroke();

  trendPoints.forEach(point => {
    context.beginPath();
    context.arc(point.x, point.y - 10, 4, 0, Math.PI * 2);
    context.fillStyle = '#facc15';
    context.fill();
    context.strokeStyle = 'rgba(250,204,21,.35)';
    context.lineWidth = 6;
    context.stroke();
  });

  context.textAlign = 'start';
}

function assistantContextReady() {
  return activeDataset && activeCleaned && activeAnalysis;
}

function buildAssistantAnswer(question) {
  if (!assistantContextReady()) {
    return 'Run the sample or upload CSV files first, then I can answer using detected columns, quality checks, KPIs, relationships, and chart results from the static browser-side summary.';
  }

  const lowerQuestion = question.toLowerCase();
  const topChartItem = activeAnalysis.chartData[0];
  const relationshipText = activeDatasetRelationships.length
    ? `${activeDatasetRelationships[0].leftDataset} connects with ${activeDatasetRelationships[0].rightDataset} on ${activeDatasetRelationships[0].leftHeader} with ${activeDatasetRelationships[0].confidence}% overlap`
    : activeDatasets.length > 1
      ? 'multiple files were uploaded, but no strong shared-key match was detected'
      : 'upload more than one CSV to discover cross-dataset join relationships';
  const kpiText = activeAnalysis.monthlyKpis
    ? `latest ${activeAnalysis.monthlyKpis.measureColumn} for ${activeAnalysis.monthlyKpis.latestMonth} is ${formatCompactNumber(activeAnalysis.monthlyKpis.latestValue)}, with ${activeAnalysis.monthlyKpis.momChange === null ? 'no prior month comparison' : `${activeAnalysis.monthlyKpis.momChange.toFixed(1)}% month-over-month change`}`
    : 'monthly KPI needs one usable date column and one numeric business measure';
  const qualityText = `quality score is ${activeAnalysis.qualityScore}/100, completeness is ${activeAnalysis.completeness}%, duplicate rate is ${activeAnalysis.duplicateRate}%, and ${activeCleaned.missingCount} blank cells were found`;
  const segmentText = topChartItem
    ? `${topChartItem.label} is currently the strongest visible segment with ${formatCompactNumber(topChartItem.value)} in ${activeAnalysis.businessMeasure}`
    : 'I need at least one category column and one numeric measure to rank segments';

  if (/risk|clean|quality|fix|issue|problem/.test(lowerQuestion)) {
    return `Start with data quality. The ${qualityText}. Fix blank cells, review duplicate rows, and confirm data types before using this for planning. ${relationshipText}.`;
  }

  if (/relationship|join|connect|key|merge|multiple/.test(lowerQuestion)) {
    return `Relationship scan result: ${relationshipText}. For a stronger analysis preview, keep shared IDs named consistently across files and make sure values match exactly.`;
  }

  if (/kpi|month|monthly|mom|trend|forecast/.test(lowerQuestion)) {
    return `KPI readout: ${kpiText}. Forecast confidence is ${activeAnalysis.modelResult.confidence}%, and the static preview found ${activeAnalysis.anomalies.length} possible outlier records.`;
  }

  if (/best|top|segment|category|perform/.test(lowerQuestion)) {
    return `Best segment: ${segmentText}. Use this as the first dashboard focus, then compare it against region, customer, product, or time if those columns exist.`;
  }

  if (/next|action|recommend|should|decision/.test(lowerQuestion)) {
    return `Recommended next action: ${activeAnalysis.decisionReadinessScore >= 80 ? 'use this dataset for dashboard review and upgrade for a complete decision report' : 'clean flagged records before making business decisions'}. ${segmentText}. ${qualityText}.`;
  }

  return `Here is the quick analyst summary: ${activeAnalysis.usableRecords.length} clean rows were prepared from ${activeDataset.records.length} rows, ${activeAnalysis.numericColumns.length} numeric fields and ${activeAnalysis.categoryColumns.length} category fields were detected, ${segmentText}, ${qualityText}, and ${kpiText}.`;
}

function addAssistantMessage(role, text) {
  if (!aiChatWindow) return;

  const message = document.createElement('div');
  message.className = `ai-message ai-message-${role}`;

  const speaker = document.createElement('span');
  speaker.textContent = role === 'user' ? 'You' : 'Preview Assistant';

  const body = document.createElement('p');
  body.textContent = text;

  message.append(speaker, body);
  aiChatWindow.append(message);
  aiChatWindow.scrollTop = aiChatWindow.scrollHeight;
}

function addUploadSummaryMessage(fileCount) {
  if (!assistantContextReady()) return;
  const sourceText = fileCount === 1 ? '1 CSV file' : `${fileCount} CSV files`;
  const chartText = activeAnalysis.chartData.length
    ? `${activeAnalysis.chartData[0].label} is the top chart segment`
    : 'no category-plus-number chart could be created';
  addAssistantMessage(
    'assistant',
    `Static preview generated for ${sourceText}: ${activeAnalysis.usableRecords.length} clean rows, ${activeAnalysis.numericColumns.length} numeric columns, ${activeAnalysis.categoryColumns.length} category columns, and ${chartText}.`,
  );
}

function askAssistant(question) {
  const cleanQuestion = normalizeValue(question);
  if (!cleanQuestion) return;

  addAssistantMessage('user', cleanQuestion);
  addAssistantMessage('assistant', buildAssistantAnswer(cleanQuestion));
  if (aiQuestionInput) aiQuestionInput.value = '';
}

function renderInsights(dataset, cleaned, analysis, datasetRelationships = []) {
  rowsMetric.textContent = `${analysis.usableRecords.length}/${dataset.records.length}`;
  columnsMetric.textContent = String(dataset.headers.length);
  relationshipMetric.textContent = analysis.topRelationship;
  if (analysisFiles) analysisFiles.textContent = activeDatasets.length === 1 ? '1 file' : `${activeDatasets.length} files`;
  if (analysisShape) analysisShape.textContent = `${dataset.records.length} x ${dataset.headers.length}`;
  if (analysisChartReady) analysisChartReady.textContent = analysis.chartData.length ? 'Ready' : 'Limited';
  if (aiQualityScore) aiQualityScore.textContent = `Quality score: ${analysis.qualityScore}/100`;
  if (modelForecast) {
    modelForecast.textContent = analysis.modelResult.forecast === null
      ? 'Not enough data yet'
      : `Next value: ${formatCompactNumber(analysis.modelResult.forecast)}`;
  }
  if (modelAnomalies) {
    modelAnomalies.textContent = analysis.businessMeasure
      ? `Measure: ${analysis.businessMeasure.replace(/_/g, ' ')} | Outliers: ${analysis.anomalies.length}`
      : `Outliers: ${analysis.anomalies.length}`;
  }
  if (modelConfidence) modelConfidence.textContent = `Reliability: ${analysis.modelResult.confidence}%`;
  if (qualityCompleteness) qualityCompleteness.textContent = `${analysis.completeness}%`;
  if (qualityDuplicates) qualityDuplicates.textContent = `${analysis.duplicateRate}%`;
  if (qualityModelReady) qualityModelReady.textContent = `${analysis.modelReadyScore}%`;
  if (decisionReadiness) decisionReadiness.textContent = `Readiness: ${analysis.decisionReadinessScore}/100`;
  if (pbiLatestMonth) pbiLatestMonth.textContent = analysis.monthlyKpis?.latestMonth || '--';
  if (pbiMonthlyKpi) pbiMonthlyKpi.textContent = analysis.monthlyKpis ? formatCompactNumber(analysis.monthlyKpis.latestValue) : '--';
  if (pbiMomChange) {
    pbiMomChange.textContent = analysis.monthlyKpis?.momChange === null || !analysis.monthlyKpis
      ? '--'
      : `${analysis.monthlyKpis.momChange >= 0 ? '+' : ''}${analysis.monthlyKpis.momChange.toFixed(1)}%`;
  }
  if (pbiAverageMonthly) pbiAverageMonthly.textContent = analysis.monthlyKpis ? formatCompactNumber(analysis.monthlyKpis.average) : '--';
  if (datasetRelationshipCount) datasetRelationshipCount.textContent = `${datasetRelationships.length}`;
  if (datasetRelationshipSummary) {
    if (datasetRelationships.length) {
      const topRelationship = datasetRelationships[0];
      datasetRelationshipSummary.textContent = `${topRelationship.leftDataset} and ${topRelationship.rightDataset} share ${topRelationship.leftHeader} with ${topRelationship.confidence}% value overlap.`;
    } else if (activeDatasets.length > 1) {
      datasetRelationshipSummary.textContent = 'No shared key with matching values was found across the uploaded files.';
    } else {
      datasetRelationshipSummary.textContent = 'Upload multiple CSV files to detect shared keys and value overlap.';
    }
  }

  const topChartItem = analysis.chartData[0];
  if (decisionOpportunity) {
    decisionOpportunity.textContent = topChartItem
      ? `${topChartItem.label} is the strongest segment in the auto dashboard.`
      : 'Add at least one category and one numeric column to identify a strong segment.';
  }
  if (decisionRisk) {
    decisionRisk.textContent = cleaned.missingCount || cleaned.duplicateCount
      ? `${cleaned.missingCount} blank cells and ${cleaned.duplicateCount} duplicate rows may affect decisions.`
      : 'No major quality blocker found in the free scan.';
  }
  if (decisionAction) {
    if (analysis.decisionReadinessScore >= 80) {
      decisionAction.textContent = 'Use this dataset for dashboard review, then upgrade for a full decision report.';
    } else if (analysis.decisionReadinessScore >= 55) {
      decisionAction.textContent = 'Clean flagged records before using the dataset for planning decisions.';
    } else {
      decisionAction.textContent = 'Fix missing values, duplicates, and data types before making business decisions.';
    }
  }

  const insights = [
    `${analysis.usableRecords.length} clean rows were prepared from ${dataset.records.length} uploaded rows.`,
    `${analysis.numericColumns.length} numeric, ${analysis.categoryColumns.length} category, and ${analysis.dateColumns.length} date columns were detected.`,
    `${cleaned.duplicateCount} duplicate rows and ${cleaned.missingCount} blank cells were found during cleaning.`,
    datasetRelationships.length
      ? `${datasetRelationships.length} cross-dataset relationship signals were found; strongest join candidate is ${datasetRelationships[0].leftHeader} between ${datasetRelationships[0].leftDataset} and ${datasetRelationships[0].rightDataset}.`
      : activeDatasets.length > 1
        ? 'Multiple files were analyzed, but no matching shared-key values were detected across them.'
        : 'Upload multiple CSV files together to run cross-dataset relationship analysis.',
    `Decision readiness is ${analysis.decisionReadinessScore}/100 based on completeness, duplicates, usable rows, and analysis-ready columns.`,
    analysis.topRelationship === '-'
      ? 'No strong relationship could be calculated because the dataset needs at least two numeric fields or one category plus one numeric field.'
      : `Best basic relationship found: ${analysis.topRelationship}.`,
    analysis.businessMeasure
      ? `Forecast preview uses ${analysis.businessMeasure} trend and found ${analysis.anomalies.length} possible outlier records.`
      : 'The preview needs at least one numeric column to run forecasting and anomaly detection.',
    analysis.monthlyKpis
      ? `Power BI style monthly KPI uses ${analysis.monthlyKpis.measureColumn}: latest month is ${analysis.monthlyKpis.latestMonth} with ${formatCompactNumber(analysis.monthlyKpis.latestValue)}.`
      : 'Monthly KPI needs one date column and one numeric business measure.',
    'Paid analysis can add analyst explanations, custom business rules, dashboard exports, and full dataset reports.',
  ];

  aiInsights.innerHTML = insights.map(insight => `<li>${escapeHtml(insight)}</li>`).join('');
}

function runAnalysis(dataset = activeDataset, datasets = activeDatasets) {
  if (!dataset.headers.length || !dataset.records.length) {
    updateStatus('No data found');
    return;
  }

  activeDataset = dataset;
  activeDatasets = datasets;
  const cleaned = cleanDataset(dataset);
  const analysis = analyzeDataset(dataset, cleaned);
  const datasetRelationships = detectDatasetRelationships(datasets);
  activeCleaned = cleaned;
  activeAnalysis = analysis;
  activeDatasetRelationships = datasetRelationships;

  renderTable(rawDataHead, rawDataTable, dataset.headers, dataset.records);
  renderTable(cleanDataHead, cleanDataTable, cleaned.analysisHeaders || dataset.headers, cleaned.cleanedRecords, true);
  renderInsights(dataset, cleaned, analysis, datasetRelationships);
  drawDashboard(analysis.chartData);

  updateStatus('Preview generated');
  runDemoButton.textContent = 'Analyze Sample';
}

if (rawDataTable && cleanDataTable) {
  renderTable(rawDataHead, rawDataTable, activeDataset.headers, activeDataset.records);
  renderTable(cleanDataHead, cleanDataTable, activeDataset.headers, [], true);
  runAnalysis(activeDataset, activeDatasets);
  setWorkflowStage('upload');

  runDemoButton.addEventListener('click', () => {
    activeDatasets = [sampleDataset];
    runAnalysis(sampleDataset, activeDatasets);
    addUploadSummaryMessage(1);
    updateStatus('Sample preview generated');
    setWorkflowStage('clean');
  });
  csvUpload?.addEventListener('change', async event => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    updateStatus('Reading CSV files');

    try {
      const uploadedDatasets = (await Promise.all(files.map(readCsvFile)))
        .filter(dataset => dataset.headers.length && dataset.records.length);

      if (!uploadedDatasets.length) {
        updateStatus('No data found');
        return;
      }

      const combinedDataset = combineDatasets(uploadedDatasets);
      runAnalysis(combinedDataset, uploadedDatasets);
      addUploadSummaryMessage(uploadedDatasets.length);
      updateStatus(uploadedDatasets.length === 1
        ? `Previewed ${uploadedDatasets[0].name}`
        : `Previewed ${uploadedDatasets.length} datasets`);
      setWorkflowStage('clean');
      event.target.value = '';
    } catch (error) {
      updateStatus('Could not generate preview');
      addAssistantMessage('assistant', 'I could not generate a static preview for that CSV. Please check that the file has a header row, comma-separated columns, and at least one data row.');
      event.target.value = '';
    }
  });

  aiChatForm?.addEventListener('submit', event => {
    event.preventDefault();
    askAssistant(aiQuestionInput?.value || '');
  });

  aiQuestionChips.forEach(chip => {
    chip.addEventListener('click', () => askAssistant(chip.dataset.question || chip.textContent || ''));
  });

  workflowButtons.forEach(button => {
    button.addEventListener('click', () => {
      const stage = button.dataset.stageButton || 'upload';
      setWorkflowStage(stage);
      if (stage === 'upload') csvUpload?.click();
    });
  });
}
