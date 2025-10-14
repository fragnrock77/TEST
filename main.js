const fileInput = document.getElementById('fileInput');
const uploader = document.getElementById('uploader');
const progressBar = document.getElementById('progressBar');
const fileInfo = document.getElementById('fileInfo');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const resetButton = document.getElementById('resetButton');
const caseSensitiveInput = document.getElementById('caseSensitive');
const exactMatchInput = document.getElementById('exactMatch');
const copyButton = document.getElementById('copyButton');
const exportCsvButton = document.getElementById('exportCsvButton');
const exportXlsxButton = document.getElementById('exportXlsxButton');
const resultStats = document.getElementById('resultStats');

let dataset = [];
let filteredData = [];
let columnDefs = [];
let currentFileName = '';
let workerReady = false;
let currentSearchStart = null;

 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
let worker = null;

function instantiateWorker() {
  if (worker) {
    worker.terminate();
  }
  let instance;
  try {
    instance = new Worker(new URL('./searchWorker.js', import.meta.url), {
      type: 'module',
    });
  } catch (moduleError) {
    console.warn('Module worker unavailable, falling back to classic worker.', moduleError);
    try {
      instance = new Worker('searchWorker.js');
    } catch (classicError) {
      console.error('Impossible de créer un Web Worker.', classicError);
      instance = null;
    }
  }
  if (instance) {
    instance.onmessage = handleWorkerMessage;
    instance.onerror = handleWorkerError;
    workerReady = false;
  }
  return instance;
}

function ensureWorker() {
  if (!worker) {
    worker = instantiateWorker();
  }
  return worker;
}

const worker = new Worker('searchWorker.js', { type: 'module' });
 main

const gridOptions = {
  columnDefs: [],
  defaultColDef: {
    sortable: true,
    resizable: true,
    filter: true,
    minWidth: 120,
    flex: 1,
  },
  rowData: [],
  animateRows: true,
  rowSelection: 'multiple',
  suppressFieldDotNotation: true,
};

const gridElement = document.getElementById('grid');
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
let gridApi;

if (typeof agGrid.createGrid === 'function') {
  gridApi = agGrid.createGrid(gridElement, gridOptions);
} else {
  new agGrid.Grid(gridElement, gridOptions);
  gridApi = gridOptions.api;
}

function setGridOption(key, value) {
  if (!gridApi) return;
  if (typeof gridApi.setGridOption === 'function') {
    gridApi.setGridOption(key, value);
    return;
  }
  if (typeof gridApi.updateGridOptions === 'function') {
    gridApi.updateGridOptions({ [key]: value });
    return;
  }
  if (key === 'columnDefs' && typeof gridApi.setColumnDefs === 'function') {
    gridApi.setColumnDefs(value);
    return;
  }
  if (key === 'rowData' && typeof gridApi.setRowData === 'function') {
    gridApi.setRowData(value);
  }
}

function handleWorkerMessage(event) {

new agGrid.Grid(gridElement, gridOptions);

worker.onmessage = (event) => {
 main
  const { type, payload } = event.data;
  switch (type) {
    case 'ready':
      workerReady = true;
      toggleSearch(true);
      break;
    case 'searchResult':
      currentSearchStart = null;
      filteredData = payload.rows;
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
      setGridOption('rowData', filteredData);

      gridOptions.api.setRowData(filteredData);
 main
      updateStats(payload.rows.length, dataset.length, payload.duration);
      setExportsAvailability(filteredData.length > 0);
      toggleSearch(true);
      break;
    case 'error':
      currentSearchStart = null;
      toggleSearch(true);
      showStatus(payload.message, true);
      break;
    default:
      break;
  }
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
}

function handleWorkerError(error) {
  console.error('Search worker error', error);
  toggleSearch(true);
  showStatus("Une erreur est survenue dans le moteur de recherche.", true);
}

};

worker.onerror = (error) => {
  console.error('Search worker error', error);
  toggleSearch(true);
  showStatus("Une erreur est survenue dans le moteur de recherche.", true);
};
 main

