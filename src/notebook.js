/** Utilities for converting Jupyter notebooks (.ipynb) into a readable plain-text script. */

import { readFile } from 'node:fs/promises';

import { InvalidNotebookError } from './errors.js';

/**
 * Process a Jupyter notebook file and return an executable-script-like plain text rendering.
 *
 * @param {string} filePath - Path to the .ipynb file.
 * @param {{includeOutput?: boolean}} [options]
 * @returns {Promise<string>}
 */
export async function processNotebook(filePath, { includeOutput = true } = {}) {
    let notebook;

    try {
        const raw = await readFile(filePath, 'utf-8');

        notebook = JSON.parse(raw);
    } catch (exc) {
        if (exc instanceof SyntaxError) {
            throw new InvalidNotebookError(`Invalid JSON in notebook: ${filePath}`);
        }
        throw exc;
    }

    let cells;
    const worksheets = notebook.worksheets;

    if (worksheets && worksheets.length > 0) {
    // Worksheets are deprecated as of IPEP-17; combine them all.
        cells = worksheets.flatMap((ws) => ws.cells);
    } else {
        cells = notebook.cells;
    }

    const result = ['# Jupyter notebook converted to Python script.'];

    for (const cell of cells) {
        const cellStr = processCell(cell, includeOutput);

        if (cellStr) {
            result.push(cellStr);
        }
    }

    return `${result.join('\n\n') }\n`;
}

function processCell(cell, includeOutput) {
    const cellType = cell.cell_type;

    if (!['markdown', 'code', 'raw'].includes(cellType)) {
        throw new Error(`Unknown cell type: ${cellType}`);
    }

    let cellStr = Array.isArray(cell.source) ? cell.source.join('') : cell.source ?? '';

    if (!cellStr) {
        return null;
    }

    if (cellType === 'markdown' || cellType === 'raw') {
        return `"""\n${cellStr}\n"""`;
    }

    const outputs = cell.outputs;

    if (includeOutput && outputs && outputs.length > 0) {
        const rawLines = [];

        for (const output of outputs) {
            rawLines.push(...extractOutput(output));
        }
        cellStr += `\n# Output:\n#   ${ rawLines.join('\n#   ')}`;
    }

    return cellStr;
}

function extractOutput(output) {
    const outputType = output.output_type;

    if (outputType === 'stream') {
        return output.text;
    }

    if (outputType === 'execute_result' || outputType === 'display_data') {
        return output.data['text/plain'];
    }

    if (outputType === 'error') {
        return [`Error: ${output.ename}: ${output.evalue}`];
    }

    throw new Error(`Unknown output type: ${outputType}`);
}