function resetState() {
  dataset = [];
  filteredData = [];
  columnDefs = [];
  currentFileName = '';
  workerReady = false;
  currentSearchStart = null;
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
  worker = instantiateWorker();
  setGridOption('columnDefs', []);
  setGridOption('rowData', []);

  gridOptions.api.setColumnDefs([]);
  gridOptions.api.setRowData([]);
 main
  progressBar.style.width = '0%';
  fileInfo.textContent = 'Aucun fichier importé pour le moment.';
  resultStats.textContent = 'Importez un fichier pour commencer l\'analyse.';
  toggleSearch(false);
  setExportsAvailability(false);
}

function toggleSearch(enabled) {
  if (!dataset.length) {
    searchButton.disabled = true;
    resetButton.disabled = true;
    return;
  }
  searchButton.disabled = !enabled;
  resetButton.disabled = !enabled;
  if (!enabled) {
    searchButton.classList.add('loading');
  } else {
    searchButton.classList.remove('loading');
  }
}

function setExportsAvailability(enabled) {
  copyButton.disabled = !enabled;
  exportCsvButton.disabled = !enabled;
  exportXlsxButton.disabled = !enabled;
}

function updateStats(count, total, durationMs = 0) {
  const duration = durationMs ? ` | recherche en ${(durationMs / 1000).toFixed(2)} s` : '';
  resultStats.textContent = `${count.toLocaleString('fr-FR')} ligne(s) affichée(s) sur ${total.toLocaleString('fr-FR')} au total${duration}.`;
}

function showStatus(message, isError = false) {
  fileInfo.textContent = message;
  fileInfo.style.color = isError ? '#dc2626' : 'var(--muted)';
}

function updateProgress(percent) {
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
  if (Number.isNaN(percent) || percent === undefined) {
    return;
  }

 main
  const clamped = Math.max(0, Math.min(100, percent));
  progressBar.style.width = `${clamped}%`;
}

 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
function sanitizeHeaderValue(value) {
  if (value === null || value === undefined) return '';
  const asString = String(value).replace(/^[\ufeff]+/, '').trim();
  return asString;
}

function normalizeHeaders(rawHeaders = []) {
  const headers = [];
  rawHeaders.forEach((raw, index) => {
    const base = sanitizeHeaderValue(raw) || `Colonne ${index + 1}`;
    let candidate = base;
    let suffix = 2;
    while (headers.includes(candidate)) {
      candidate = `${base} (${suffix})`;
      suffix += 1;
    }
    headers.push(candidate);
  });
  return headers;
}

function isMeaningfulRow(row = []) {
  return Array.isArray(row) && row.some((cell) => {
    if (cell === null || cell === undefined) return false;
    if (typeof cell === 'string') return cell.trim().length > 0;
    return String(cell).trim().length > 0;
  });
}


 main
function initGridColumns(columns) {
  columnDefs = columns.map((col) => ({
    headerName: col,
    field: col,
  }));
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
  setGridOption('columnDefs', columnDefs);

  gridOptions.api.setColumnDefs(columnDefs);
 main
}

function handleFile(file) {
  if (!file) return;
  resetState();
  showStatus(`Chargement de ${file.name} (${formatBytes(file.size)})`);
  currentFileName = file.name;
  if (!/\.(csv|xlsx)$/i.test(file.name)) {
    showStatus('Format non supporté. Veuillez sélectionner un fichier CSV ou XLSX.', true);
    return;
  }
  toggleSearch(false);
  if (file.name.toLowerCase().endsWith('.csv')) {
    parseCsv(file);
  } else {
    parseXlsx(file);
  }
}

function parseCsv(file) {
  dataset = [];
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
  let rawHeaders = null;
  let headers = [];
  let previewRendered = false;

  let headers = null;
 main
  Papa.parse(file, {
    worker: true,
    skipEmptyLines: 'greedy',
    chunkSize: 1024 * 512,
    chunk: (results) => {
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
      if (!rawHeaders) {
        while (results.data.length) {
          const potentialHeader = results.data.shift();
          if (!isMeaningfulRow(potentialHeader)) {
            continue;
          }
          rawHeaders = potentialHeader;
          headers = normalizeHeaders(rawHeaders);
          initGridColumns(headers);
          break;
        }
        if (!rawHeaders) {
          if (typeof results.meta.cursor === 'number') {
            updateProgress((results.meta.cursor / file.size) * 100);
          }
          return;
        }
      }
      if (!headers.length) {
        return;
      }
      const rows = results.data
        .filter((row) => isMeaningfulRow(row))
        .map((row) =>
          headers.reduce((acc, header, index) => {
            acc[header] = row[index] ?? '';
            return acc;
          }, {})
        );
      if (!rows.length) {
        if (typeof results.meta.cursor === 'number') {
          updateProgress((results.meta.cursor / file.size) * 100);
        }
        return;
      }
      dataset.push(...rows);
      if (!previewRendered) {
        setGridOption('rowData', dataset);
        previewRendered = true;
      }
      if (typeof results.meta.cursor === 'number') {
        updateProgress((results.meta.cursor / file.size) * 100);
      }

      if (!headers) {
        headers = results.data.shift();
        if (!headers) return;
        initGridColumns(headers);
      }
      const rows = results.data
        .filter((row) => row.length && row.some((cell) => cell !== null && cell !== ''))
        .map((row) => headers.reduce((acc, header, index) => {
          acc[header] = row[index] ?? '';
          return acc;
        }, {}));
      dataset.push(...rows);
      updateProgress((results.meta.cursor / file.size) * 100);
 main
      updateStats(dataset.length, dataset.length);
    },
    complete: () => {
      finalizeImport(headers);
    },
    error: (error) => {
      console.error(error);
      showStatus(`Erreur lors de la lecture du CSV : ${error.message}`, true);
      toggleSearch(true);
    },
  });
}

function parseXlsx(file) {
  dataset = [];
  const reader = new FileReader();
  reader.onprogress = (event) => {
    if (event.lengthComputable) {
      updateProgress((event.loaded / event.total) * 100 * 0.9);
    }
  };

  reader.onerror = () => {
    showStatus('Impossible de lire le fichier XLSX.', true);
    toggleSearch(true);
  };

  reader.onload = (event) => {
    try {
      const workbook = XLSX.read(event.target.result, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

      const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
 main
      if (!json.length) {
        showStatus('La feuille XLSX sélectionnée est vide.', true);
        toggleSearch(true);
        return;
      }
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
      const rawHeaders = Object.keys(json[0]);
      const headers = normalizeHeaders(rawHeaders);
      initGridColumns(headers);
      dataset = json.map((row) =>
        headers.reduce((acc, header, index) => {
          const sourceKey = rawHeaders[index];
          acc[header] = row[sourceKey] ?? '';
          return acc;
        }, {})
      );

      const headers = Object.keys(json[0]);
      initGridColumns(headers);
      dataset = json;
 main
      updateProgress(100);
      updateStats(dataset.length, dataset.length);
      finalizeImport(headers);
    } catch (error) {
      console.error(error);
      showStatus(`Erreur lors de la lecture du XLSX : ${error.message}`, true);
      toggleSearch(true);
    }
  };
  reader.readAsArrayBuffer(file);
}

function finalizeImport(headers) {
  if (!headers || !headers.length) {
    showStatus('Impossible de détecter les colonnes du fichier.', true);
    toggleSearch(true);
    return;
  }
  filteredData = dataset;
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
  setGridOption('rowData', filteredData);
  updateStats(filteredData.length, dataset.length);
  setExportsAvailability(filteredData.length > 0);
  fileInfo.textContent = `${currentFileName} importé avec succès.`;
  updateProgress(100);
  workerReady = false;
  toggleSearch(false);
  const activeWorker = ensureWorker();
  if (!activeWorker) {
    showStatus('Le moteur de recherche n\'a pas pu être initialisé.', true);
    return;
  }
  activeWorker.postMessage({ type: 'init', payload: { rows: dataset, columns: headers } });

  gridOptions.api.setRowData(filteredData);
  updateStats(filteredData.length, dataset.length);
  setExportsAvailability(filteredData.length > 0);
  fileInfo.textContent = `${currentFileName} importé avec succès.`;
  workerReady = false;
  updateProgress(100);
  toggleSearch(false);
  worker.postMessage({ type: 'init', payload: { rows: dataset, columns: headers } });
 main
}

function performSearch() {
  const query = searchInput.value.trim();
  if (!dataset.length) {
    showStatus('Veuillez importer un fichier avant de lancer une recherche.', true);
    return;
  }
  if (!query) {
    filteredData = dataset;
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
    setGridOption('rowData', filteredData);

    gridOptions.api.setRowData(filteredData);
 main
    updateStats(filteredData.length, dataset.length);
    setExportsAvailability(filteredData.length > 0);
    return;
  }
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
  const activeWorker = ensureWorker();
  if (!activeWorker) {
    toggleSearch(true);
    showStatus('Le moteur de recherche est indisponible.', true);
    return;
  }

 main
  if (!workerReady) {
    showStatus('Initialisation du moteur de recherche... Veuillez patienter.', true);
    return;
  }
  toggleSearch(false);
  currentSearchStart = performance.now();
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
  activeWorker.postMessage({

  worker.postMessage({
 main
    type: 'search',
    payload: {
      query,
      options: {
        caseSensitive: caseSensitiveInput.checked,
        exactMatch: exactMatchInput.checked,
      },
    },
  });
}

function resetSearch() {
  searchInput.value = '';
  caseSensitiveInput.checked = false;
  exactMatchInput.checked = false;
  filteredData = dataset;
 codex/create-web-app-for-importing-xlsx-and-csv-mgkizr
  setGridOption('rowData', filteredData);

  gridOptions.api.setRowData(filteredData);
 main
  updateStats(filteredData.length, dataset.length);
  setExportsAvailability(filteredData.length > 0);
}

function exportToCsv() {
  if (!filteredData.length) return;
  const csv = Papa.unparse(filteredData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', generateExportName('csv'));
  link.click();
  URL.revokeObjectURL(url);
}

function exportToXlsx() {
  if (!filteredData.length) return;
  const worksheet = XLSX.utils.json_to_sheet(filteredData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Résultats');
  XLSX.writeFile(workbook, generateExportName('xlsx'));
}

async function copyToClipboard() {
  if (!filteredData.length) return;
  const csv = Papa.unparse(filteredData);
  try {
    await navigator.clipboard.writeText(csv);
    showStatus('Résultats copiés dans le presse-papiers.');
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = csv;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showStatus('Résultats copiés dans le presse-papiers.');
    } catch (err) {
      showStatus("Impossible de copier dans le presse-papiers.", true);
    }
    document.body.removeChild(textarea);
  }
}

function formatBytes(bytes) {
  if (!bytes) return '0 o';
  const sizes = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(2)} ${sizes[i]}`;
}

function generateExportName(extension) {
  const base = currentFileName ? currentFileName.replace(/\.[^.]+$/, '') : 'resultats';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${base}-filtre-${timestamp}.${extension}`;
}

// Event bindings
uploader.addEventListener('dragover', (event) => {
  event.preventDefault();
  uploader.classList.add('dragover');
});

uploader.addEventListener('dragleave', () => {
  uploader.classList.remove('dragover');
});

uploader.addEventListener('drop', (event) => {
  event.preventDefault();
  uploader.classList.remove('dragover');
  const file = event.dataTransfer?.files?.[0];
  handleFile(file);
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  handleFile(file);
});

searchButton.addEventListener('click', performSearch);
resetButton.addEventListener('click', resetSearch);
exportCsvButton.addEventListener('click', exportToCsv);
exportXlsxButton.addEventListener('click', exportToXlsx);
copyButton.addEventListener('click', copyToClipboard);

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    performSearch();
  }
});

// Initial message
resetState();
